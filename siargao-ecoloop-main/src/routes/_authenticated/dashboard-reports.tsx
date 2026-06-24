import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Container } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Calendar, AlertCircle, BarChart3, Users, Recycle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard-reports")({
  head: () => ({ meta: [{ title: "Reports — LGU Dashboard" }] }),
  component: ReportsGeneration,
});

function ReportsGeneration() {
  const { isLguAdmin } = useAuth();
  const [reportType, setReportType] = useState<string>("diversion");
  const [dateRange, setDateRange] = useState<string>("30");
  const [format, setFormat] = useState<string>("pdf");
  const [generating, setGenerating] = useState(false);

  const reportTypes = [
    { id: "diversion", label: "Diversion Activities", icon: Recycle, description: "Track food diversion activities, status, quantities, and locations" },
    { id: "users", label: "User Statistics", icon: Users, description: "User demographics, registration trends, and activity levels" },
    { id: "donations", label: "Donations Summary", icon: FileText, description: "Food donations, beneficiaries, and impact metrics" },
    { id: "engagement", label: "Engagement Data", icon: TrendingUp, description: "Platform usage, announcement engagement, and community interaction" },
  ];

  const dateRanges = [
    { id: "7", label: "Last 7 days" },
    { id: "30", label: "Last 30 days" },
    { id: "90", label: "Last 90 days" },
    { id: "365", label: "Last year" },
    { id: "all", label: "All time" },
  ];

  const formats = [
    { id: "pdf", label: "PDF Document" },
    { id: "excel", label: "Excel Spreadsheet" },
    { id: "csv", label: "CSV File" },
  ];

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would:
      // 1. Fetch the relevant data based on report type and date range
      // 2. Format the data according to the selected format
      // 3. Generate and download the file
      
      toast.success(`Report generated successfully as ${format.toUpperCase()}`);
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
        <h1 className="font-display text-3xl font-bold">Reports Generation</h1>
        <p className="mt-2 text-muted-foreground">Generate downloadable reports (PDF, Excel, CSV) for diversion activities, user statistics, donations, and engagement data</p>
      </div>

      {/* Report Type Selection */}
      <Card className="p-6 mb-8">
        <h2 className="font-display text-xl font-semibold mb-4">Select Report Type</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reportTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setReportType(type.id)}
                className={`p-4 border rounded-lg text-left transition-all hover:border-primary/30 ${
                  reportType === type.id ? "border-primary bg-primary/5" : ""
                }`}
              >
                <Icon className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-semibold mb-1">{type.label}</h3>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Report Configuration */}
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
            <Button 
              onClick={handleGenerateReport} 
              disabled={generating}
              className="w-full"
            >
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

      {/* Report Preview */}
      <Card className="p-6">
        <h2 className="font-display text-xl font-semibold mb-4">Report Preview</h2>
        <div className="border rounded-lg p-8 bg-slate-50">
          <div className="text-center mb-6">
            <h3 className="font-display text-2xl font-bold">EcoLoop Siargao Report</h3>
            <p className="text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Report Type:</span>
              <span>{reportTypes.find(t => t.id === reportType)?.label}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Date Range:</span>
              <span>{dateRanges.find(r => r.id === dateRange)?.label}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Format:</span>
              <span>{formats.find(f => f.id === format)?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span className="text-muted-foreground">Ready to generate</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white rounded border text-sm text-muted-foreground">
            <p>This preview shows the report configuration. Click "Generate Report" to create the downloadable file.</p>
            <p className="mt-2">The actual report will contain detailed data based on your selected criteria.</p>
          </div>
        </div>
      </Card>
    </Container>
  );
}
