import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Container, PageHero, PremiumHero } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, ArrowUpDown, Package, ShoppingCart, ArrowLeftRight, Calendar, MapPin, TrendingUp, CheckCircle, Clock, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { roleMeta } from "@/data/mock";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransactionDetails } from "@/components/common/TransactionDetails";

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
  approved: "bg-blue-100 text-blue-700 border-blue-300",
  in_progress: "bg-purple-100 text-purple-700 border-purple-300",
  completed: "bg-green-100 text-green-700 border-green-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
  rejected: "bg-red-100 text-red-700 border-red-300",
};

const statusIcon: Record<string, any> = {
  pending: Clock,
  approved: CheckCircle,
  in_progress: AlertCircle,
  completed: CheckCircle,
  cancelled: XCircle,
  rejected: XCircle,
};

type TradeRow = Database["public"]["Tables"]["trades"]["Row"];
type PurchaseRequestRow = Database["public"]["Tables"]["purchase_requests"]["Row"];

interface Transaction {
  id: string;
  type: 'trade' | 'purchase';
  status: string;
  created_at: string;
  item_name: string;
  item_image?: string;
  item_category?: string;
  quantity?: number;
  location?: string;
  buyer_name?: string;
  seller_name?: string;
  from_name?: string;
  from_user_id?: string;
  to_user_id?: string | null | undefined;
  notes?: string;
}

export const Route = createFileRoute("/_authenticated/trades")({
  head: () => ({ meta: [{ title: "Transaction History — EcoLoop Siargao" }] }),
  component: TransactionHistoryPage,
});

