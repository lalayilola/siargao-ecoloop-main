import { useEffect, useState } from "react";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Check, 
  X, 
  Clock,
  Package
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Trade = Database["public"]["Tables"]["trades"]["Row"];

export function OrdersView() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<Trade[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "accepted" | "rejected" | "completed">("all");

  useEffect(() => {
    if (!user) return;

    const loadOrders = async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(`Unable to load orders: ${error.message}`);
      } else {
        setOrders(data || []);
      }
    };

    void loadOrders();
  }, [user]);

  const handleAcceptOrder = async (orderId: string) => {
    const { error } = await (supabase
      .from("trades") as any)
      .update({ status: "accepted" })
      .eq("id", orderId);

    if (error) {
      toast.error(`Failed to accept order: ${error.message}`);
      return;
    }

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "accepted" } : o));
    toast.success("Order accepted");
  };

  const handleRejectOrder = async (orderId: string) => {
    const { error } = await (supabase
      .from("trades") as any)
      .update({ status: "rejected" })
      .eq("id", orderId);

    if (error) {
      toast.error(`Failed to reject order: ${error.message}`);
      return;
    }

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "rejected" } : o));
    toast.success("Order rejected");
  };

  const handleCompleteOrder = async (orderId: string) => {
    const { error } = await (supabase
      .from("trades") as any)
      .update({ status: "completed" })
      .eq("id", orderId);

    if (error) {
      toast.error(`Failed to complete order: ${error.message}`);
      return;
    }

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "completed" } : o));
    toast.success("Order marked as completed");
  };

  const filteredOrders = orders.filter((order) => {
    return filterStatus === "all" || order.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "accepted":
        return <Check className="h-4 w-4" />;
      case "rejected":
        return <X className="h-4 w-4" />;
      case "completed":
        return <Package className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const pendingCount = orders.filter(o => o.status === "pending").length;

  if (!profile || profile.primary_role !== "farmer") {
    return (
      <Container className="py-12">
        <Card className="p-8 text-center border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10">
          <ShoppingCart className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-primary mb-2">Orders</h2>
          <p className="text-slate-600">This feature is only available for farmers.</p>
        </Card>
      </Container>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Orders"
        title="Manage Your Orders"
        sub="View and manage incoming and outgoing orders for your produce."
      />
      <Container className="py-12">
        {/* Stats */}
        <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10 shadow-sm shadow-primary/10 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
                <p className="text-sm text-slate-600">Pending Orders</p>
              </div>
            </div>
            <div className="flex gap-2">
              {["all", "pending", "accepted", "completed"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status as any)}
                  className={filterStatus === status ? "bg-primary text-white" : "border-primary/40 text-primary hover:bg-primary/10"}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="p-8 text-center border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10">
            <ShoppingCart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No orders found</p>
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
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status}</span>
                        </div>
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                    {order.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptOrder(order.id)}
                          className="bg-green-600 text-white hover:bg-green-600/90"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectOrder(order.id)}
                          className="border-destructive/40 text-destructive hover:bg-destructive/10"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {order.status === "accepted" && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteOrder(order.id)}
                        className="bg-blue-600 text-white hover:bg-blue-600/90"
                      >
                        <Package className="mr-2 h-4 w-4" />
                        Mark as Completed
                      </Button>
                    )}
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
