import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import {
  Utensils,
  ShoppingCart,
  Recycle,
  Calendar,
  Award,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CircularEconomyWorkflow } from "@/components/CircularEconomyWorkflow";
import { Database } from "@/integrations/supabase/types";

export function HotelDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    wasteSubmitted: 0,
    collectionRequests: 0,
    sustainabilityScore: 75,
  });
  const [recentActivity, setRecentActivity] = useState<Database['public']['Tables']['waste_collections']['Row'][]>([]);

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      try {
        const [{ data: wasteReports, error: wasteError }, { data: collections, error: collectionsError }] = await Promise.all([
          supabase.from("food_waste_reports").select("*").eq("restaurant_id", user.id),
          supabase.from("waste_collections").select("*").order("created_at", { ascending: false }).limit(5),
        ]) as [{ data: any, error: any }, { data: Database['public']['Tables']['waste_collections']['Row'][] | null, error: any }];

        if (wasteError) {
          console.error("Error loading waste reports:", wasteError);
        }
        if (collectionsError) {
          console.error("Error loading collections:", collectionsError);
        }

        const pendingCollections = (collections ?? []).filter((c) => c.status === "scheduled");

        setStats({
          wasteSubmitted: (wasteReports ?? []).length,
          collectionRequests: pendingCollections.length,
          sustainabilityScore: 75,
        });
        setRecentActivity(collections ?? []);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast.error("Could not load hotel dashboard data.");
      }
    };

    void loadDashboardData();
  }, [user]);

  const statCards = [
    {
      title: "Waste Submitted",
      value: `${stats.wasteSubmitted} kg`,
      icon: Recycle,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
      link: "/waste-reports",
    },
    {
      title: "Collection Requests",
      value: stats.collectionRequests,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      link: "/waste-collections",
    },
    {
      title: "Sustainability Score",
      value: `${stats.sustainabilityScore}/100`,
      icon: Award,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      link: "/profile",
    },
  ];

  const quickActions = [
    {
      title: "Report Waste",
      description: "Submit food waste for collection",
      icon: Recycle,
      link: "/waste-reports",
    },
    {
      title: "Browse Produce",
      description: "Buy fresh produce from farmers",
      icon: ShoppingCart,
      link: "/marketplace",
    },
  ];

  if (!profile || profile.primary_role !== "restaurant") {
    return (
      <Container className="py-12">
        <Card className="p-8 text-center border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10">
          <Utensils className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-primary mb-2">Hotel/Restaurant Dashboard</h2>
          <p className="text-slate-600">This dashboard is only available for hotels and restaurants.</p>
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
        <p className="text-slate-600">Manage your produce orders and waste collection.</p>
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
      <div>
        <h2 className="text-xl font-semibold text-primary mb-4">Recent Collections</h2>
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10">
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No recent collections</p>
            </div>
          ) : (
            <div className="divide-y divide-primary/10">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-slate-900">
                      Collection #{activity.id.slice(0, 8)}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activity.status === "scheduled" ? "bg-yellow-100 text-yellow-800" :
                      activity.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                      activity.status === "completed" ? "bg-green-100 text-green-800" :
                      "bg-slate-100 text-slate-800"
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">Scheduled: {new Date(activity.scheduled_date).toLocaleDateString()}</p>
                  {activity.completed_date && (
                    <p className="text-xs text-slate-500 mt-1">
                      Completed: {new Date(activity.completed_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Container>
  );
}