export function TransactionHistoryPage() {
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "trade" | "purchase">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "in_progress" | "completed" | "cancelled" | "rejected">("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "status">("date_desc");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Analytics states
  const [analytics, setAnalytics] = useState({
    totalTransactions: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
    totalTrades: 0,
    totalPurchases: 0,
    successRate: 0,
  });

  useEffect(() => {
    loadTransactions();
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterStatus, sortBy]);

  const loadTransactions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Run all queries in parallel for better performance
      const [tradesResult, purchasesAsBuyerResult, purchasesAsSellerResult] = await Promise.all([
        supabase
          .from("trades" as any)
          .select("*")
          .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
          .order("created_at", { ascending: false }),
        supabase
          .from("purchase_requests" as any)
          .select(`
            *,
            marketplace_listings!inner (
              user_id,
              title,
              image,
              kind,
              kg,
              barangay
            )
          `)
          .eq("buyer_user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("purchase_requests" as any)
          .select(`
            *,
            marketplace_listings!inner (
              user_id,
              title,
              image,
              kind,
              kg,
              barangay
            )
          `)
          .eq("marketplace_listings.user_id", user.id)
          .order("created_at", { ascending: false })
      ]).catch(err => {
        console.error("Promise.all error:", err);
        throw err;
      });

      const tradesData = tradesResult?.data;
      const tradesError = tradesResult?.error;
      const purchasesAsBuyer = purchasesAsBuyerResult?.data;
      const buyerError = purchasesAsBuyerResult?.error;
      const purchasesAsSeller = purchasesAsSellerResult?.data;
      const sellerError = purchasesAsSellerResult?.error;

      // Combine and deduplicate purchase requests
      const purchaseMap = new Map();
      [...(purchasesAsBuyer || []), ...(purchasesAsSeller || [])].forEach((p: any) => {
        if (!purchaseMap.has(p.id)) {
          purchaseMap.set(p.id, p);
        }
      });
      const purchasesData = Array.from(purchaseMap.values());
      const purchasesError = buyerError || sellerError;

      // Get seller profiles for purchases (when user is buyer)
      // Get buyer profiles for purchases (when user is seller)
      const sellerIds = purchasesData?.map((p: any) => p.marketplace_listings?.user_id).filter(Boolean) || [];
      const buyerIds = purchasesData?.map((p: any) => p.buyer_user_id).filter(Boolean) || [];
      const allUserIds = [...new Set([...sellerIds, ...buyerIds])];
      
      const { data: userProfiles } = allUserIds.length > 0
        ? await supabase.from("profiles" as any).select("id, full_name").in("id", allUserIds)
        : { data: [] };

      const profileMap = new Map(userProfiles?.map((p: any) => [p.id, p.full_name]));

      if (tradesError) {
        console.error("Trades error:", tradesError);
        toast.error(`Unable to load trades: ${tradesError.message}`);
      }
      
      if (purchasesError) {
        console.error("Purchases error:", purchasesError);
        toast.error(`Unable to load purchases: ${purchasesError.message}`);
      }

      if (tradesError || purchasesError) {
        return;
      }

      // Transform trades to transactions
      const tradeTransactions: Transaction[] = (tradesData || []).map((t: any) => ({
        id: t.id,
        type: 'trade' as const,
        status: t.status,
        created_at: t.created_at,
        item_name: t.from_gives,
        quantity: undefined,
        location: undefined,
        buyer_name: t.to_name,
        seller_name: t.from_name,
        from_name: t.from_name,
        from_user_id: t.from_user_id,
        to_user_id: t.to_user_id,
        notes: t.trade_date,
      }));

      // Transform purchases to transactions
      const purchaseTransactions: Transaction[] = (purchasesData || []).map((p: any) => {
        const listing = p.marketplace_listings || {};
        const sellerId = listing.user_id;
        const buyerId = p.buyer_user_id;
        const sellerName = profileMap.get(sellerId) || 'Unknown Seller';
        const buyerName = profileMap.get(buyerId) || p.buyer_name || 'Unknown Buyer';
        
        // Determine if current user is buyer or seller
        const isBuyer = buyerId === user.id;
        const isSeller = sellerId === user.id;

        return {
          id: p.id,
          type: 'purchase' as const,
          status: p.status,
          created_at: p.created_at,
          item_name: listing.title || `Purchase Request #${p.id.slice(0, 8)}`,
          item_image: listing.image,
          item_category: listing.kind,
          quantity: p.quantity_kg, // Use the purchased quantity, not the listing total
          location: listing.barangay,
          buyer_name: buyerName,
          seller_name: sellerName,
          from_name: isBuyer ? buyerName : sellerName,
          from_user_id: isBuyer ? buyerId : sellerId,
          to_user_id: isBuyer ? sellerId : buyerId,
          notes: p.message,
        };
      });

      const allTransactions = [...tradeTransactions, ...purchaseTransactions];
      setTransactions(allTransactions);

      // Calculate analytics
      const completed = allTransactions.filter(t => t.status === 'completed').length;
      const pending = allTransactions.filter(t => t.status === 'pending').length;
      const trades = allTransactions.filter(t => t.type === 'trade').length;
      const purchases = allTransactions.filter(t => t.type === 'purchase').length;
      const successRate = allTransactions.length > 0 ? Math.round((completed / allTransactions.length) * 100) : 0;

      setAnalytics({
        totalTransactions: allTransactions.length,
        completedTransactions: completed,
        pendingTransactions: pending,
        totalTrades: trades,
        totalPurchases: purchases,
        successRate,
      });
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error(`Error loading transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = searchQuery === "" || 
      t.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.seller_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || t.type === filterType;
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === "date_desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "date_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const StatusIcon = statusIcon[filterStatus] || Clock;

  return (
    <>
      <PremiumHero
        title="Transaction History"
        sub="View your complete transaction history including purchases, trades, and exchanges with detailed status tracking."
      />
      <Container className="py-12">
        {/* Analytics Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30">
                <Package className="h-7 w-7" />
              </span>
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="mt-5 font-display text-4xl font-bold text-slate-900">{analytics.totalTransactions}</div>
            <div className="text-sm font-medium text-slate-600 mt-1">Total Transactions</div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30">
                <CheckCircle className="h-7 w-7" />
              </span>
              <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">{analytics.successRate}%</span>
            </div>
            <div className="mt-5 font-display text-4xl font-bold text-slate-900">{analytics.completedTransactions}</div>
            <div className="text-sm font-medium text-slate-600 mt-1">Completed</div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                <ArrowLeftRight className="h-7 w-7" />
              </span>
            </div>
            <div className="mt-5 font-display text-4xl font-bold text-slate-900">{analytics.totalTrades}</div>
            <div className="text-sm font-medium text-slate-600 mt-1">Trades</div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/30">
                <ShoppingCart className="h-7 w-7" />
              </span>
            </div>
            <div className="mt-5 font-display text-4xl font-bold text-slate-900">{analytics.totalPurchases}</div>
            <div className="text-sm font-medium text-slate-600 mt-1">Purchases</div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 p-6 bg-white/80 backdrop-blur-sm border-slate-200">
          <div className="flex flex-col gap-6">
            <div className="relative w-full">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions by product, seller, or buyer..." 
                className="h-14 pl-12 pr-4 text-base rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all shadow-sm"
              />
            </div>
            
            {/* Filter Chips */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Sort:</span>
                <div className="flex gap-2">
                  {[
                    { id: 'date_desc', label: 'Newest' },
                    { id: 'date_asc', label: 'Oldest' },
                    { id: 'status', label: 'Status' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id as any)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        sortBy === option.id
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Type:</span>
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'trade', label: 'Trades' },
                    { id: 'purchase', label: 'Purchases' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setFilterType(option.id as any)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        filterType === option.id
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Status:</span>
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'approved', label: 'Approved' },
                    { id: 'in_progress', label: 'In Progress' },
                    { id: 'completed', label: 'Completed' },
                    { id: 'cancelled', label: 'Cancelled' },
                    { id: 'rejected', label: 'Rejected' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setFilterStatus(option.id as any)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        filterStatus === option.id
                          ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-md shadow-purple-500/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Transaction List */}
        {loading ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <p className="text-slate-600 font-medium">Loading transactions...</p>
            </div>
          </Card>
        ) : filteredTransactions.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-600 font-medium">No transactions found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or search terms</p>
          </Card>
        ) : (
          <div className="grid gap-5">
            {paginatedTransactions.map((transaction) => (
              <Card 
                key={transaction.id} 
				className="p-0 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-slate-200 hover:border-emerald-300"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Product Thumbnail */}
                  <div className="sm:w-48 sm:h-40 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center p-4 border-b sm:border-b-0 sm:border-r border-slate-200">
                    {transaction.item_image ? (
                      <img 
                        src={transaction.item_image} 
                        alt={transaction.item_name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                        <Package className="h-8 w-8 text-emerald-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Card Content */}
                  <div className="flex-1 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        {/* Status and Type Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                            transaction.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            transaction.status === 'approved' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            transaction.status === 'in_progress' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            transaction.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                            transaction.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {transaction.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            transaction.type === 'trade' 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0' 
                              : 'bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0'
                          }`}>
                            {transaction.type === 'trade' ? 'Trade' : 'Purchase'}
                          </Badge>
                        </div>
                        
                        {/* Product Name */}
                        <h3 className="font-display text-xl font-semibold text-slate-900 mb-4">{transaction.item_name}</h3>
                        
                        {/* Metadata Pills */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </div>
                          {transaction.quantity && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                              <Package className="h-3.5 w-3.5" />
                              {transaction.quantity} kg
                            </div>
                          )}
                          {transaction.location && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                              <MapPin className="h-3.5 w-3.5" />
                              {transaction.location}
                            </div>
                          )}
                        </div>
                        
                        {/* Seller/Buyer Info */}
                        <div className="text-sm">
                          <span className="text-slate-500">
                            {transaction.type === 'trade' ? 'Trade between' : 'Purchase from'}{' '}
                            <span className="font-semibold text-slate-900">
                              {transaction.seller_name || transaction.from_name}
                            </span>
                            {transaction.buyer_name && (
                              <span className="text-slate-500">
                                {' and '}
                                <span className="font-semibold text-slate-900">{transaction.buyer_name}</span>
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      {/* View Details Button */}
                      <div className="flex sm:flex-col items-start sm:items-center gap-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-full px-5 py-2.5 border-slate-300 text-slate-700 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700 transition-all duration-200 group"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          View Details
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Card className="p-6 mt-8 bg-white/80 backdrop-blur-sm border-slate-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-600 font-medium">
                Showing <span className="text-slate-900 font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 font-semibold">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> of <span className="text-slate-900 font-semibold">{filteredTransactions.length}</span> transactions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-full px-4 border-slate-300 text-slate-700 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-slate-300 disabled:hover:text-slate-700 transition-all"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      size="sm"
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-full transition-all ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40'
                          : 'border-slate-300 text-slate-700 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700'
                      }`}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-full px-4 border-slate-300 text-slate-700 hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-slate-300 disabled:hover:text-slate-700 transition-all"
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Transaction Details Dialog */}
        {selectedTransaction && (
          <TransactionDetails
            transaction={selectedTransaction}
            open={!!selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
          />
        )}
      </Container>
    </>
  );
}
