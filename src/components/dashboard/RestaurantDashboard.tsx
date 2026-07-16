import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import {
  UtensilsCrossed,
  TrendingUp,
  Package,
  Leaf,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type PurchaseRequest = Database["public"]["Tables"]["purchase_requests"]["Row"];
type WasteReport = Database["public"]["Tables"]["food_waste_reports"]["Row"];
type WasteCollection = Database["public"]["Tables"]["waste_collections"]["Row"];

export function RestaurantDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    wasteReports: 0,
    collectionRequests: 0,
  });
  const [recentActivity, setRecentActivity] = useState<WasteReport[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      try {
        const { data: reportData, error: reportError } = await supabase
          .from("food_waste_reports")
          .select("*")
          .eq("restaurant_id", user.id)
          .returns<WasteReport[]>();

        const reportIds = (reportData ?? []).map((report) => report.id);
        const { data: collectionData, error: collectionError } = reportIds.length
          ? await supabase.from("waste_collections").select("*").in("waste_report_id", reportIds)
          : { data: [], error: null };

        if (reportError) {
          console.error("Error loading waste reports:", reportError);
        }
        if (collectionError) {
          console.error("Error loading waste collections:", collectionError);
        }

        setStats({
          wasteReports: reportData?.length || 0,
          collectionRequests: collectionData?.length || 0,
        });
        setRecentActivity(reportData?.slice(0, 5) || []);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast.error("Could not load restaurant dashboard data.");
      }
    };

    void loadDashboardData();
  }, [user]);

  const statCards = [
    {
      title: "Waste Reports",
      value: stats.wasteReports,
      icon: Leaf,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      link: "/waste-reports",
    },
    {
      title: "Collection Requests",
      value: stats.collectionRequests,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      link: "/waste-collections",
    },
  ];

  const quickActions = [
    {
      title: "Browse Produce",
      description: "Find fresh produce from local farmers",
      icon: Leaf,
      link: "/marketplace",
    },
    {
      title: "View Activity",
      description: "Review recent trades and requests",
      icon: Package,
      link: "/trades",
    },
  ];

  if (!profile || profile.primary_role !== "restaurant") {
    return (
      <Container className="py-12">
        <Card className="p-8 text-center border-2 border-accent/30 bg-gradient-to-br from-white to-accent/10">
          <UtensilsCrossed className="h-16 w-16 text-accent mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-accent mb-2">Restaurant Dashboard</h2>
          <p className="text-slate-600">This dashboard is only available for restaurants and hotels.</p>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-accent mb-2">Welcome, {profile.full_name}</h1>
        <p className="text-slate-600">Manage your produce sourcing and recent activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className="p-6 border-2 border-accent/20 bg-gradient-to-br from-white to-accent/10 hover:border-accent/40 transition-all cursor-pointer">
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

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-accent mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.link}>
              <Card className="p-6 border-2 border-accent/20 bg-gradient-to-br from-white to-accent/10 hover:border-accent/40 transition-all cursor-pointer">
                <action.icon className="h-8 w-8 text-accent mb-3" />
                <h3 className="font-semibold text-slate-900 mb-1">{action.title}</h3>
                <p className="text-sm text-slate-600">{action.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-accent mb-4">Recent Orders</h2>
          <Card className="border-2 border-accent/20 bg-gradient-to-br from-white to-accent/10">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No recent orders</p>
              </div>
            ) : (
              <div className="divide-y divide-accent/10">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-slate-900">Order from farmer</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        activity.status === "scheduled" ? "bg-yellow-100 text-yellow-800" :
                        activity.status === "collected" ? "bg-green-100 text-green-800" :
                        activity.status === "processed" ? "bg-blue-100 text-blue-800" :
                        "bg-slate-100 text-slate-800"
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">Fresh produce purchase</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(activity.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-accent mb-4">Quick Links</h2>
          <div className="space-y-4">
            <Link to="/messages">
              <Card className="p-6 border-2 border-accent/20 bg-gradient-to-br from-white to-accent/10 hover:border-accent/40 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-500/10">
                    <Leaf className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">Messages</h3>
                    <p className="text-sm text-slate-600">Stay connected with farmers and suppliers</p>
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
