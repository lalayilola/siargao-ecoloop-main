import { createFileRoute, Link } from "@tanstack/react-router";

import { useEffect, useState, useRef } from "react";

import { Container, PageHero, PremiumHero } from "@/components/layout/Section";

import { Card } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Recycle, Leaf, Users, Handshake, TrendingUp, ShieldAlert, FileText, UserCheck, BarChart3, Store, Truck, Calendar, Globe, ArrowRightLeft, RefreshCw, ArrowRight, Activity, CheckCircle, AlertTriangle, Droplets } from "lucide-react";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

import { useAuth } from "@/hooks/use-auth";

import { supabase } from "@/integrations/supabase/client";

import type { Database } from "@/integrations/supabase/types";


type ProduceRow = {
  id: string;
  farmer_id: string;
  farmer_name: string;
  product_name: string;
  category: string;
  quantity_kg: number;
  price_per_kg: number;
  created_at: string;
};


export const Route = createFileRoute("/_authenticated/dashboard")({

  head: () => ({ meta: [{ title: "LGU Monitoring Dashboard — EcoLoop Siargao" }] }),

  component: DashboardPage,

});



const roleColors = ["#10b981", "#f59e0b", "#3b82f6"];

// Counter animation hook
function useCounter(value: number, duration = 1000) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    countRef.current = 0;
    const increment = value / (duration / 16);
    
    const animate = () => {
      countRef.current += increment;
      if (countRef.current < value) {
        setCount(Math.floor(countRef.current));
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return count;
}



type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

type UserProfileRow = {

  id: string;

  full_name: string;

  primary_role: string;

  barangay: string | null;

  municipality: string | null;

  created_at: string;

};

type ListingRow = {

  id: string;

  user_id: string;
  kind: "produce" | "waste" | "compost";

  title: string;
  category: string | null;
  price: string | null;

  municipality: string | null;

};

type PurchaseRow = {

  id: string;

  listing_id: string;

  buyer_name: string;

  status: string;

  quantity_kg: number | null;

  created_at: string;

};

type TradeRow = {

  id: string;

  listing_id: string;

  requester_name: string;

  status: string;

  created_at: string;

};



type MemberSummary = {

  id: string;

  full_name: string;

  primary_role: string;

  barangay: string | null;

  municipality: string | null;

  created_at: string;

};



type TransactionSummary = {

  id: string;

  title: string;

  actor: string;

  status: string;

  created_at: string;

};



function Stat({ icon: Icon, label, value, sub, trend }: { icon: typeof Recycle; label: string; value: string; sub?: string; trend?: string }) {
  const numericValue = parseFloat(value.replace(/[₱, kg]/g, '')) || 0;
  const animatedValue = useCounter(numericValue, 1500);
  const displayValue = value.includes('₱') ? `₱${animatedValue.toLocaleString()}` : 
                       value.includes('kg') ? `${animatedValue.toLocaleString()} kg` :
                       animatedValue.toLocaleString();
  
  return (
    <Card className="p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30">
          <Icon className="h-7 w-7" />
        </span>
        {trend && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <TrendingUp className="h-3.5 w-3.5" /> {trend}
          </span>
        )}
      </div>
      <div className="font-display text-3xl font-bold text-slate-900 mb-1">{displayValue}</div>
      <div className="text-sm text-slate-600 font-medium">{label}</div>
      {sub && (
        <div className="text-xs text-slate-500 mt-1">{sub}</div>
      )}
    </Card>
  );
}



