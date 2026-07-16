import { useEffect, useMemo, useState } from "react";
import { Container, PageHero } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Trash2, Leaf, Factory, Globe, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Listing = Database["public"]["Tables"]["marketplace_listings"]["Row"];
type WasteReport = Database["public"]["Tables"]["food_waste_reports"]["Row"];

export function GISMapView() {
  const [marketplaceLocations, setMarketplaceLocations] = useState<Listing[]>([]);
  const [wasteReports, setWasteReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadLocations = async () => {
      setLoading(true);
      const [marketRes, wasteRes] = await Promise.all([
        supabase
          .from("marketplace_listings")
          .select("*")
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("food_waste_reports")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      setLoading(false);

      if (marketRes.error) {
        toast.error("Unable to load marketplace locations.");
        console.error(marketRes.error);
      } else {
        setMarketplaceLocations(marketRes.data ?? []);
      }

      if (wasteRes.error) {
        toast.error("Unable to load waste reports.");
        console.error(wasteRes.error);
      } else {
        setWasteReports(wasteRes.data ?? []);
      }
    };

    void loadLocations();
  }, []);

  const summary = useMemo(
    () => ({
      marketplace: marketplaceLocations.length,
      wasteReports: wasteReports.length,
      compostSites: marketplaceLocations.filter((item) => item.kind === "compost").length,
      reportAddresses: wasteReports.filter((report) => !!report.collection_address).length,
    }),
    [marketplaceLocations, wasteReports],
  );

  return (
    <>
      <PageHero
        eyebrow="GIS Map"
        title="Waste Management Locations"
        sub="Check active collection reports, compost sites, and marketplace pickup locations across Siargao."
      />
      <Container className="py-12">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <Globe className="h-6 w-6 text-primary" />
              <Badge className="bg-primary/10 text-primary border-primary/20">Sites</Badge>
            </div>
            <div className="mt-4 text-3xl font-semibold">{summary.marketplace}</div>
            <p className="text-sm text-slate-500">Marketplace locations with coordinates</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <Trash2 className="h-6 w-6 text-slate-700" />
              <Badge className="bg-slate-100 text-slate-700 border-slate-200">Reports</Badge>
            </div>
            <div className="mt-4 text-3xl font-semibold">{summary.wasteReports}</div>
            <p className="text-sm text-slate-500">Food waste collection reports</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <Leaf className="h-6 w-6 text-green-600" />
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Compost</Badge>
            </div>
            <div className="mt-4 text-3xl font-semibold">{summary.compostSites}</div>
            <p className="text-sm text-slate-500">Compost collection points</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <Building2 className="h-6 w-6 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">Addresses</Badge>
            </div>
            <div className="mt-4 text-3xl font-semibold">{summary.reportAddresses}</div>
            <p className="text-sm text-slate-500">Reports with an address</p>
          </Card>
        </div>

        <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10 shadow-sm shadow-primary/10">
          <h2 className="text-xl font-semibold text-primary">Location insights</h2>
          {loading ? (
            <p className="mt-4 text-sm text-slate-600">Loading location data...</p>
          ) : (
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Marketplace locations</h3>
                </div>
                {marketplaceLocations.length === 0 ? (
                  <p className="text-sm text-slate-600">No marketplace locations with coordinates available.</p>
                ) : (
                  <div className="space-y-3">
                    {marketplaceLocations.slice(0, 6).map((item) => (
                      <Card key={item.id} className="p-4 border border-primary/10 bg-primary/5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm text-slate-500">{item.kind === "compost" ? "Compost" : item.kind === "waste" ? "Waste" : "Produce"}</p>
                            <p className="font-semibold text-slate-900">{item.title}</p>
                            <p className="text-xs text-slate-500">{item.location_name || item.barangay || item.location_address || "No location name"}</p>
                          </div>
                          <div className="text-right text-xs text-slate-500">
                            {item.latitude?.toFixed(3)}, {item.longitude?.toFixed(3)}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Trash2 className="h-5 w-5 text-slate-700" />
                  <h3 className="text-lg font-semibold">Recent waste reports</h3>
                </div>
                {wasteReports.length === 0 ? (
                  <p className="text-sm text-slate-600">No waste reports are available.</p>
                ) : (
                  <div className="space-y-3">
                    {wasteReports.slice(0, 6).map((report) => (
                      <Card key={report.id} className="p-4 border border-slate-200 bg-slate-50">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm text-slate-500">{report.waste_type}</p>
                            <p className="font-semibold text-slate-900">{report.restaurant_name}</p>
                            <p className="text-xs text-slate-500">{report.collection_address}</p>
                          </div>
                          <div className="text-right text-xs text-slate-500">
                            {report.quantity_kg} kg
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-slate-600">
                          Scheduled: {new Date(report.collection_date).toLocaleDateString()}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </Container>
    </>
  );
}
