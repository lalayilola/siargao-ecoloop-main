import { useEffect, useMemo, useState } from "react";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Leaf, History, Package, Calendar, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type CompostRequest = Database["public"]["Tables"]["compost_requests"]["Row"];

export function CompostHistoryView() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<CompostRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || profile?.primary_role !== "farmer") return;

    const loadRequests = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("compost_requests")
        .select("*")
        .eq("farmer_id", user.id)
        .order("request_date", { ascending: false });

      setLoading(false);
      if (error) {
        console.error("Error loading compost requests:", error);
        toast.error("Could not load compost history.");
        return;
      }

      setRequests(data ?? []);
    };

    void loadRequests();
  }, [user, profile]);

  const summary = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      completed: requests.filter((r) => r.status === "completed").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    }),
    [requests],
  );

  return (
    <>
      <PageHero
        eyebrow="Compost History"
        title="Compost Request History"
        sub="Track your compost requests, approvals, and completed pickups."
      />
      <Container className="py-12">
        {profile?.primary_role !== "farmer" ? (
          <Card className="mx-auto max-w-2xl p-8 text-center border-2 border-primary/30 bg-secondary/10 shadow-sm shadow-primary/10">
            <Leaf className="mx-auto h-14 w-14 text-primary" />
            <h2 className="mt-4 text-2xl font-semibold text-primary">Farmer access only</h2>
            <p className="mt-2 text-slate-600">
              Compost history is available for registered farmers who request compost from LGU inventory.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <Leaf className="h-6 w-6 text-green-600" />
                  <Badge className="bg-secondary/10 text-secondary border-secondary/20">Total</Badge>
                </div>
                <div className="mt-4 text-3xl font-semibold">{summary.total}</div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <Clock className="h-6 w-6 text-blue-600" />
                  <Badge className="bg-blue-50 text-blue-700 border-blue-100">Pending</Badge>
                </div>
                <div className="mt-4 text-3xl font-semibold">{summary.pending}</div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <Package className="h-6 w-6 text-primary" />
                  <Badge className="bg-primary/10 text-primary border-primary/20">Approved</Badge>
                </div>
                <div className="mt-4 text-3xl font-semibold">{summary.approved}</div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <History className="h-6 w-6 text-slate-700" />
                  <Badge className="bg-slate-100 text-slate-700 border-slate-200">Completed</Badge>
                </div>
                <div className="mt-4 text-3xl font-semibold">{summary.completed}</div>
              </Card>
            </div>

            <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10 shadow-sm shadow-primary/10">
              <h2 className="text-xl font-semibold text-primary">Your requests</h2>
              {loading ? (
                <p className="mt-4 text-sm text-slate-600">Loading compost history...</p>
              ) : requests.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">No compost requests found yet. Submit a request from the compost marketplace.</p>
              ) : (
                <div className="mt-6 space-y-4">
                  {requests.map((request) => (
                    <Card key={request.id} className="p-4 border border-primary/10 bg-primary/5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Request Date</p>
                          <p className="text-base font-semibold text-slate-900">{new Date(request.request_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Requested Qty</p>
                          <p className="text-base font-semibold text-slate-900">{request.quantity_requested_kg} kg</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Status</p>
                          <Badge
                            className={`mt-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                              request.status === "approved"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : request.status === "completed"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : request.status === "rejected"
                                ? "bg-rose-100 text-rose-700 border-rose-200"
                                : "bg-blue-100 text-blue-700 border-blue-200"
                            }`}
                          >
                            {request.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                      {request.notes && <p className="mt-3 text-sm text-slate-600">Notes: {request.notes}</p>}
                      {request.collection_date && <p className="mt-1 text-sm text-slate-500">Collection date: {new Date(request.collection_date).toLocaleDateString()}</p>}
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </Container>
    </>
  );
}