function DashboardPage() {

  const { isLguAdmin, profile, user } = useAuth();

  const [unreadMessages, setUnreadMessages] = useState(0);

  const [recentMessages, setRecentMessages] = useState<NotificationRow[]>([]);

  const [monitoringStats, setMonitoringStats] = useState({

    municipalityLabel: "your municipality",

    totalMembers: 0,

    farmers: 0,

    restaurants: 0,

    buyers: 0,

    activeListings: 0,

    freshProduceSales: 0,

    compostSales: 0,

    foodWasteCollected: 0,

    completedTransactions: 0,

    pendingRequests: 0,

  });

  const [membersPreview, setMembersPreview] = useState<MemberSummary[]>([]);

  const [transactionsPreview, setTransactionsPreview] = useState<TransactionSummary[]>([]);

  const [loading, setLoading] = useState(true);

  const [vegetableSalesData, setVegetableSalesData] = useState<Array<{ name: string; value: number }>>([]);
  const [timePeriod, setTimePeriod] = useState<'daily' | 'monthly'>('monthly');
  const [foodWasteData, setFoodWasteData] = useState<Array<{ name: string; value: number }>>([]);
  const [compostSalesData, setCompostSalesData] = useState<Array<{ name: string; value: number }>>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMonitoringData = async () => {
    try {
      const municipality = profile.municipality;
      const [profilesResult, listingsResult, purchaseResult, tradeResult, wasteReportResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("municipality", municipality),
        supabase.from("marketplace_listings").select("*").eq("municipality", municipality),
        supabase.from("purchase_requests").select("*"),
        supabase.from("trade_requests").select("*"),
        supabase.from("food_waste_reports").select("*"),
      ]);

      const profiles = (profilesResult.data || []) as UserProfileRow[];
      const listings = (listingsResult.data || []) as ListingRow[];
      const purchases = (purchaseResult.data || []) as PurchaseRow[];
      const trades = (tradeResult.data || []) as TradeRow[];
      const wasteReports = (wasteReportResult.data || []) as Array<{ id: string; restaurant_id: string; quantity_kg: number; status: string }>;

      const listingIds = new Set(listings.map((listing) => listing.id));

      const municipalityPurchases = purchases.filter((purchase) => listingIds.has(purchase.listing_id));
      const municipalityTrades = trades.filter((trade) => listingIds.has(trade.listing_id));
      const municipalityWasteReports = wasteReports.filter((report) => {
        const owner = profiles.find((member) => member.id === report.restaurant_id);
        return owner?.municipality === municipality;
      });

      const freshProduceSales = municipalityPurchases
        .filter((purchase) => purchase.status === "completed")
        .reduce((sum, purchase) => {
          const listing = listings.find((item) => item.id === purchase.listing_id);
          if (!listing || listing.kind !== "produce") return sum;
          const unitValue = Number(listing.price) || 0;
          const quantity = Number(purchase.quantity_kg) || 0;
          return sum + (quantity * unitValue);
        }, 0);

      const compostSales = municipalityPurchases
        .filter((purchase) => purchase.status === "completed")
        .reduce((sum, purchase) => {
          const listing = listings.find((item) => item.id === purchase.listing_id);
          if (!listing || listing.kind !== "compost") return sum;
          const unitValue = Number(listing.price) || 0;
          const quantity = Number(purchase.quantity_kg) || 0;
          return sum + (quantity * unitValue);
        }, 0);

      const foodWasteCollected = municipalityWasteReports
        .filter((report) => ["collected", "processed"].includes(report.status))
        .reduce((sum, report) => sum + Number(report.quantity_kg || 0), 0);

      const completedTransactions = [
        ...municipalityPurchases.filter((purchase) => ["accepted", "completed"].includes(purchase.status)),
        ...municipalityTrades.filter((trade) => ["accepted", "completed"].includes(trade.status)),
      ].length;

      const pendingRequests = [
        ...municipalityPurchases.filter((purchase) => purchase.status === "pending"),
        ...municipalityTrades.filter((trade) => trade.status === "pending"),
      ].length;

      // Process vegetable sales data
      const completedProducePurchases = municipalityPurchases.filter((purchase) => purchase.status === "completed");
      const vegetableSalesMap = new Map<string, number>();

      const now = new Date();
      const timeFilter = (purchase: PurchaseRow) => {
        const purchaseDate = new Date(purchase.created_at);
        if (timePeriod === 'daily') {
          const daysAgo = 7;
          const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          return purchaseDate >= cutoff;
        } else {
          const daysAgo = 30;
          const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          return purchaseDate >= cutoff;
        }
      };

      const timeFilteredPurchases = completedProducePurchases.filter(timeFilter);

      timeFilteredPurchases.forEach((purchase) => {
        const listing = listings.find((item) => item.id === purchase.listing_id);
        if (listing && listing.kind === "produce") {
          const productName = listing.title || listing.category || "Unknown";
          const quantity = Number(purchase.quantity_kg || 0);
          vegetableSalesMap.set(productName, (vegetableSalesMap.get(productName) || 0) + quantity);
        }
      });

      const vegetableSalesData = Array.from(vegetableSalesMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      setVegetableSalesData(vegetableSalesData);

      // Process food waste data by restaurant
      const restaurantWasteMap = new Map<string, number>();
      municipalityWasteReports.forEach((report) => {
        const restaurant = profiles.find((member) => member.id === report.restaurant_id);
        if (restaurant && restaurant.primary_role === "restaurant") {
          const restaurantName = restaurant.full_name;
          const quantity = Number(report.quantity_kg || 0);
          restaurantWasteMap.set(restaurantName, (restaurantWasteMap.get(restaurantName) || 0) + quantity);
        }
      });

      const foodWasteData = Array.from(restaurantWasteMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      setFoodWasteData(foodWasteData);

      // Process compost sales data
      const completedCompostPurchases = municipalityPurchases.filter((purchase) => purchase.status === "completed");
      const compostSalesMap = new Map<string, number>();

      completedCompostPurchases.forEach((purchase) => {
        const listing = listings.find((item) => item.id === purchase.listing_id);
        if (listing && listing.kind === "compost") {
          const productName = listing.title || listing.category || "Unknown";
          const quantity = Number(purchase.quantity_kg || 0);
          compostSalesMap.set(productName, (compostSalesMap.get(productName) || 0) + quantity);
        }
      });

      const compostSalesData = Array.from(compostSalesMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      setCompostSalesData(compostSalesData);

      setMonitoringStats({
        municipalityLabel: municipality.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
        totalMembers: profiles.length,
        farmers: profiles.filter((member) => member.primary_role === "farmer").length,
        restaurants: profiles.filter((member) => member.primary_role === "restaurant").length,
        buyers: profiles.filter((member) => member.primary_role === "resident").length,
        activeListings: listings.length,
        freshProduceSales,
        compostSales,
        foodWasteCollected,
        completedTransactions,
        pendingRequests,
      });

      setMembersPreview(
        profiles
          .slice()
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map((member) => ({
            id: member.id,
            full_name: member.full_name,
            primary_role: member.primary_role,
            barangay: member.barangay,
            municipality: member.municipality,
            created_at: member.created_at,
          })),
      );

      setTransactionsPreview(
        [
          ...municipalityPurchases.map((purchase) => ({
            id: purchase.id,
            title: `Purchase request • ${purchase.buyer_name}`,
            actor: purchase.buyer_name,
            status: purchase.status,
            created_at: purchase.created_at,
          })),
          ...municipalityTrades.map((trade) => ({
            id: trade.id,
            title: `Trade request • ${trade.requester_name}`,
            actor: trade.requester_name,
            status: trade.status,
            created_at: trade.created_at,
          })),
        ]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 6),
      );

    } catch (error) {
      console.error("Error loading LGU monitoring data:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const refreshData = async () => {
    if (!user || !profile?.municipality) return;
    setIsRefreshing(true);
    await loadMonitoringData();
    setLastRefresh(new Date());
  };


  useEffect(() => {
    if (!user || !profile?.municipality) {
      setLoading(false);
      return;
    }

    const loadMessageNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "message")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error loading message notifications:", error);
        return;
      }

      const messages = (data || []) as NotificationRow[];
      setRecentMessages(messages);
      setUnreadMessages(messages.filter((notification) => !notification.read_at).length);
    };

    void loadMessageNotifications();
    void loadMonitoringData();
  }, [profile?.municipality, user, timePeriod]);



  if (!isLguAdmin) {

    return (

      <Container className="py-12">

        <Card className="mx-auto max-w-xl p-8 text-center">

          <ShieldAlert className="mx-auto h-10 w-10 text-primary" />

          <h2 className="mt-3 font-display text-2xl font-semibold">LGU access only</h2>

          <p className="mt-2 text-sm text-muted-foreground">

            {profile?.primary_role === "lgu_admin"

              ? "Your LGU account is awaiting approval from an EcoLoop administrator."

              : "This dashboard is reserved for verified Local Government Unit accounts."}

          </p>

          <Button asChild className="mt-5"><Link to="/marketplace">Back to Marketplace</Link></Button>

        </Card>

      </Container>

    );

  }



  return (

    <>

      <PremiumHero
        title="LGU Monitoring Dashboard"
        sub={`Track produce sales, compost activity, food waste collection and member activity across ${monitoringStats.municipalityLabel}.`}
        action={
          <Button
            onClick={refreshData}
            disabled={isRefreshing}
            className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/30"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        }
      />

      <Container className="py-12 relative">
        {/* Animated Background Gradient */}
        <style>{`
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          .animate-gradient-shift {
            background-size: 200% 200%;
            animation: gradient-shift 50s ease infinite;
          }
          .animate-float-slow {
            animation: float-slow 8s ease-in-out infinite;
          }
        `}</style>
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white to-mint-50/50 animate-gradient-shift" style={{ animationDuration: '50s' }} />
          <div className="absolute top-20 left-20 text-6xl opacity-[0.05] animate-float-slow">🍃</div>
          <div className="absolute top-40 right-32 text-5xl opacity-[0.05] animate-float-slow" style={{ animationDelay: '2s' }}>🍃</div>
          <div className="absolute bottom-32 left-40 text-4xl opacity-[0.05] animate-float-slow" style={{ animationDelay: '4s' }}>♻</div>
          <div className="absolute bottom-20 right-20 text-5xl opacity-[0.05] animate-float-slow" style={{ animationDelay: '6s' }}>🍃</div>
          <div className="absolute top-1/2 left-1/3 text-4xl opacity-[0.05] animate-float-slow" style={{ animationDelay: '8s' }}>💧</div>
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-4">
          <button onClick={() => document.getElementById('monitoring-charts')?.scrollIntoView({ behavior: 'smooth' })} className="group text-left w-full">
            <Card className="p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-7 w-7" />
                </span>
                <ArrowRight className="h-5 w-5 text-emerald-600 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
              <div className="font-display text-lg font-bold text-slate-900 mb-1">Monitoring Dashboard</div>
              <div className="text-sm text-slate-600 flex-1">Live municipality activity and circular economy metrics</div>
            </Card>
          </button>

          <Link to="/dashboard-users" className="group">
            <Card className="p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                  <UserCheck className="h-7 w-7" />
                </span>
                <ArrowRight className="h-5 w-5 text-emerald-600 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
              <div className="font-display text-lg font-bold text-slate-900 mb-1">Members Dashboard</div>
              <div className="text-sm text-slate-600 flex-1">View and manage farmers, restaurant owners and buyers</div>
            </Card>
          </Link>

          <Link to="/requests" className="group">
            <Card className="p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                  <ArrowRightLeft className="h-7 w-7" />
                </span>
                <ArrowRight className="h-5 w-5 text-emerald-600 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
              <div className="font-display text-lg font-bold text-slate-900 mb-1">Transactions Dashboard</div>
              <div className="text-sm text-slate-600 flex-1">Review marketplace purchases, sales and exchanges</div>
            </Card>
          </Link>

          <Link to="/dashboard-reports" className="group">
            <Card className="p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-7 w-7" />
                </span>
                <ArrowRight className="h-5 w-5 text-emerald-600 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
              <div className="font-display text-lg font-bold text-slate-900 mb-1">Reports</div>
              <div className="text-sm text-slate-600 flex-1">Generate municipality reports and export data</div>
            </Card>
          </Link>
        </div>



        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <Stat icon={Users} label="Registered members" value={monitoringStats.totalMembers.toLocaleString()} trend="+3 today" sub="Updated 2m ago" />

          <Stat icon={Leaf} label="Fresh produce sales" value={`₱${monitoringStats.freshProduceSales.toLocaleString()}`} trend="+12% this week" sub="Monthly total" />

          <Stat icon={Recycle} label="Organic fertilizer sales" value={`₱${monitoringStats.compostSales.toLocaleString()}`} trend="+8% this week" sub="Monthly total" />

          <Stat icon={Truck} label="Food waste collected" value={`${monitoringStats.foodWasteCollected.toLocaleString()} kg`} trend="+5% this week" sub="Monthly total" />

        </div>



        <div id="monitoring-charts" className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">Municipality circular economy overview</h3>
                <p className="text-sm text-slate-500">Key metrics for {monitoringStats.municipalityLabel}</p>
              </div>
            </div>
            <div className="mt-4 h-56">
              <ResponsiveContainer>
                <BarChart data={[
                  { name: "Produce sales", value: monitoringStats.freshProduceSales },
                  { name: "Compost sales", value: monitoringStats.compostSales },
                  { name: "Waste collected", value: monitoringStats.foodWasteCollected },
                  { name: "Listings", value: monitoringStats.activeListings },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--color-popover)", borderRadius: 12, border: "1px solid var(--color-border)", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                  <Bar dataKey="value" fill="var(--color-chart-1)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">Member mix</h3>
                <p className="text-sm text-slate-500">Distribution by role</p>
              </div>
            </div>
            <div className="mt-4 h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Farmers", value: monitoringStats.farmers },
                      { name: "Restaurants", value: monitoringStats.restaurants },
                      { name: "Buyers", value: monitoringStats.buyers },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {[0, 1, 2].map((index) => (
                      <Cell key={index} fill={roleColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--color-popover)", borderRadius: 12, border: "1px solid var(--color-border)", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>


        <Card className="mt-8 p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">Vegetable Sales by Type</h3>
              <p className="text-sm text-slate-500">Top 10 vegetables sold in {monitoringStats.municipalityLabel}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={timePeriod === 'daily' ? 'default' : 'outline'}
                onClick={() => setTimePeriod('daily')}
                className="bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 rounded-full"
              >
                Daily
              </Button>
              <Button
                size="sm"
                variant={timePeriod === 'monthly' ? 'default' : 'outline'}
                onClick={() => setTimePeriod('monthly')}
                className="bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 rounded-full"
              >
                Monthly
              </Button>
            </div>
          </div>
          <div className="mt-4 h-56">
            {vegetableSalesData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                No vegetable sales data available
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={vegetableSalesData.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-popover)", borderRadius: 12, border: "1px solid var(--color-border)", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    formatter={(value: any) => [`${Number(value || 0).toFixed(2)} kg`, 'Quantity']}
                  />
                  <Bar dataKey="value" fill="var(--color-chart-2)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {vegetableSalesData.length > itemsPerPage && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-full"
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600">
                Page {currentPage + 1} of {Math.ceil(vegetableSalesData.length / itemsPerPage)}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(Math.min(Math.ceil(vegetableSalesData.length / itemsPerPage) - 1, currentPage + 1))}
                disabled={currentPage >= Math.ceil(vegetableSalesData.length / itemsPerPage) - 1}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-full"
              >
                Next
              </Button>
            </div>
          )}
        </Card>

        <Card className="mt-8 p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">Food Waste by Restaurant</h3>
              <p className="text-sm text-slate-500">Top 10 restaurants by food waste submitted in {monitoringStats.municipalityLabel}</p>
            </div>
          </div>
          <div className="mt-4 h-56">
            {foodWasteData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                No food waste data available
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={foodWasteData.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-popover)", borderRadius: 12, border: "1px solid var(--color-border)", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    formatter={(value: any) => [`${Number(value || 0).toFixed(2)} kg`, 'Quantity']}
                  />
                  <Bar dataKey="value" fill="var(--color-chart-3)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {foodWasteData.length > itemsPerPage && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-full"
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600">
                Page {currentPage + 1} of {Math.ceil(foodWasteData.length / itemsPerPage)}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(Math.min(Math.ceil(foodWasteData.length / itemsPerPage) - 1, currentPage + 1))}
                disabled={currentPage >= Math.ceil(foodWasteData.length / itemsPerPage) - 1}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-full"
              >
                Next
              </Button>
            </div>
          )}
        </Card>

        <Card className="mt-8 p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">Compost Sales by Product</h3>
              <p className="text-sm text-slate-500">Top 10 compost products sold in {monitoringStats.municipalityLabel}</p>
            </div>
          </div>
          <div className="mt-4 h-56">
            {compostSalesData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                No compost sales data available
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={compostSalesData.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-popover)", borderRadius: 12, border: "1px solid var(--color-border)", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    formatter={(value: any) => [`${Number(value || 0).toFixed(2)} kg`, 'Quantity']}
                  />
                  <Bar dataKey="value" fill="var(--color-chart-4)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {compostSalesData.length > itemsPerPage && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-full"
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600">
                Page {currentPage + 1} of {Math.ceil(compostSalesData.length / itemsPerPage)}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(Math.min(Math.ceil(compostSalesData.length / itemsPerPage) - 1, currentPage + 1))}
                disabled={currentPage >= Math.ceil(compostSalesData.length / itemsPerPage) - 1}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-full"
              >
                Next
              </Button>
            </div>
          )}
        </Card>


        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">Recent members</h3>
                <p className="text-sm text-slate-500">Latest registrations in your municipality</p>
              </div>
              <Link to="/dashboard-users" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">View All</Link>
            </div>
            <div className="mt-6 space-y-3">
              {membersPreview.length === 0 ? (
                <p className="text-sm text-slate-500">No members recorded for this municipality yet.</p>
              ) : (
                membersPreview.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                      {member.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{member.full_name}</p>
                      <p className="text-sm text-slate-500">{member.barangay || "Barangay not set"}</p>
                    </div>
                    <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      member.primary_role === 'farmer' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                      member.primary_role === 'restaurant' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                      member.primary_role === 'resident' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {member.primary_role}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">Recent transactions</h3>
                <p className="text-sm text-slate-500">Latest purchases, sales and exchanges in the municipality</p>
              </div>
              <Link to="/requests" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">View All</Link>
            </div>
            <div className="mt-6 space-y-3">
              {transactionsPreview.length === 0 ? (
                <p className="text-sm text-slate-500">No marketplace transactions for this municipality yet.</p>
              ) : (
                transactionsPreview.map((transaction) => (
                  <div key={transaction.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      transaction.title.includes('Purchase') ? 'bg-blue-100 text-blue-600' :
                      transaction.title.includes('Trade') ? 'bg-purple-100 text-purple-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {transaction.title.includes('Purchase') ? <Store className="h-5 w-5" /> :
                       transaction.title.includes('Trade') ? <ArrowRightLeft className="h-5 w-5" /> :
                       <Activity className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{transaction.title}</p>
                      <p className="text-sm text-slate-500">{transaction.actor}</p>
                    </div>
                    <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      transaction.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {transaction.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

        </div>



        {/* Municipality Status Widget */}
        <Card className="mt-8 p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">Municipality Health Status</h3>
              <p className="text-sm text-slate-500">Real-time system metrics for {monitoringStats.municipalityLabel}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Activity className="h-4 w-4" />
              <span>Updated {lastRefresh ? new Date(lastRefresh).toLocaleTimeString() : 'just now'}</span>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Marketplace</span>
                <div className={`h-2 w-2 rounded-full ${monitoringStats.activeListings > 0 ? 'bg-green-500' : 'bg-slate-400'}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{monitoringStats.activeListings}</p>
              <p className="text-xs text-slate-500 mt-1">Active listings</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Transactions</span>
                <div className={`h-2 w-2 rounded-full ${monitoringStats.completedTransactions > 0 ? 'bg-green-500' : 'bg-slate-400'}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{monitoringStats.completedTransactions}</p>
              <p className="text-xs text-slate-500 mt-1">Completed</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Member Growth</span>
                <div className={`h-2 w-2 rounded-full ${monitoringStats.totalMembers > 10 ? 'bg-green-500' : monitoringStats.totalMembers > 5 ? 'bg-yellow-500' : 'bg-red-500'}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{monitoringStats.totalMembers}</p>
              <p className="text-xs text-slate-500 mt-1">Total members</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Compost Supply</span>
                <div className={`h-2 w-2 rounded-full ${monitoringStats.compostSales > 0 ? 'bg-green-500' : 'bg-slate-400'}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">₱{monitoringStats.compostSales.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">Sales total</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Waste Collection</span>
                <div className={`h-2 w-2 rounded-full ${monitoringStats.foodWasteCollected > 0 ? 'bg-green-500' : 'bg-slate-400'}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{monitoringStats.foodWasteCollected}kg</p>
              <p className="text-xs text-slate-500 mt-1">Collected</p>
            </div>
          </div>
        </Card>

        <Card className="mt-8 p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm">
          <h3 className="font-display text-lg font-semibold text-slate-900">Municipality-only access</h3>
          <p className="mt-2 text-sm text-slate-500">
            This admin workspace only shows users, listings, transactions and reports that belong to {monitoringStats.municipalityLabel}.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Members</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{monitoringStats.totalMembers}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Listings</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{monitoringStats.activeListings}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Pending requests</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{monitoringStats.pendingRequests}</p>
            </div>
          </div>
        </Card>

      </Container>

    </>

  );

}

