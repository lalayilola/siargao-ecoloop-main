import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Recycle, Leaf, Users, Handshake, TrendingUp, ShieldAlert, Megaphone, FileText, UserCheck, BarChart3, Store, Truck, Package, Calendar, Globe } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "LGU Dashboard — EcoLoop Siargao" }] }),
  component: DashboardPage,
});

const chartColors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

const roleColors = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6"];

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
  const [recentMessages, setRecentMessages] = useState<Database["public"]["Tables"]["notifications"]["Row"][]>([]);
  const [realStats, setRealStats] = useState<{
    totalUsers: number;
    farmers: number;
    hotels: number;
    localUsers: number;
    lguAdmins: number;
    totalListings: number;
    totalTrades: number;
    wasteCollected: number;
    pendingCollections: number;
  }>({
    totalUsers: 0,
    farmers: 0,
    hotels: 0,
    localUsers: 0,
    lguAdmins: 0,
    totalListings: 0,
    totalTrades: 0,
    wasteCollected: 0,
    pendingCollections: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

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

      const messages: Database["public"]["Tables"]["notifications"]["Row"][] = data ?? [];
      setRecentMessages(messages);
      setUnreadMessages(messages.filter((n) => !n.read_at).length);
    };

    const loadRealStats = async () => {
      try {
        const [usersResult, listingsResult, tradesResult, wasteResult, collectionsResult] = await Promise.all([
          supabase.from("profiles").select("*"),
          supabase.from("marketplace_listings").select("*"),
          supabase.from("trades").select("*"),
          supabase.from("food_waste_reports").select("*"),
          supabase.from("waste_collections").select("*"),
        ]);

        const users = usersResult.data || [];
        const listings = listingsResult.data || [];
        const trades = tradesResult.data || [];
        const wasteReports = wasteResult.data || [] as Database["public"]["Tables"]["food_waste_reports"]["Row"][];
        const wasteCollections = collectionsResult.data || [] as Database["public"]["Tables"]["waste_collections"]["Row"][];

        const wasteCollected = wasteCollections
          .filter((c) => c.status === "completed")
          .reduce((sum: number, c) => {
            const report = wasteReports.find((w) => w.id === c.waste_report_id);
            return sum + (report?.quantity_kg || 0);
          }, 0);

        const pendingCollections = wasteCollections.filter((c) => c.status === "scheduled").length;

        setRealStats({
          totalUsers: users.length,
          farmers: users.filter((u: any) => u.primary_role === "farmer").length,
          hotels: users.filter((u: any) => u.primary_role === "hotel_restaurant").length,
          localUsers: users.filter((u: any) => u.primary_role === "resident").length,
          lguAdmins: users.filter((u: any) => u.primary_role === "lgu_admin").length,
          totalListings: listings.length,
          totalTrades: trades.length,
          wasteCollected,
          pendingCollections,
        });
      } catch (error) {
        console.error("Error loading real stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMessageNotifications();
    loadRealStats();
  }, [user]);

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
          <Button asChild className="mt-5"><Link to="/feed">Back to EcoFeed</Link></Button>
        </Card>
      </Container>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="LGU Admin"
        title="Island impact, at a glance."
        sub="Track waste collected, diversion rates, active members and successful trades across every barangay."
      />
      <Container className="py-12">
        {/* Quick Navigation Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Link to="/dashboard-diversion" className="group">
            <Card className="p-5 transition-all hover:shadow-lg hover:border-primary/30">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Recycle className="h-5 w-5" />
                </span>
                <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="mt-4 font-display text-lg font-semibold">Monitor Diversion</div>
              <div className="text-sm text-muted-foreground">Track food diversion activities</div>
            </Card>
          </Link>
          <Link to="/dashboard-users" className="group">
            <Card className="p-5 transition-all hover:shadow-lg hover:border-primary/30">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <UserCheck className="h-5 w-5" />
                </span>
                <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="mt-4 font-display text-lg font-semibold">User Management</div>
              <div className="text-sm text-muted-foreground">Manage farmers, restaurants, locals</div>
            </Card>
          </Link>
          <Link to="/dashboard-announcements" className="group">
            <Card className="p-5 transition-all hover:shadow-lg hover:border-primary/30">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Megaphone className="h-5 w-5" />
                </span>
                <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="mt-4 font-display text-lg font-semibold">Announcements</div>
              <div className="text-sm text-muted-foreground">Create and manage announcements</div>
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
              <div className="text-sm text-muted-foreground">Generate downloadable reports</div>
            </Card>
          </Link>
        </div>

        {/* KPI Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Users} label="Total Users" value={realStats.totalUsers.toLocaleString()} />
          <Stat icon={Leaf} label="Farmers" value={realStats.farmers.toLocaleString()} />
          <Stat icon={Store} label="Hotels" value={realStats.hotels.toLocaleString()} />
          <Stat icon={Handshake} label="Total Trades" value={realStats.totalTrades.toLocaleString()} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Truck} label="Waste Collected" value={`${realStats.wasteCollected.toLocaleString()} kg`} />
          <Stat icon={Calendar} label="Pending Collections" value={realStats.pendingCollections.toLocaleString()} />
          <Stat icon={Globe} label="Environmental Impact" value="High" sub="Active" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">User Distribution by Role</h3>
              <span className="text-xs text-muted-foreground">Active users by type</span>
            </div>
            <div className="mt-4 h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie 
                    data={[
                      { name: "Farmers", value: realStats.farmers },
                      { name: "Hotels", value: realStats.hotels },
                      { name: "Local Users", value: realStats.localUsers },
                      { name: "LGU Admins", value: realStats.lguAdmins },
                    ]} 
                    dataKey="value" 
                    nameKey="name" 
                    innerRadius={50} 
                    outerRadius={90} 
                    paddingAngle={3}
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <Cell key={i} fill={roleColors[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--color-popover)", borderRadius: 12, border: "1px solid var(--color-border)" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold">Platform Activity</h3>
            <div className="mt-4 h-72">
              <ResponsiveContainer>
                <BarChart data={[
                  { name: "Users", value: realStats.totalUsers },
                  { name: "Listings", value: realStats.totalListings },
                  { name: "Trades", value: realStats.totalTrades },
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
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">Unread messages</h3>
                <p className="text-sm text-muted-foreground">New direct chat alerts for your LGU account.</p>
              </div>
              <span className="inline-flex h-12 min-w-[3rem] items-center justify-center rounded-2xl bg-primary/10 text-primary text-lg font-semibold">
                {unreadMessages}
              </span>
            </div>
            <div className="mt-6 space-y-3">
              <p className="text-sm text-slate-600">Check the message notifications below to see who has reached out.</p>
              <div className="rounded-3xl border border-primary/15 bg-slate-50 p-4">
                {recentMessages.length === 0 ? (
                  <p className="text-sm text-slate-500">No recent message alerts.</p>
                ) : (
                  <ul className="space-y-3 text-sm text-slate-700">
                    {recentMessages.map((message) => (
                      <li key={message.id} className="rounded-2xl bg-white p-3 shadow-sm border border-border">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{message.title}</p>
                          {!message.read_at && <Badge className="bg-primary/10 text-primary border-primary/20">New</Badge>}
                        </div>
                        <p className="mt-2 text-xs text-slate-500">{message.message}</p>
                        <p className="mt-2 text-xs text-slate-400">{new Date(message.created_at).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold">Message activity</h3>
            <p className="mt-2 text-sm text-muted-foreground">Quick view of the latest inbound message notifications for the LGU dashboard.</p>
            <div className="mt-6 grid gap-4">
              {recentMessages.slice(0, 4).map((notification) => (
                <div key={notification.id} className="rounded-3xl border border-border/70 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{notification.title}</p>
                    <span className="text-xs text-slate-500">{notification.read_at ? "Read" : "Unread"}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{notification.message}</p>
                </div>
              ))}
              {recentMessages.length === 0 && <p className="text-sm text-slate-500">No message alerts yet.</p>}
            </div>
          </Card>
        </div>

        <Card className="mt-8 p-6">
          <h3 className="font-display text-lg font-semibold">Recent Activity</h3>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading activity...</p>
          ) : realStats.totalTrades === 0 ? (
            <p className="text-muted-foreground text-center py-8">No recent activity to display</p>
          ) : (
            <p className="text-sm text-muted-foreground mt-4">
              Platform has {realStats.totalUsers} registered users with {realStats.totalTrades} completed trades.
            </p>
          )}
        </Card>
      </Container>
    </>
  );
}
