import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import {
  Sprout,
  Package,
  TrendingUp,
  Bell,
  Leaf,
  Award,
  ShoppingCart,
  ShoppingCart as OrdersIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { CircularEconomyWorkflow } from "@/components/CircularEconomyWorkflow";

type MarketplaceListing = Database["public"]["Tables"]["marketplace_listings"]["Row"];
type Trade = Database["public"]["Tables"]["trades"]["Row"];
type PurchaseRequest = Database["public"]["Tables"]["purchase_requests"]["Row"];

export function FarmerDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalSales: 0,
    sustainabilityScore: 85,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      try {
        const [{ data: listings, error: listingsError }, { data: trades, error: tradesError }] = await Promise.all([
          supabase.from("marketplace_listings").select("*").eq("user_id", user.id),
          supabase
            .from("trades")
            .select("*")
            .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        if (listingsError) {
          console.error("Error loading marketplace listings:", listingsError);
        }
        if (tradesError) {
          console.error("Error loading trades:", tradesError);
        }

        const listingList = (listings ?? []) as MarketplaceListing[];
        const activeListings = listingList.filter((l) => l.kind === "produce");
        const completedTrades = (trades ?? []) as Trade[];
        const completedOrders = completedTrades.filter((t) => t.status === "completed");
        
        // Calculate total sales from completed trades
        const totalSales = completedOrders.reduce((sum, trade) => {
          const price = parseFloat(trade.from_gives.replace(/[^0-9.]/g, "")) || 0;
          return sum + price;
        }, 0);

        // Calculate sustainability score based on activity
        const sustainabilityScore = Math.min(100, 
          50 + (activeListings.length * 5) + (completedOrders.length * 3)
        );

        setStats({
          totalListings: listingList.length,
          activeListings: activeListings.length,
          totalSales,
          sustainabilityScore,
        });
        setRecentActivity(completedTrades);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast.error("Could not load farmer dashboard data.");
      }
    };

    void loadDashboardData();
  }, [user]);

  const statCards = [
    {
      title: "Active Listings",
      value: stats.activeListings,
      icon: Sprout,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      link: "/marketplace",
    },
    {
      title: "Total Sales",
      value: `₱${stats.totalSales.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      link: "/trades",
    },
  ];

  const quickActions = [
    {
      title: "List Produce",
      description: "Add new produce to the marketplace",
      icon: Leaf,
      link: "/marketplace",
    },
  ];

  if (!profile || profile.primary_role !== "farmer") {
    return (
      <Container className="py-12">
        <Card className="p-8 text-center border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10">
          <Sprout className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-primary mb-2">Farmer Dashboard</h2>
          <p className="text-slate-600">This dashboard is only available for farmers.</p>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-primary mb-2">
          Welcome, {profile.full_name}
        </h1>
        <p className="text-slate-600">Manage your produce listings and recent community activity.</p>
      </div>

      {/* Circular Economy Workflow */}
      <div className="mb-8">
        <CircularEconomyWorkflow />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10 hover:border-primary/40 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-600">{stat.title}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.link}>
              <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10 hover:border-primary/40 transition-all cursor-pointer">
                <action.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-slate-900 mb-1">{action.title}</h3>
                <p className="text-sm text-slate-600">{action.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-primary mb-4">Recent Activity</h2>
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No recent activity</p>
              </div>
            ) : (
              <div className="divide-y divide-primary/10">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-slate-900">
                        {activity.from_name} → {activity.to_name}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        activity.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        activity.status === "accepted" ? "bg-green-100 text-green-800" :
                        activity.status === "completed" ? "bg-blue-100 text-blue-800" :
                        "bg-slate-100 text-slate-800"
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{activity.from_gives} for {activity.to_gives}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-primary mb-4">Notifications & Feed</h2>
          <div className="space-y-4">
            <Link to="/notifications">
              <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10 hover:border-primary/40 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-500/10">
                    <Bell className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                    <p className="text-sm text-slate-600">View your recent notifications</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link to="/messages">
              <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10 hover:border-primary/40 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-500/10">
                    <Bell className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">Messages</h3>
                    <p className="text-sm text-slate-600">Stay in touch with buyers and partners</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
