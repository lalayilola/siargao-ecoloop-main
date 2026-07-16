import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, Trash2, CheckCircle, Clock, Truck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type WasteReport = Database["public"]["Tables"]["food_waste_reports"]["Row"];
type WasteCollection = Database["public"]["Tables"]["waste_collections"]["Row"];
type WasteCollectionInsert = Database["public"]["Tables"]["waste_collections"]["Insert"];

export function LGUWasteCollectionView() {
  const { user, profile } = useAuth();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [collections, setCollections] = useState<Record<string, WasteCollection>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    if (!user || profile?.primary_role !== "lgu_admin") {
      setIsLoading(false);
      return;
    }

    const loadReports = async () => {
      setIsLoading(true);
      const { data: reportData, error: reportError } = await supabase
        .from("food_waste_reports")
        .select("*")
        .in("status", ["pending", "scheduled"])
        .order("created_at", { ascending: false });

      if (reportError) {
        console.error("Error loading waste reports:", reportError);
        toast.error("Unable to load waste reports.");
        setReports([]);
        setCollections({});
        setIsLoading(false);
        return;
      }

      const reportsResult = (reportData ?? []) as WasteReport[];
      setReports(reportsResult);

      const reportIds = reportsResult.map((report) => report.id);
      if (reportIds.length === 0) {
        setCollections({} as Record<string, WasteCollection>);
        setIsLoading(false);
        return;
      }

      const { data: collectionData, error: collectionError } = await (supabase
        .from("waste_collections") as any)
        .select("*")
        .in("waste_report_id", reportIds);

      if (collectionError) {
        console.error("Error loading waste collections:", collectionError);
        toast.error("Unable to load waste collections.");
        setCollections({} as Record<string, WasteCollection>);
      } else {
        const collectionMap: Record<string, WasteCollection> = {};
        ((collectionData ?? []) as WasteCollection[]).forEach((collection) => {
          collectionMap[collection.waste_report_id] = collection;
        });
        setCollections(collectionMap);
      }
      setIsLoading(false);
    };

    void loadReports();
  }, [user, profile]);

  const handleScheduleCollection = async () => {
    if (!selectedReport || !scheduledDate) return;

    setIsScheduling(true);

    const payload: WasteCollectionInsert = {
      waste_report_id: selectedReport.id,
      collector_id: selectedReport.restaurant_id,
      collector_name: selectedReport.restaurant_name,
      scheduled_date: scheduledDate,
      status: "scheduled",
    };

    const { data, error } = await supabase
      .from("waste_collections")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error scheduling collection:", error);
      toast.error("Could not schedule collection.");
      setIsScheduling(false);
      return;
    }

    // Update report status
    await supabase
      .from("food_waste_reports")
      .update({ status: "scheduled" })
      .eq("id", selectedReport.id);

    setCollections((prev) => ({ ...prev, [selectedReport.id]: data }));
    setReports((prev) =>
      prev.map((r) => (r.id === selectedReport.id ? { ...r, status: "scheduled" } : r))
    );
    setShowScheduleDialog(false);
    setSelectedReport(null);
    setScheduledDate("");
    setIsScheduling(false);
    toast.success("Collection scheduled successfully.");
  };

  const handleCompleteCollection = async (collection: WasteCollection) => {
    const { error } = await supabase
      .from("waste_collections")
      .update({ status: "completed", completed_date: new Date().toISOString() })
      .eq("id", collection.id);

    if (error) {
      console.error("Error completing collection:", error);
      toast.error("Could not complete collection.");
      return;
    }

    // Update report status
    await supabase
      .from("food_waste_reports")
      .update({ status: "collected" })
      .eq("id", collection.waste_report_id);

    setCollections((prev) => ({
      ...prev,
      [collection.waste_report_id]: { ...collection, status: "completed", completed_date: new Date().toISOString() },
    }));
    setReports((prev) =>
      prev.map((r) => (r.id === collection.waste_report_id ? { ...r, status: "collected" } : r))
    );
    toast.success("Collection marked as completed.");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-orange-100 text-orange-800";
      case "completed":
      case "collected":
        return "bg-green-100 text-green-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  if (!profile || profile.primary_role !== "lgu_admin") {
    return (
      <Container className="py-12">
        <Card className="mx-auto max-w-xl p-8 text-center">
          <Truck className="mx-auto h-12 w-12 text-primary mb-4" />
          <h2 className="text-2xl font-semibold text-primary">Waste Collection Management</h2>
          <p className="text-slate-600 mt-2">This page is for LGU administrators to manage waste collection schedules.</p>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Waste Collection Management</h1>
        <p className="text-slate-600">Schedule and track food waste collection from hotels and restaurants.</p>
      </div>

      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Collection</DialogTitle>
            <DialogDescription>
              Schedule pickup for {selectedReport?.restaurant_name} - {selectedReport?.waste_type}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled-date">Collection Date</Label>
              <Input
                id="scheduled-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="text-sm text-slate-600">
              <p>Waste Type: {selectedReport?.waste_type}</p>
              <p>Quantity: {selectedReport?.quantity_kg} kg</p>
              <p>Address: {selectedReport?.collection_address}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleCollection} disabled={isScheduling}>
              {isScheduling ? "Scheduling..." : "Schedule Collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <Card className="p-8 text-center">
          <p className="text-slate-600">Loading waste reports...</p>
        </Card>
      ) : reports.length === 0 ? (
        <Card className="p-12 text-center border-2 border-primary/20">
          <Trash2 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No pending waste reports</h2>
          <p className="text-slate-600">No food waste reports awaiting collection.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const collection = collections[report.id];
            return (
              <Card key={report.id} className="p-6 border-2 border-primary/20 hover:border-primary/40 transition-all">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Trash2 className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-semibold text-slate-900">{report.restaurant_name}</h3>
                        <p className="text-sm text-slate-600">{report.waste_type}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {report.collection_address}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Preferred: {new Date(report.collection_date).toLocaleDateString()}
                      </span>
                      <span>{report.quantity_kg} kg</span>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    {collection && (
                      <div className="text-sm text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Scheduled: {new Date(collection.scheduled_date).toLocaleDateString()}
                        </span>
                        <span className={`ml-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(collection.status)}`}>
                          {collection.status}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {!collection ? (
                      <Button
                        className="bg-primary hover:bg-primary/90 text-white gap-2"
                        onClick={() => {
                          setSelectedReport(report);
                          setShowScheduleDialog(true);
                        }}
                      >
                        <Calendar className="h-4 w-4" /> Schedule Collection
                      </Button>
                    ) : collection.status === "scheduled" ? (
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                        onClick={() => handleCompleteCollection(collection)}
                      >
                        <CheckCircle className="h-4 w-4" /> Mark Complete
                      </Button>
                    ) : (
                      <Button disabled className="gap-2">
                        <CheckCircle className="h-4 w-4" /> Completed
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Container>
  );
}
