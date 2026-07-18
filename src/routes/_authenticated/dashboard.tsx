import { createFileRoute, Link } from "@tanstack/react-router";

import { useEffect, useState } from "react";

import { Container, PageHero } from "@/components/layout/Section";

import { Card } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Recycle, Leaf, Users, Handshake, TrendingUp, ShieldAlert, FileText, UserCheck, BarChart3, Store, Truck, Calendar, Globe, ArrowRightLeft } from "lucide-react";

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



function Stat({ icon: Icon, label, value, sub }: { icon: typeof Recycle; label: string; value: string; sub?: string }) {

  return (

    <Card className="p-5">

      <div className="flex items-center justify-between">

        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">

          <Icon className="h-5 w-5" />

        </span>

        {sub && (

          <span className="inline-flex items-center gap-1 text-xs text-primary">

            <TrendingUp className="h-3.5 w-3.5" /> {sub}

          </span>

        )}

      </div>

      <div className="mt-4 font-display text-3xl font-semibold">{value}</div>

      <div className="text-sm text-muted-foreground">{label}</div>

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

            const unitValue = Number(listing.price ?? "0");

            return sum + (Number(purchase.quantity_kg || 0) * unitValue);

          }, 0);



        const compostSales = municipalityPurchases

          .filter((purchase) => purchase.status === "completed")

          .reduce((sum, purchase) => {

            const listing = listings.find((item) => item.id === purchase.listing_id);

            if (!listing || listing.kind !== "compost") return sum;

            const unitValue = Number(listing.price ?? "0");

            return sum + (Number(purchase.quantity_kg || 0) * unitValue);

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

        // Filter by time period
        const now = new Date();
        const timeFilter = (purchase: PurchaseRow) => {
          const purchaseDate = new Date(purchase.created_at);
          if (timePeriod === 'daily') {
            // Last 7 days
            const daysAgo = 7;
            const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
            return purchaseDate >= cutoff;
          } else {
            // Last 30 days (monthly view)
            const daysAgo = 30;
            const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
            return purchaseDate >= cutoff;
          }
        };

        const timeFilteredPurchases = completedProducePurchases.filter(timeFilter);

        // Debug: log purchases and listings
        console.log('Total municipality purchases:', municipalityPurchases.length);
        console.log('Completed produce purchases:', completedProducePurchases.length);
        console.log('Time filtered purchases:', timeFilteredPurchases.length);
        console.log('Total listings:', listings.length);

        timeFilteredPurchases.forEach((purchase) => {
          const listing = listings.find((item) => item.id === purchase.listing_id);
          console.log('Purchase listing match:', purchase.listing_id, listing ? 'Found' : 'Not found');
          if (listing && listing.kind === "produce") {
            const productName = listing.title || listing.category || "Unknown";
            const quantity = Number(purchase.quantity_kg || 0);
            console.log('Adding to sales:', productName, quantity);
            vegetableSalesMap.set(productName, (vegetableSalesMap.get(productName) || 0) + quantity);
          }
        });

        const vegetableSalesData = Array.from(vegetableSalesMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);

        console.log('Final vegetable sales data:', vegetableSalesData);
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

        console.log('Food waste data:', foodWasteData);
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

        console.log('Compost sales data:', compostSalesData);
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

      }

    };



    void loadMessageNotifications();

    void loadMonitoringData();

  }, [profile?.municipality, user]);



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

      <PageHero

        eyebrow="LGU Admin"

        title="Monitoring dashboard for your municipality."

        sub={`Track produce sales, compost activity, food waste collection and member activity across ${monitoringStats.municipalityLabel}.`}

      />

      <Container className="py-12">

        <div className="mb-8 grid gap-4 lg:grid-cols-4">

          <button onClick={() => document.getElementById('monitoring-charts')?.scrollIntoView({ behavior: 'smooth' })} className="group text-left w-full">

            <Card className="p-5 transition-all hover:shadow-lg hover:border-primary/30">

              <div className="flex items-center justify-between">

                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">

                  <BarChart3 className="h-5 w-5" />

                </span>

                <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />

              </div>

              <div className="mt-4 font-display text-lg font-semibold">Monitoring Dashboard</div>

              <div className="text-sm text-muted-foreground">Live municipality activity and circular economy metrics</div>

            </Card>

          </button>

          <Link to="/dashboard-users" className="group">

            <Card className="p-5 transition-all hover:shadow-lg hover:border-primary/30">

              <div className="flex items-center justify-between">

                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">

                  <UserCheck className="h-5 w-5" />

                </span>

                <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />

              </div>

              <div className="mt-4 font-display text-lg font-semibold">Members Dashboard</div>

              <div className="text-sm text-muted-foreground">View and manage farmers, restaurant owners and buyers</div>

            </Card>

          </Link>

          <Link to="/requests" className="group">

            <Card className="p-5 transition-all hover:shadow-lg hover:border-primary/30">

              <div className="flex items-center justify-between">

                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">

                  <ArrowRightLeft className="h-5 w-5" />

                </span>

                <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />

              </div>

              <div className="mt-4 font-display text-lg font-semibold">Transactions Dashboard</div>

              <div className="text-sm text-muted-foreground">Review marketplace purchases, sales and exchanges</div>

            </Card>

          </Link>

          <Link to="/dashboard-reports" className="group">

            <Card className="p-5 transition-all hover:shadow-lg hover:border-primary/30">

              <div className="flex items-center justify-between">

                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">

                  <FileText className="h-5 w-5" />

                </span>

                <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />

              </div>

              <div className="mt-4 font-display text-lg font-semibold">Reports</div>

              <div className="text-sm text-muted-foreground">Generate municipality reports and export data</div>

            </Card>

          </Link>

        </div>



        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <Stat icon={Users} label="Registered members" value={monitoringStats.totalMembers.toLocaleString()} />

          <Stat icon={Leaf} label="Fresh produce sales" value={`₱${monitoringStats.freshProduceSales.toLocaleString()}`} />

          <Stat icon={Recycle} label="Organic fertilizer sales" value={`₱${monitoringStats.compostSales.toLocaleString()}`} />

          <Stat icon={Truck} label="Food waste collected" value={`${monitoringStats.foodWasteCollected.toLocaleString()} kg`} />

        </div>



        <div id="monitoring-charts" className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">

          <Card className="p-6">

            <div className="flex items-center justify-between">

              <h3 className="font-display text-lg font-semibold">Municipality circular economy overview</h3>

              <span className="text-xs text-muted-foreground">Scoped to {monitoringStats.municipalityLabel}</span>

            </div>

            <div className="mt-4 h-72">

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

                  <Tooltip contentStyle={{ background: "var(--color-popover)", borderRadius: 12, border: "1px solid var(--color-border)" }} />

                  <Bar dataKey="value" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </Card>



          <Card className="p-6">

            <div className="flex items-center justify-between">

              <h3 className="font-display text-lg font-semibold">Member mix</h3>

              <span className="text-xs text-muted-foreground">By role</span>

            </div>

            <div className="mt-4 h-72">

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

                  <Tooltip contentStyle={{ background: "var(--color-popover)", borderRadius: 12, border: "1px solid var(--color-border)" }} />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </Card>

        </div>


        <Card className="mt-8 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Vegetable Sales by Type</h3>
              <p className="text-sm text-muted-foreground">Top 10 vegetables sold in {monitoringStats.municipalityLabel}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={timePeriod === 'daily' ? 'default' : 'outline'}
                onClick={() => setTimePeriod('daily')}
              >
                Daily
              </Button>
              <Button
                size="sm"
                variant={timePeriod === 'monthly' ? 'default' : 'outline'}
                onClick={() => setTimePeriod('monthly')}
              >
                Monthly
              </Button>
            </div>
          </div>
          <div className="mt-4 h-72">
            {vegetableSalesData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No vegetable sales data available
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={vegetableSalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-popover)", borderRadius: 12, border: "1px solid var(--color-border)" }}
                    formatter={(value: any) => [`${Number(value || 0).toFixed(2)} kg`, 'Quantity']}
                  />
                  <Bar dataKey="value" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="mt-8 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Food Waste by Restaurant</h3>
              <p className="text-sm text-muted-foreground">Top 10 restaurants by food waste submitted in {monitoringStats.municipalityLabel}</p>
            </div>
          </div>
          <div className="mt-4 h-72">
            {foodWasteData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No food waste data available
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={foodWasteData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-popover)", borderRadius: 12, border: "1px solid var(--color-border)" }}
                    formatter={(value: any) => [`${Number(value || 0).toFixed(2)} kg`, 'Quantity']}
                  />
                  <Bar dataKey="value" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="mt-8 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Compost Sales by Product</h3>
              <p className="text-sm text-muted-foreground">Top 10 compost products sold in {monitoringStats.municipalityLabel}</p>
            </div>
          </div>
          <div className="mt-4 h-72">
            {compostSalesData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No compost sales data available
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={compostSalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-popover)", borderRadius: 12, border: "1px solid var(--color-border)" }}
                    formatter={(value: any) => [`${Number(value || 0).toFixed(2)} kg`, 'Quantity']}
                  />
                  <Bar dataKey="value" fill="var(--color-chart-4)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>


        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          <Card className="p-6">

            <div className="flex items-center justify-between">

              <div>

                <h3 className="font-display text-lg font-semibold">Recent members</h3>

                <p className="text-sm text-muted-foreground">Latest registrations in your municipality.</p>

              </div>

              <Badge className="bg-primary/10 text-primary border-primary/20">{monitoringStats.totalMembers}</Badge>

            </div>

            <div className="mt-6 space-y-3">

              {membersPreview.length === 0 ? (

                <p className="text-sm text-slate-500">No members recorded for this municipality yet.</p>

              ) : (

                membersPreview.map((member) => (

                  <div key={member.id} className="rounded-2xl border border-border/70 bg-slate-50 p-3">

                    <div className="flex items-center justify-between gap-3">

                      <p className="font-medium text-slate-900">{member.full_name}</p>

                      <Badge className="bg-primary/10 text-primary border-primary/20">{member.primary_role}</Badge>

                    </div>

                    <p className="mt-1 text-sm text-slate-600">{member.barangay || "Barangay not set"}</p>

                  </div>

                ))

              )}

            </div>

          </Card>



          <Card className="p-6">

            <div className="flex items-center justify-between">

              <div>

                <h3 className="font-display text-lg font-semibold">Recent transactions</h3>

                <p className="text-sm text-muted-foreground">Latest purchases, sales and exchanges in the municipality.</p>

              </div>

              <Badge className="bg-secondary/20 text-secondary-foreground border-secondary/20">{monitoringStats.completedTransactions}</Badge>

            </div>

            <div className="mt-6 space-y-3">

              {transactionsPreview.length === 0 ? (

                <p className="text-sm text-slate-500">No marketplace transactions for this municipality yet.</p>

              ) : (

                transactionsPreview.map((transaction) => (

                  <div key={transaction.id} className="rounded-2xl border border-border/70 bg-white p-3">

                    <div className="flex items-center justify-between gap-3">

                      <p className="font-medium text-slate-900">{transaction.title}</p>

                      <Badge className={transaction.status === "completed" ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}>{transaction.status}</Badge>

                    </div>

                    <p className="mt-1 text-sm text-slate-600">{transaction.actor}</p>

                    <p className="mt-1 text-xs text-slate-500">{new Date(transaction.created_at).toLocaleString()}</p>

                  </div>

                ))

              )}

            </div>

          </Card>

        </div>



        <Card className="mt-8 p-6">

          <h3 className="font-display text-lg font-semibold">Municipality-only access</h3>

          <p className="mt-2 text-sm text-muted-foreground">

            This admin workspace only shows users, listings, transactions and reports that belong to {monitoringStats.municipalityLabel}.

          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">

            <div className="rounded-2xl border border-border/70 bg-slate-50 p-4">

              <p className="text-sm text-slate-500">Members</p>

              <p className="mt-2 text-2xl font-semibold">{monitoringStats.totalMembers}</p>

            </div>

            <div className="rounded-2xl border border-border/70 bg-slate-50 p-4">

              <p className="text-sm text-slate-500">Listings</p>

              <p className="mt-2 text-2xl font-semibold">{monitoringStats.activeListings}</p>

            </div>

            <div className="rounded-2xl border border-border/70 bg-slate-50 p-4">

              <p className="text-sm text-slate-500">Pending requests</p>

              <p className="mt-2 text-2xl font-semibold">{monitoringStats.pendingRequests}</p>

            </div>

          </div>

        </Card>

      </Container>

    </>

  );

}

