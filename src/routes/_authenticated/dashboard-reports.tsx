import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, AlertCircle, Users, Recycle, TrendingUp, Leaf, Printer, X } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

export const Route = createFileRoute("/_authenticated/dashboard-reports")({
  head: () => ({ meta: [{ title: "Reports — LGU Dashboard" }] }),
  component: ReportsGeneration,
});

function ReportsGeneration() {
  const { isLguAdmin, profile } = useAuth();
  const [reportType, setReportType] = useState<string>("diversion");
  const [dateRange, setDateRange] = useState<string>("30");
  const [format, setFormat] = useState<string>("pdf");
  const [pageSize, setPageSize] = useState<string>("a4");
  const [generating, setGenerating] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
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

  const pageSizes = [
    { id: "a4", label: "A4 (210 × 297 mm)", width: 210, height: 297 },
    { id: "letter", label: "Letter (8.5 × 11 in)", width: 216, height: 279 },
    { id: "legal", label: "Legal (8.5 × 14 in)", width: 216, height: 356 },
  ];

  useEffect(() => {
    if (!isLguAdmin || !profile?.municipality) return;

    const loadSummary = async () => {
      try {
        const municipality = profile.municipality;
        const [{ data: profilesData }, { data: listingsData }, { data: purchasesData }, { data: wasteReportsData }] = await Promise.all([
          supabase.from("profiles").select("*").eq("municipality", municipality),
          supabase.from("marketplace_listings").select("*"),
          supabase.from("purchase_requests").select("*"),
          supabase.from("food_waste_reports").select("*"),
        ]);

        const profiles = (profilesData || []) as Array<{ id: string; municipality: string | null }>;
        const listings = (listingsData || []) as Array<{ id: string; user_id: string; municipality: string | null; kind: string; price: string | null }>;
        const purchases = (purchasesData || []) as any[];
        const wasteReports = (wasteReportsData || []) as any[];

        const municipalityListings = listings.filter((listing) => {
          if (listing.municipality === municipality) return true;
          const owner = profiles.find((member) => member.id === listing.user_id);
          return owner?.municipality === municipality;
        });
        const listingIds = new Set(municipalityListings.map((listing) => listing.id));

        const municipalityPurchases = purchases.filter((purchase) => listingIds.has(purchase.listing_id));
        const municipalityWasteReports = wasteReports.filter((report) => {
          const owner = profiles.find((member) => member.id === report.restaurant_id);
          return owner?.municipality === municipality;
        });

        const parsePrice = (priceStr: string | null): number => {
          if (!priceStr) return 0;
          const clean = priceStr.replace(/[₱$,]/g, "").split("/")[0].trim();
          const num = Number(clean);
          return isNaN(num) ? 0 : num;
        };

        const freshProduceSales = municipalityPurchases
          .filter((purchase) => purchase.status === "completed")
          .reduce((sum: number, purchase) => {
            const listing = listings.find((item) => item.id === purchase.listing_id);
            if (!listing || listing.kind !== "produce") return sum;
            return sum + (Number(purchase.quantity_kg || 0) * parsePrice(listing.price));
          }, 0);

        const compostSales = municipalityPurchases
          .filter((purchase) => purchase.status === "completed")
          .reduce((sum: number, purchase) => {
            const listing = listings.find((item) => item.id === purchase.listing_id);
            if (!listing || listing.kind !== "compost") return sum;
            return sum + (Number(purchase.quantity_kg || 0) * parsePrice(listing.price));
          }, 0);

        const wasteCollected = municipalityWasteReports
          .filter((report) => ["collected", "processed"].includes(report.status))
          .reduce((sum: number, report) => sum + Number(report.quantity_kg || 0), 0);

        setReportSummary({
          municipality: municipality.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
          members: profiles.length,
          listings: municipalityListings.length,
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
      if (format === "pdf") {
        const selectedPageSize = pageSizes.find((size) => size.id === pageSize) || pageSizes[0];
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [selectedPageSize.width, selectedPageSize.height],
        });

        // Enhanced header with gradient effect
        pdf.setFillColor(34, 139, 34);
        pdf.rect(0, 0, selectedPageSize.width, 40, "F");

        pdf.setFillColor(45, 160, 45);
        pdf.rect(0, 35, selectedPageSize.width, 5, "F");

        pdf.setFontSize(26);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.text("ECOLOOP SIARGAO", selectedPageSize.width / 2, 18, { align: "center" });

        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        pdf.text("Circular Food Economy Platform", selectedPageSize.width / 2, 26, { align: "center" });

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "italic");
        pdf.text("Republic of the Philippines • Province of Surigao del Norte", selectedPageSize.width / 2, 34, { align: "center" });

        // Document title with underline
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(20);
        pdf.setFont("helvetica", "bold");
        pdf.text("MUNICIPALITY REPORT", selectedPageSize.width / 2, 58, { align: "center" });

        pdf.setDrawColor(34, 139, 34);
        pdf.setLineWidth(0.5);
        pdf.line(selectedPageSize.width / 2 - 40, 62, selectedPageSize.width / 2 + 40, 62);

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(80, 80, 80);
        pdf.text(`${reportSummary.municipality} • ${new Date().toLocaleDateString()}`, selectedPageSize.width / 2, 70, { align: "center" });

        // Report configuration section with background
        pdf.setFillColor(245, 245, 245);
        pdf.roundedRect(15, 80, selectedPageSize.width - 30, 35, 3, 3, "F");

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(34, 139, 34);
        pdf.text("REPORT CONFIGURATION", 20, 90);

        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.line(20, 93, selectedPageSize.width - 20, 93);

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(60, 60, 60);
        const configDetails = [
          `Report Type: ${reportTypes.find((type) => type.id === reportType)?.label}`,
          `Date Range: ${dateRanges.find((range) => range.id === dateRange)?.label}`,
          `Page Size: ${pageSizes.find((size) => size.id === pageSize)?.label}`,
        ];

        let yPos = 100;
        configDetails.forEach((detail) => {
          pdf.text(detail, 25, yPos);
          yPos += 7;
        });

        // Statistics section with colored boxes
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(34, 139, 34);
        pdf.text("MUNICIPALITY STATISTICS", 20, yPos + 10);

        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, yPos + 13, selectedPageSize.width - 20, yPos + 13);

        // Stats boxes
        pdf.setFillColor(236, 253, 236);
        pdf.roundedRect(20, yPos + 18, (selectedPageSize.width - 50) / 2, 25, 3, 3, "F");
        pdf.setDrawColor(34, 197, 94);
        pdf.roundedRect(20, yPos + 18, (selectedPageSize.width - 50) / 2, 25, 3, 3, "S");

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(34, 139, 34);
        pdf.text("TOTAL MEMBERS", 25, yPos + 26);

        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(22, 101, 52);
        pdf.text(String(reportSummary.members), 25, yPos + 38);

        pdf.setFillColor(239, 246, 255);
        pdf.roundedRect(selectedPageSize.width / 2 + 5, yPos + 18, (selectedPageSize.width - 50) / 2, 25, 3, 3, "F");
        pdf.setDrawColor(59, 130, 246);
        pdf.roundedRect(selectedPageSize.width / 2 + 5, yPos + 18, (selectedPageSize.width - 50) / 2, 25, 3, 3, "S");

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(37, 99, 235);
        pdf.text("ACTIVE LISTINGS", selectedPageSize.width / 2 + 10, yPos + 26);

        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 64, 175);
        pdf.text(String(reportSummary.listings), selectedPageSize.width / 2 + 10, yPos + 38);

        yPos += 55;

        // Economic activity section
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(34, 139, 34);
        pdf.text("ECONOMIC ACTIVITY", 20, yPos + 5);

        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, yPos + 8, selectedPageSize.width - 20, yPos + 8);

        // Economic activity items with colored backgrounds
        const economicItems = [
          { label: "Fresh Produce Sales", value: `₱${reportSummary.freshProduceSales.toLocaleString()}`, color: [236, 253, 236], borderColor: [34, 197, 94], textColor: [22, 101, 52] },
          { label: "Organic Fertilizer Sales", value: `₱${reportSummary.compostSales.toLocaleString()}`, color: [254, 249, 195], borderColor: [234, 179, 8], textColor: [133, 77, 14] },
          { label: "Food Waste Collected", value: `${reportSummary.wasteCollected.toLocaleString()} kg`, color: [239, 246, 255], borderColor: [59, 130, 246], textColor: [30, 64, 175] },
        ];

        yPos += 15;
        economicItems.forEach((item) => {
          pdf.setFillColor(...item.color);
          pdf.roundedRect(20, yPos, selectedPageSize.width - 40, 18, 3, 3, "F");
          pdf.setDrawColor(...item.borderColor);
          pdf.roundedRect(20, yPos, selectedPageSize.width - 40, 18, 3, 3, "S");

          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...item.textColor);
          pdf.text(item.label, 25, yPos + 11);

          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.text(item.value, selectedPageSize.width - 25, yPos + 11, { align: "right" });

          yPos += 22;
        });

        // Enhanced footer
        pdf.setFillColor(34, 139, 34);
        pdf.rect(0, selectedPageSize.height - 25, selectedPageSize.width, 25, "F");

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.text("EcoLoop Siargao - Circular Food Economy Platform", selectedPageSize.width / 2, selectedPageSize.height - 18, { align: "center" });

        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(220, 220, 220);
        pdf.text(`Report ID: ${Date.now()} | Generated on ${new Date().toLocaleString()}`, selectedPageSize.width / 2, selectedPageSize.height - 10, { align: "center" });

        pdf.save(`EcoLoop_Report_${reportSummary.municipality}_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success(`PDF report generated for ${reportSummary.municipality}`);
      } else {
        // CSV generation
        const csvContent = [
          "Report Type,Date Range,Members,Listings,Fresh Produce Sales,Compost Sales,Food Waste Collected",
          `${reportTypes.find((type) => type.id === reportType)?.label},${dateRanges.find((range) => range.id === dateRange)?.label},${reportSummary.members},${reportSummary.listings},${reportSummary.freshProduceSales},${reportSummary.compostSales},${reportSummary.wasteCollected}`,
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `EcoLoop_Report_${reportSummary.municipality}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`CSV report generated for ${reportSummary.municipality}`);
      }
    } catch (error: any) {
      toast.error(`Failed to generate report: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const selectedPageSize = pageSizes.find((size) => size.id === pageSize) || pageSizes[0];
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>EcoLoop Report - ${reportSummary.municipality}</title>
          <style>
            @page {
              size: ${selectedPageSize.width}mm ${selectedPageSize.height}mm;
              margin: 15mm;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12px;
              line-height: 1.6;
              margin: 0;
              padding: 0;
            }
            .header {
              background-color: #228B22;
              color: white;
              padding: 20px;
              text-align: center;
              margin: -15mm -15mm 20px -15mm;
            }
            .header h1 {
              font-size: 24px;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .header p {
              font-size: 10px;
              margin: 5px 0 0 0;
              opacity: 0.9;
            }
            .document-title {
              text-align: center;
              margin: 30px 0 20px 0;
            }
            .document-title h2 {
              font-size: 18px;
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .document-title p {
              font-size: 12px;
              color: #666;
              margin: 5px 0 0 0;
            }
            .section {
              margin-bottom: 25px;
            }
            .section h3 {
              font-size: 14px;
              margin-bottom: 10px;
              border-bottom: 2px solid #228B22;
              padding-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .detail {
              margin: 8px 0;
              padding: 5px 0;
            }
            .detail span:first-child {
              font-weight: bold;
              display: inline-block;
              width: 220px;
            }
            .footer {
              background-color: #f0f0f0;
              color: #666;
              text-align: center;
              padding: 15px;
              margin: 30px -15mm -15mm -15mm;
              font-size: 9px;
            }
            .footer p {
              margin: 3px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>EcoLoop Siargao</h1>
            <p>Circular Food Economy Platform</p>
            <p>Republic of the Philippines • Province of Surigao del Norte</p>
          </div>
          <div class="document-title">
            <h2>Municipality Report</h2>
            <p>${reportSummary.municipality} • ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="section">
            <h3>Report Configuration</h3>
            <div class="detail"><span>Report Type:</span> ${reportTypes.find((type) => type.id === reportType)?.label}</div>
            <div class="detail"><span>Date Range:</span> ${dateRanges.find((range) => range.id === dateRange)?.label}</div>
            <div class="detail"><span>Page Size:</span> ${pageSizes.find((size) => size.id === pageSize)?.label}</div>
          </div>
          <div class="section">
            <h3>Municipality Statistics</h3>
            <div class="detail"><span>Total Members:</span> ${reportSummary.members}</div>
            <div class="detail"><span>Active Listings:</span> ${reportSummary.listings}</div>
          </div>
          <div class="section">
            <h3>Economic Activity</h3>
            <div class="detail"><span>Fresh Produce Sales:</span> ₱${reportSummary.freshProduceSales.toLocaleString()}</div>
            <div class="detail"><span>Organic Fertilizer Sales:</span> ₱${reportSummary.compostSales.toLocaleString()}</div>
            <div class="detail"><span>Food Waste Collected:</span> ${reportSummary.wasteCollected.toLocaleString()} kg</div>
          </div>
          <div class="footer">
            <p>This report is generated by EcoLoop Siargao - Circular Food Economy Platform</p>
            <p>Report ID: ${Date.now()} | Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          <div>
            <label className="text-sm font-medium mb-2 block">Page Size</label>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizes.map((size) => (
                  <SelectItem key={size.id} value={size.id}>{size.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={handleGenerateReport} disabled={generating} className="flex-1">
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </>
              )}
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex-1">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Report Preview</h2>
          <Button onClick={() => setShowPreviewModal(true)} variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Full Preview
          </Button>
        </div>
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
              <span className="font-medium">Page Size:</span>
              <span>{pageSizes.find((size) => size.id === pageSize)?.label}</span>
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

      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Full Report Preview</DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowPreviewModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="border-2 border-gray-200 rounded-lg bg-white shadow-xl" style={{ minHeight: "600px" }}>
            {/* Formal Header with Gradient */}
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-green-700 text-white p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }}></div>
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Leaf className="h-8 w-8" />
                  <h3 className="text-3xl font-bold uppercase tracking-widest">EcoLoop Siargao</h3>
                  <Leaf className="h-8 w-8" />
                </div>
                <p className="text-base font-medium mt-2 opacity-95 tracking-wide">Circular Food Economy Platform</p>
                <div className="w-24 h-0.5 bg-white/50 mx-auto my-3"></div>
                <p className="text-sm opacity-90 tracking-wider">Republic of the Philippines • Province of Surigao del Norte</p>
              </div>
            </div>

            <div className="p-10">
              {/* Document Title */}
              <div className="text-center mb-10 pb-6 border-b-4 border-green-700">
                <h3 className="text-2xl font-bold uppercase tracking-widest text-gray-900 mb-2">Municipality Report</h3>
                <p className="text-gray-600 font-medium">{reportSummary.municipality} • {new Date().toLocaleDateString()}</p>
              </div>

              <div className="space-y-8">
                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-5 text-green-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    Report Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded border border-gray-100 shadow-sm">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Report Type</span>
                      <p className="font-semibold text-gray-900 text-lg">{reportTypes.find((type) => type.id === reportType)?.label}</p>
                    </div>
                    <div className="bg-white p-4 rounded border border-gray-100 shadow-sm">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Date Range</span>
                      <p className="font-semibold text-gray-900 text-lg">{dateRanges.find((range) => range.id === dateRange)?.label}</p>
                    </div>
                    <div className="bg-white p-4 rounded border border-gray-100 shadow-sm">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Page Size</span>
                      <p className="font-semibold text-gray-900 text-lg">{pageSizes.find((size) => size.id === pageSize)?.label}</p>
                    </div>
                    <div className="bg-white p-4 rounded border border-gray-100 shadow-sm">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Format</span>
                      <p className="font-semibold text-gray-900 text-lg">{formats.find((fmt) => fmt.id === format)?.label}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-5 text-green-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    Municipality Statistics
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border-2 border-green-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="h-6 w-6 text-green-700" />
                        <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">Total Members</span>
                      </div>
                      <p className="text-4xl font-bold text-green-900">{reportSummary.members}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-6 w-6 text-blue-700" />
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Active Listings</span>
                      </div>
                      <p className="text-4xl font-bold text-blue-900">{reportSummary.listings}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-bold uppercase tracking-widest mb-5 text-green-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    Economic Activity
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-5 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-2 border-green-300 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                          <Leaf className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-gray-800 font-semibold text-lg">Fresh Produce Sales</span>
                      </div>
                      <span className="font-bold text-green-800 text-2xl">₱{reportSummary.freshProduceSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-5 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border-2 border-amber-300 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center">
                          <Recycle className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-gray-800 font-semibold text-lg">Organic Fertilizer Sales</span>
                      </div>
                      <span className="font-bold text-amber-800 text-2xl">₱{reportSummary.compostSales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-gray-800 font-semibold text-lg">Food Waste Collected</span>
                      </div>
                      <span className="font-bold text-blue-800 text-2xl">{reportSummary.wasteCollected.toLocaleString()} kg</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formal Footer */}
              <div className="mt-10 pt-8 border-t-4 border-green-700 text-center bg-gradient-to-r from-gray-100 to-gray-50 p-6 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Leaf className="h-4 w-4 text-green-700" />
                  <p className="text-sm text-gray-700 font-semibold">EcoLoop Siargao - Circular Food Economy Platform</p>
                  <Leaf className="h-4 w-4 text-green-700" />
                </div>
                <p className="text-xs text-gray-500 font-medium">Report ID: {Date.now()} | Generated on {new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={handleGenerateReport} disabled={generating} className="flex-1 bg-green-700 hover:bg-green-800">
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </>
              )}
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex-1 border-green-700 text-green-700 hover:bg-green-50">
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
