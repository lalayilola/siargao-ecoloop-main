import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Container, PremiumHero } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, AlertCircle, Users, Recycle, TrendingUp, Leaf, Printer, X, CheckCircle2, ZoomIn, ZoomOut, Maximize2, RefreshCw, DollarSign, Trash2, ShoppingBag } from "lucide-react";
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
    { id: "diversion", label: "Municipality Circular Economy", icon: Recycle, description: "Track produce sales, fertilizer, and waste collection by municipality", metrics: ["Sales", "Waste", "Compost"] },
    { id: "users", label: "Member Statistics", icon: Users, description: "Farmers, restaurant owners and buyers registered in the municipality", metrics: ["Members", "Roles", "Growth"] },
    { id: "transactions", label: "Marketplace Activity", icon: TrendingUp, description: "Purchases, sales and exchanges recorded within the municipality", metrics: ["Volume", "Revenue", "Rate"] },
    { id: "impact", label: "Impact Summary", icon: Leaf, description: "Circular economy outcomes and environmental impact", metrics: ["CO2", "Waste", "Impact"] },
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
    <>
      <PremiumHero
        title="LGU Reports"
        sub="Generate municipality-scoped reports for circular economy activity and member engagement."
      />
      <Container className="py-12 relative">
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

      {/* SECTION 1 - Report Type Selection */}
      <Card className="p-8 mb-8 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <h2 className="font-display text-2xl font-bold text-slate-900 mb-6">Select Report Type</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {reportTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = reportType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setReportType(type.id)}
                className={`group relative p-6 rounded-2xl border-2 text-left transition-all duration-300 ${
                  isSelected 
                    ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/20' 
                    : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md hover:-translate-y-1'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                  isSelected 
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30' 
                    : 'bg-gradient-to-br from-emerald-100 to-green-200 group-hover:from-emerald-200 group-hover:to-green-300'
                }`}>
                  <Icon className={`h-7 w-7 ${isSelected ? 'text-white' : 'text-emerald-700'}`} />
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 mb-2">{type.label}</h3>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">{type.description}</p>
                <div className="flex flex-wrap gap-2">
                  {type.metrics.map((metric) => (
                    <span key={metric} className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {metric}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* SECTION 2 - Report Configuration */}
      <Card className="p-6 mb-8 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="text-sm font-medium text-slate-700 mb-2 block">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map((range) => (
                  <SelectItem key={range.id} value={range.id}>{range.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-sm font-medium text-slate-700 mb-2 block">Output Format</label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formats.map((fmt) => (
                  <SelectItem key={fmt.id} value={fmt.id}>{fmt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-sm font-medium text-slate-700 mb-2 block">Paper Size</label>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizes.map((size) => (
                  <SelectItem key={size.id} value={size.id}>{size.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-3">
            <Button 
              onClick={handleGenerateReport} 
              disabled={generating} 
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/30"
            >
              {generating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
            <Button 
              onClick={handleGenerateReport} 
              variant="outline" 
              className="h-11 px-6 rounded-xl border-slate-200 hover:bg-slate-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button 
              onClick={handlePrint} 
              variant="outline" 
              className="h-11 px-6 rounded-xl border-slate-200 hover:bg-slate-50"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </Card>

      {/* SECTION 3 - Report Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30">
              <Users className="h-6 w-6" />
            </span>
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 mb-1">{reportSummary.members}</div>
          <div className="text-sm text-slate-600 font-medium">Total Members</div>
        </Card>
        <Card className="p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30">
              <Trash2 className="h-6 w-6" />
            </span>
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 mb-1">{reportSummary.wasteCollected} kg</div>
          <div className="text-sm text-slate-600 font-medium">Waste Collected</div>
        </Card>
        <Card className="p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-green-600 text-white shadow-lg shadow-teal-500/30">
              <ShoppingBag className="h-6 w-6" />
            </span>
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 mb-1">₱{reportSummary.freshProduceSales.toLocaleString()}</div>
          <div className="text-sm text-slate-600 font-medium">Produce Sold</div>
        </Card>
        <Card className="p-6 rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-lg shadow-emerald-600/30">
              <DollarSign className="h-6 w-6" />
            </span>
          </div>
          <div className="font-display text-2xl font-bold text-slate-900 mb-1">₱{(reportSummary.freshProduceSales + reportSummary.compostSales).toLocaleString()}</div>
          <div className="text-sm text-slate-600 font-medium">Revenue Generated</div>
        </Card>
      </div>

      {/* SECTION 3 - Live Report Preview */}
      <Card className="rounded-2xl border border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
        {/* Preview Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">Report Preview</h3>
            <p className="text-xs text-slate-500 mt-1">Last Generated: {new Date().toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-lg hover:bg-emerald-100 text-slate-600 hover:text-emerald-700">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-lg hover:bg-emerald-100 text-slate-600 hover:text-emerald-700">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-lg hover:bg-emerald-100 text-slate-600 hover:text-emerald-700">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-lg hover:bg-emerald-100 text-slate-600 hover:text-emerald-700">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* PDF-style Preview */}
        <div className="p-8 bg-slate-100 overflow-auto max-h-[600px]">
          <div className="bg-white rounded-lg shadow-xl mx-auto max-w-[800px] p-8 min-h-[1000px]">
            {/* Report Header */}
            <div className="text-center mb-8 pb-6 border-b-4 border-emerald-600">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Leaf className="h-8 w-8 text-emerald-600" />
                <h3 className="text-3xl font-bold uppercase tracking-widest text-slate-900">EcoLoop Siargao</h3>
                <Leaf className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-base font-medium text-slate-600 mt-2">Circular Food Economy Platform</p>
              <div className="w-24 h-0.5 bg-emerald-600 mx-auto my-3"></div>
              <p className="text-sm text-slate-500">Republic of the Philippines • Province of Surigao del Norte</p>
            </div>

            {/* Document Title */}
            <div className="text-center mb-10 pb-6 border-b-2 border-slate-300">
              <h3 className="text-2xl font-bold uppercase tracking-widest text-slate-900 mb-2">Municipality Report</h3>
              <p className="text-slate-600 font-medium">{reportSummary.municipality} • {new Date().toLocaleDateString()}</p>
            </div>

            {/* Report Configuration */}
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8">
              <h4 className="text-sm font-bold uppercase tracking-widest mb-5 text-emerald-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                Report Configuration
              </h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded border border-slate-100 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Report Type</span>
                  <p className="font-semibold text-slate-900 text-lg">{reportTypes.find((type) => type.id === reportType)?.label}</p>
                </div>
                <div className="bg-white p-4 rounded border border-slate-100 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Date Range</span>
                  <p className="font-semibold text-slate-900 text-lg">{dateRanges.find((range) => range.id === dateRange)?.label}</p>
                </div>
                <div className="bg-white p-4 rounded border border-slate-100 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Page Size</span>
                  <p className="font-semibold text-slate-900 text-lg">{pageSizes.find((size) => size.id === pageSize)?.label}</p>
                </div>
                <div className="bg-white p-4 rounded border border-slate-100 shadow-sm">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Format</span>
                  <p className="font-semibold text-slate-900 text-lg">{formats.find((fmt) => fmt.id === format)?.label}</p>
                </div>
              </div>
            </div>

            {/* Municipality Statistics */}
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8">
              <h4 className="text-sm font-bold uppercase tracking-widest mb-5 text-emerald-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                Municipality Statistics
              </h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-lg border-2 border-emerald-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-6 w-6 text-emerald-700" />
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Total Members</span>
                  </div>
                  <p className="text-4xl font-bold text-emerald-900">{reportSummary.members}</p>
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

            {/* Economic Activity */}
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8">
              <h4 className="text-sm font-bold uppercase tracking-widest mb-5 text-emerald-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                Economic Activity
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-5 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border-2 border-emerald-300 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                      <Leaf className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-slate-800 font-semibold text-lg">Fresh Produce Sales</span>
                  </div>
                  <span className="text-2xl font-bold text-emerald-900">₱{reportSummary.freshProduceSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-300 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center">
                      <Recycle className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-slate-800 font-semibold text-lg">Organic Fertilizer Sales</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-900">₱{reportSummary.compostSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <Trash2 className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-slate-800 font-semibold text-lg">Food Waste Collected</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-900">{reportSummary.wasteCollected.toLocaleString()} kg</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t-2 border-slate-300 text-center">
              <p className="text-sm text-slate-600">This report is generated by EcoLoop Siargao - Circular Food Economy Platform</p>
              <p className="text-xs text-slate-500 mt-2">Report ID: {Date.now()} | Generated on {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </Card>
    </Container>
    </>
  );
}
