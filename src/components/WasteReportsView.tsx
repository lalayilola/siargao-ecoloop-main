import { useEffect, useState, type FormEvent } from "react";
import { Container } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, CalendarDays, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type WasteReport = Database["public"]["Tables"]["food_waste_reports"]["Row"];
type WasteReportInsert = Database["public"]["Tables"]["food_waste_reports"]["Insert"];

export function WasteReportsView() {
  const { user, profile } = useAuth();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [wasteType, setWasteType] = useState("");
  const [quantityKg, setQuantityKg] = useState(0);
  const [collectionDate, setCollectionDate] = useState("");
  const [collectionAddress, setCollectionAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user || profile?.primary_role !== "restaurant") {
      setIsLoading(false);
      return;
    }

    const loadReports = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("food_waste_reports")
        .select("*")
        .eq("hotel_restaurant_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading waste reports:", error);
        toast.error("Unable to load waste reports.");
        setReports([]);
      } else {
        setReports(data ?? []);
      }
      setIsLoading(false);
    };

    void loadReports();
  }, [user, profile]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !profile) return;

    if (!wasteType.trim() || quantityKg <= 0 || !collectionDate.trim() || !collectionAddress.trim()) {
      toast.error("Please fill in all waste report fields.");
      return;
    }

    setIsSubmitting(true);

    const payload: WasteReportInsert = {
      hotel_restaurant_id: user.id,
      hotel_restaurant_name: profile.full_name,
      waste_type: wasteType.trim(),
      quantity_kg: quantityKg,
      collection_date: collectionDate,
      collection_address: collectionAddress.trim(),
      status: "pending",
    };

    const { data, error } = await supabase
      .from("food_waste_reports")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error submitting waste report:", error);
      toast.error("Could not submit your waste report.");
      setIsSubmitting(false);
      return;
    }

    setReports((prev) => [data, ...prev]);
    setWasteType("");
    setQuantityKg(0);
    setCollectionDate("");
    setCollectionAddress("");
    setShowForm(false);
    setIsSubmitting(false);
    toast.success("Waste report submitted. Collection team will follow up soon.");
  };

  if (!profile || profile.primary_role !== "restaurant") {
    return (
      <Container className="py-12">
        <Card className="mx-auto max-w-xl p-8 text-center">
          <Trash2 className="mx-auto h-12 w-12 text-accent mb-4" />
          <h2 className="text-2xl font-semibold text-primary">Waste Reports</h2>
          <p className="text-slate-600 mt-2">Restaurant accounts can log food waste so collection teams can schedule pickup.</p>
        </Card>
      </Container>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "collected":
        return "bg-green-100 text-green-800";
      case "processed":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <Container className="py-12">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Waste Reports</h1>
          <p className="text-slate-600">Submit and track food waste for composting collection.</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-white gap-2" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Submit Report
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit a Waste Report</DialogTitle>
            <DialogDescription>Share the waste details so LGU collection teams can schedule a pickup.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="waste-type">Waste type</Label>
                <Input
                  id="waste-type"
                  value={wasteType}
                  onChange={(event) => setWasteType(event.target.value)}
                  placeholder="e.g. Vegetable scraps, food trimmings"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity-kg">Quantity (kg)</Label>
                <Input
                  id="quantity-kg"
                  type="number"
                  min={1}
                  value={quantityKg || ""}
                  onChange={(event) => setQuantityKg(Number(event.target.value) || 0)}
                  placeholder="25"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="collection-date">Preferred collection date</Label>
                <Input
                  id="collection-date"
                  type="date"
                  value={collectionDate}
                  onChange={(event) => setCollectionDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection-address">Collection address</Label>
                <Input
                  id="collection-address"
                  value={collectionAddress}
                  onChange={(event) => setCollectionAddress(event.target.value)}
                  placeholder="Barangay, street or landmark"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional details</Label>
              <Textarea
                id="notes"
                rows={4}
                value={""}
                placeholder="Optional note for the collector"
                disabled
                className="opacity-60"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <Card className="p-8 text-center">
          <p className="text-slate-600">Loading waste reports...</p>
        </Card>
      ) : reports.length === 0 ? (
        <Card className="p-12 text-center border-2 border-accent/20">
          <Trash2 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No reports yet</h2>
          <p className="text-slate-600 mb-6">Submit your first food waste report and get collection scheduled.</p>
          <Button className="bg-accent hover:bg-accent/90 text-white gap-2 mx-auto" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Submit First Report
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="p-6 border-2 border-accent/20 hover:border-accent/40 transition-all">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Trash2 className="h-5 w-5 text-accent" />
                    <div>
                      <h3 className="font-semibold text-slate-900">{report.waste_type}</h3>
                      <p className="text-sm text-slate-600">{report.collection_address}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {new Date(report.collection_date).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {report.quantity_kg} kg
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                  <p className="text-xs text-slate-500">Submitted: {new Date(report.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
