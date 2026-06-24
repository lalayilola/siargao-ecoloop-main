import { useEffect, useState } from "react";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  History, 
  Search,
  Calendar,
  Package,
  TrendingUp
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function OrderHistoryView() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "completed" | "cancelled">("all");

  useEffect(() => {
    if (!user) return;

    const loadOrderHistory = async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .in("status", ["completed", "rejected", "cancelled"])
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(`Unable to load order history: ${error.message}`);
      } else {
        setOrders(data || []);
      }
    };

    void loadOrderHistory();
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.from_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.to_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.from_gives?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.to_gives?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || 
      (filterType === "completed" && order.status === "completed") ||
      (filterType === "cancelled" && (order.status === "rejected" || order.status === "cancelled"));

    return matchesSearch && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const totalCompleted = orders.filter(o => o.status === "completed").length;
  const totalCancelled = orders.filter(o => o.status === "rejected" || o.status === "cancelled").length;

  if (!profile || profile.primary_role !== "farmer") {
    return (
      <Container className="py-12">
        <Card className="p-8 text-center border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10">
          <History className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-primary mb-2">Order History</h2>
          <p className="text-slate-600">This feature is only available for farmers.</p>
        </Card>
      </Container>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="History"
        title="Order History"
        sub="View your past transactions and trade history."
      />
      <Container className="py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalCompleted}</p>
                <p className="text-sm text-slate-600">Completed Orders</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/10">
                <Package className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalCancelled}</p>
                <p className="text-sm text-slate-600">Cancelled Orders</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10 shadow-sm shadow-primary/10 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, item, or description..."
                className="pl-9 border-primary/30 focus:border-primary focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-2">
              {["all", "completed", "cancelled"].map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type as any)}
                  className={filterType === type ? "bg-primary text-white" : "border-primary/40 text-primary hover:bg-primary/10"}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Order History */}
        {filteredOrders.length === 0 ? (
          <Card className="p-8 text-center border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10">
            <History className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No order history found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="p-6 border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {order.from_name} → {order.to_name}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {order.from_gives} for {order.to_gives}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        <span className="capitalize">{order.status}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <span>{new Date(order.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
