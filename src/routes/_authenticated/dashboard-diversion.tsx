import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Container } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Recycle, Search, Scale, Users, AlertCircle, TrendingUp, ArrowRightLeft, CalendarClock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard-diversion")({
  head: () => ({ meta: [{ title: "Transactions Dashboard — LGU Dashboard" }] }),
  component: TransactionsDashboard,
});

type TransactionItem = {
  id: string;
  title: string;
  actor: string;
  type: "purchase" | "trade";
  status: string;
  amount: number;
  created_at: string;
};

function TransactionsDashboard() {
  const { isLguAdmin, profile } = useAuth();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isLguAdmin || !profile?.municipality) return;
    void loadTransactions();
  }, [isLguAdmin, profile?.municipality]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const municipality = profile?.municipality;
      const [{ data: listingsData }, { data: purchasesData }, { data: tradesData }] = await Promise.all([
        supabase.from("marketplace_listings").select("id").eq("municipality", municipality),
        supabase.from("purchase_requests").select("*"),
        supabase.from("trade_requests").select("*"),
      ]);

      const listingIds = new Set((listingsData || []).map((listing: any) => listing.id));
      const municipalityPurchases = (purchasesData || []).filter((purchase: any) => listingIds.has(purchase.listing_id));
      const municipalityTrades = (tradesData || []).filter((trade: any) => listingIds.has(trade.listing_id));

      const allTransactions: TransactionItem[] = [
        ...municipalityPurchases.map((purchase: any) => ({
          id: purchase.id,
          title: `Purchase request • ${purchase.buyer_name}`,
          actor: purchase.buyer_name,
          type: "purchase" as const,
          status: purchase.status,
          amount: Number(purchase.quantity_kg || 0),
          created_at: purchase.created_at,
        })),
        ...municipalityTrades.map((trade: any) => ({
          id: trade.id,
          title: `Trade request • ${trade.requester_name}`,
          actor: trade.requester_name,
          type: "trade" as const,
          status: trade.status,
          amount: 1,
          created_at: trade.created_at,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTransactions(allTransactions);
    } catch (error: any) {
      toast.error(`Failed to load transactions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesStatus = filterStatus === "all" || transaction.status === filterStatus;
    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesSearch = searchQuery === "" || `${transaction.title} ${transaction.actor}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const completedTransactions = transactions.filter((transaction) => ["accepted", "completed"].includes(transaction.status)).length;
  const pendingTransactions = transactions.filter((transaction) => transaction.status === "pending").length;
  const totalQuantity = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  if (!isLguAdmin) {
    return (
      <Container className="py-12">
        <Card className="mx-auto max-w-xl p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-3 font-display text-2xl font-semibold">LGU access only</h2>
          <p className="mt-2 text-sm text-muted-foreground">This dashboard is reserved for verified Local Government Unit accounts.</p>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Transactions Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Review purchases, sales and exchanges that happened within your municipality.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <ArrowRightLeft className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold">{transactions.length}</span>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">All transactions</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold">{completedTransactions}</span>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Completed</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <CalendarClock className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold">{pendingTransactions}</span>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Pending</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Scale className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold">{totalQuantity}</span>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Items / quantity</div>
        </Card>
      </div>

      <Card className="p-6 mb-8">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="purchase">Purchases</SelectItem>
              <SelectItem value="trade">Trades</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-6">
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading transactions...</p>
        ) : filteredTransactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No marketplace transactions found for this municipality.</p>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="border rounded-lg p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{transaction.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{transaction.actor}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Recycle className="h-4 w-4" />{transaction.type === "purchase" ? "Purchase" : "Trade"}</span>
                      <span className="inline-flex items-center gap-1"><Scale className="h-4 w-4" />{transaction.amount}</span>
                      <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" />{new Date(transaction.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge className={transaction.status === "completed" || transaction.status === "accepted" ? "bg-green-100 text-green-700 border-green-200" : transaction.status === "pending" ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-red-100 text-red-700 border-red-200"}>{transaction.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Container>
  );
}
