import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Container } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Recycle, Search, Filter, MapPin, Calendar, Scale, Users, AlertCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Pie, PieChart, Cell } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard-diversion")({
  head: () => ({ meta: [{ title: "Monitor Diversion — LGU Dashboard" }] }),
  component: MonitorDiversion,
});

type DiversionActivity = {
  id: string;
  listing_id: string;
  listing_title: string;
  seller_id: string;
  seller_name: string;
  buyer_id: string;
  buyer_name: string;
  quantity: number;
  unit: string;
  status: string;
  location: string;
  created_at: string;
  completed_at: string | null;
};

function MonitorDiversion() {
  const { isLguAdmin } = useAuth();
  const [diversions, setDiversions] = useState<DiversionActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isLguAdmin) return;
    loadDiversions();
  }, [isLguAdmin]);

  const loadDiversions = async () => {
    setLoading(true);
    try {
      // Query real data from trades table without complex relationships
      const { data: tradesData, error } = await supabase
        .from("trades")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const realData: DiversionActivity[] = (tradesData || []).map((trade: any) => ({
        id: trade.id,
        listing_id: trade.listing_id,
        listing_title: "Trade #" + trade.id.substring(0, 8),
        seller_id: trade.seller_id || "",
        seller_name: "Seller",
        buyer_id: trade.buyer_id,
        buyer_name: "Buyer",
        quantity: trade.quantity || 0,
        unit: trade.unit || "kg",
        status: trade.status || "pending",
        location: trade.location || "Unknown",
        created_at: trade.created_at,
        completed_at: trade.completed_at,
      }));

      setDiversions(realData);
    } catch (error: any) {
      toast.error(`Failed to load diversion data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-green-100 text-green-700 border-green-200",
      in_progress: "bg-blue-100 text-blue-700 border-blue-200",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const filteredDiversions = diversions.filter(diversion => {
    const matchesStatus = filterStatus === "all" || diversion.status === filterStatus;
    const matchesLocation = filterLocation === "all" || diversion.location === filterLocation;
    const matchesSearch = searchQuery === "" || 
      diversion.listing_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      diversion.seller_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      diversion.buyer_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesLocation && matchesSearch;
  });

  const totalQuantity = diversions.reduce((sum, d) => sum + d.quantity, 0);
  const completedQuantity = diversions.filter(d => d.status === "completed").reduce((sum, d) => sum + d.quantity, 0);
  const diversionRate = totalQuantity > 0 ? Math.round((completedQuantity / totalQuantity) * 100) : 0;
  const uniqueLocations = Array.from(new Set(diversions.map(d => d.location)));

  const chartData = [
    { name: "Completed", value: diversions.filter(d => d.status === "completed").length },
    { name: "In Progress", value: diversions.filter(d => d.status === "in_progress").length },
    { name: "Pending", value: diversions.filter(d => d.status === "pending").length },
  ];

  const locationData = uniqueLocations.map(location => ({
    name: location,
    value: diversions.filter(d => d.location === location).reduce((sum, d) => sum + d.quantity, 0),
  }));

  const chartColors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

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
        <h1 className="font-display text-3xl font-bold">Monitor Diversion</h1>
        <p className="mt-2 text-muted-foreground">View and track all food diversion activities, status, quantities, locations, and beneficiaries</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Recycle className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold">{totalQuantity.toLocaleString()}</span>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Total Quantity (kg)</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Scale className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold">{completedQuantity.toLocaleString()}</span>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Diverted (kg)</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold">{diversionRate}%</span>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Diversion Rate</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold">{diversions.length}</span>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Total Activities</div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card className="p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Diversion Status</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-popover)", borderRadius: 12, border: "1px solid var(--color-border)" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Quantity by Location</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={locationData}>
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

      {/* Filters */}
      <Card className="p-6 mb-8">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search diversions..."
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
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {uniqueLocations.map(location => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Diversion Activities List */}
      <Card className="p-6">
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading diversion data...</p>
        ) : filteredDiversions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No diversion activities found</p>
        ) : (
          <div className="space-y-4">
            {filteredDiversions.map((diversion) => (
              <div key={diversion.id} className="border rounded-lg p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold">{diversion.listing_title}</h3>
                      <Badge className={getStatusColor(diversion.status)}>{diversion.status}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {diversion.seller_name} → {diversion.buyer_name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        {diversion.quantity} {diversion.unit}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {diversion.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(diversion.created_at).toLocaleDateString()}
                        {diversion.completed_at && (
                          <span>→ Completed: {new Date(diversion.completed_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Container>
  );
}
