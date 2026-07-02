import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, ArrowUpDown, Package, ShoppingCart, ArrowLeftRight, Calendar, MapPin, TrendingUp, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { roleMeta } from "@/data/mock";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransactionDetails } from "@/components/TransactionDetails";

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
      <PageHero
        eyebrow="Transaction History"
        title="Track every exchange, end-to-end."
        sub="View your complete transaction history including purchases, trades, and exchanges with detailed status tracking."
      />
      <Container className="py-12">
        {/* Analytics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 font-display text-3xl font-semibold">{analytics.totalTransactions}</div>
            <div className="text-sm text-muted-foreground">Total Transactions</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-green-100 text-green-700">
                <CheckCircle className="h-5 w-5" />
              </span>
              <span className="text-xs text-green-600 font-medium">{analytics.successRate}%</span>
            </div>
            <div className="mt-4 font-display text-3xl font-semibold">{analytics.completedTransactions}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-700">
                <ArrowLeftRight className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4 font-display text-3xl font-semibold">{analytics.totalTrades}</div>
            <div className="text-sm text-muted-foreground">Trades</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 text-purple-700">
                <ShoppingCart className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4 font-display text-3xl font-semibold">{analytics.totalPurchases}</div>
            <div className="text-sm text-muted-foreground">Purchases</div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..." 
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-1 h-4 w-4" /> Filters
              </Button>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[140px]">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Newest</SelectItem>
                  <SelectItem value="date_asc">Oldest</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Transaction Type</label>
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="trade">Trades</SelectItem>
                    <SelectItem value="purchase">Purchases</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Status</label>
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </Card>

        {/* Transaction List */}
        {loading ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Loading transactions...
          </Card>
        ) : filteredTransactions.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No transactions found
          </Card>
        ) : (
          <div className="grid gap-4">
            {paginatedTransactions.map((transaction) => (
              <Card key={transaction.id} className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className={statusColor[transaction.status]}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {transaction.status}
                      </Badge>
                      <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">
                        {transaction.type === 'trade' ? 'Trade' : 'Purchase'}
                      </Badge>
                    </div>
                    <h3 className="font-display text-lg font-semibold">{transaction.item_name}</h3>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </div>
                      {transaction.quantity && (
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {transaction.quantity} kg
                        </div>
                      )}
                      {transaction.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {transaction.location}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-sm">
                      <span className="text-muted-foreground">
                        {transaction.type === 'trade' ? 'Trade between' : 'Purchase from'}{' '}
                        <span className="font-medium text-slate-900">
                          {transaction.seller_name || transaction.from_name}
                        </span>
                        {transaction.buyer_name && ` and ${transaction.buyer_name}`}
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="rounded-full"
                    onClick={() => setSelectedTransaction(transaction)}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Card className="p-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    size="sm"
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
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
