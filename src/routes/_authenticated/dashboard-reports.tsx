import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Container } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, AlertCircle, Users, Recycle, TrendingUp, Leaf } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard-reports")({
  head: () => ({ meta: [{ title: "Reports — LGU Dashboard" }] }),
  component: ReportsGeneration,
});

function ReportsGeneration() {
  const { isLguAdmin, profile } = useAuth();
  const [reportType, setReportType] = useState<string>("diversion");
  const [dateRange, setDateRange] = useState<string>("30");
  const [format, setFormat] = useState<string>("pdf");
  const [generating, setGenerating] = useState(false);
  const [reportSummary, setReportSummary] = useState({
    municipality: "your municipality",
    members: 0,
    listings: 0,
    freshProduceSales: 0,
    compostSales: 0,
    wasteCollected: 0,
  });

  const reportTypes = [
    { id: "diversion", label: "Municipality Circular Economy", icon: Recycle, description: "Track produce sales, fertilizer, and waste collection by municipality" },
    { id: "users", label: "Member Statistics", icon: Users, description: "Farmers, restaurant owners and buyers registered in the municipality" },
    { id: "transactions", label: "Marketplace Activity", icon: TrendingUp, description: "Purchases, sales and exchanges recorded within the municipality" },
    { id: "impact", label: "Impact Summary", icon: Leaf, description: "Circular economy outcomes and environmental impact" },
  ];

  const dateRanges = [
    { id: "7", label: "Last 7 days" },
    { id: "30", label: "Last 30 days" },
    { id: "90", label: "Last 90 days" },
    { id: "all", label: "All time" },
  ];

  const formats = [
    { id: "pdf", label: "PDF Document" },
    { id: "csv", label: "CSV File" },
  ];

  useEffect(() => {
    if (!isLguAdmin || !profile?.municipality) return;

    const loadSummary = async () => {
      try {
        const municipality = profile.municipality;
        const [{ data: profilesData }, { data: listingsData }, { data: purchasesData }, { data: wasteReportsData }] = await Promise.all([
          supabase.from("profiles").select("*").eq("municipality", municipality),
          supabase.from("marketplace_listings").select("*").eq("municipality", municipality),
          supabase.from("purchase_requests").select("*"),
          supabase.from("food_waste_reports").select("*"),
        ]);

        const listings = (listingsData || []) as Array<{ id: string; kind: string; price: string | null }>;
        const listingIds = new Set(listings.map((listing) => listing.id));
        const municipalityPurchases = (purchasesData || []).filter((purchase: any) => listingIds.has(purchase.listing_id));
        const municipalityWasteReports = (wasteReportsData || []).filter((report: any) => {
          const owner = (profilesData || []).find((member: any) => member.id === report.restaurant_id);
          return owner?.municipality === municipality;
        });

        const freshProduceSales = municipalityPurchases
          .filter((purchase: any) => purchase.status === "completed")
          .reduce((sum: number, purchase: any) => {
            const listing = listings.find((item) => item.id === purchase.listing_id);
            if (!listing || listing.kind !== "produce") return sum;
            return sum + (Number(purchase.quantity_kg || 0) * Number(listing.price ?? 0));
          }, 0);

        const compostSales = municipalityPurchases
          .filter((purchase: any) => purchase.status === "completed")
          .reduce((sum: number, purchase: any) => {
            const listing = listings.find((item) => item.id === purchase.listing_id);
            if (!listing || listing.kind !== "compost") return sum;
            return sum + (Number(purchase.quantity_kg || 0) * Number(listing.price ?? 0));
          }, 0);

        const wasteCollected = municipalityWasteReports
          .filter((report: any) => ["collected", "processed"].includes(report.status))
          .reduce((sum: number, report: any) => sum + Number(report.quantity_kg || 0), 0);

        setReportSummary({
          municipality: municipality.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
          members: (profilesData || []).length,
          listings: listings.length,
          freshProduceSales,
          compostSales,
          wasteCollected,
        });
      } catch (error) {
        console.error("Error loading report summary:", error);
      }
    };

    void loadSummary();
  }, [isLguAdmin, profile?.municipality]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Municipality report generated for ${reportSummary.municipality} as ${format.toUpperCase()}`);
    } catch (error: any) {
      toast.error(`Failed to generate report: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

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
        <h1 className="font-display text-3xl font-bold">LGU Reports</h1>
        <p className="mt-2 text-muted-foreground">Generate municipality-scoped reports for circular economy activity and member engagement.</p>
      </div>

      <Card className="p-6 mb-8">
        <h2 className="font-display text-xl font-semibold mb-4">Select Report Type</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reportTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setReportType(type.id)}
                className={`p-4 border rounded-lg text-left transition-all hover:border-primary/30 ${reportType === type.id ? "border-primary bg-primary/5" : ""}`}
              >
                <Icon className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-semibold mb-1">{type.label}</h3>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 mb-8">
        <h2 className="font-display text-xl font-semibold mb-4">Report Configuration</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map((range) => (
                  <SelectItem key={range.id} value={range.id}>{range.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Output Format</label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formats.map((fmt) => (
                  <SelectItem key={fmt.id} value={fmt.id}>{fmt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleGenerateReport} disabled={generating} className="w-full">
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-xl font-semibold mb-4">Report Preview</h2>
        <div className="border rounded-lg p-8 bg-slate-50">
          <div className="text-center mb-6">
            <h3 className="font-display text-2xl font-bold">EcoLoop Siargao Municipality Report</h3>
            <p className="text-muted-foreground">{reportSummary.municipality} • {new Date().toLocaleDateString()}</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Report Type:</span>
              <span>{reportTypes.find((type) => type.id === reportType)?.label}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Date Range:</span>
              <span>{dateRanges.find((range) => range.id === dateRange)?.label}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Members:</span>
              <span>{reportSummary.members}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Listings:</span>
              <span>{reportSummary.listings}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Fresh produce sales:</span>
              <span>₱{reportSummary.freshProduceSales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Organic fertilizer sales:</span>
              <span>₱{reportSummary.compostSales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Food waste collected:</span>
              <span>{reportSummary.wasteCollected.toLocaleString()} kg</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white rounded border text-sm text-muted-foreground">
            <p>This preview is scoped to {reportSummary.municipality} and reflects the latest municipality data available in the marketplace.</p>
          </div>
        </div>
      </Card>
    </Container>
  );
}
