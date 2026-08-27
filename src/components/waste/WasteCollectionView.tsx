import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Container } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Trash2, FolderOpen, Clock, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type WasteReport = Database["public"]["Tables"]["food_waste_reports"]["Row"];
type WasteCollection = Database["public"]["Tables"]["waste_collections"]["Row"];

export function WasteCollectionView() {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [collections, setCollections] = useState<Record<string, WasteCollection>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || profile?.primary_role !== "restaurant") {
      setIsLoading(false);
      return;
    }

    const loadRequests = async () => {
      setIsLoading(true);
      const { data: reportData, error: reportError } = await supabase
        .from("food_waste_reports")
        .select("*")
        .eq("restaurant_id", user.id)
        .order("created_at", { ascending: false });

      if (reportError) {
        console.error("Error loading food waste reports:", reportError);
        toast.error("Unable to load collection requests.");
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

      const { data: collectionData, error: collectionError } = await (
        supabase.from("waste_collections") as any
      )
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

    void loadRequests();
  }, [user, profile]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  if (!profile || profile.primary_role !== "restaurant") {
    return (
      <Container className="py-12">
        <Card className="mx-auto max-w-xl p-8 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-accent mb-4" />
          <h2 className="text-2xl font-semibold text-accent">{t("wasteCollection.title")}</h2>
          <p className="text-slate-600 mt-2">
            {t("wasteCollection.onlyForRestaurants")}
          </p>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">
            {t("wasteCollection.title")}
          </h1>
          <p className="text-slate-600">
            {t("wasteCollection.subtitle")}
          </p>
        </div>
        <Button
          className="bg-accent hover:bg-accent/90 text-white gap-2"
          onClick={() => navigate({ to: "/waste-reports" })}
        >
          <Plus className="h-4 w-4" /> {t("wasteCollection.requestCollection")}
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center">
          <p className="text-slate-600">{t("wasteCollection.loading")}</p>
        </Card>
      ) : reports.length === 0 ? (
        <Card className="p-12 text-center border-2 border-accent/20">
          <MapPin className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">{t("wasteCollection.noRequests")}</h2>
          <p className="text-slate-600 mb-6">
            {t("wasteCollection.noRequestsDescription")}
          </p>
          <Button
            className="bg-accent hover:bg-accent/90 text-white gap-2 mx-auto"
            onClick={() => navigate({ to: "/waste-reports" })}
          >
            <Plus className="h-4 w-4" /> {t("wasteCollection.submitWasteReport")}
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const collection = collections[report.id];
            return (
              <Card
                key={report.id}
                className="p-6 border-2 border-accent/20 hover:border-accent/40 transition-all"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-accent" />
                      <div>
                        <h3 className="font-semibold text-slate-900">{report.waste_type}</h3>
                        <p className="text-sm text-slate-600">{report.collection_address}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(report.collection_date).toLocaleDateString()}
                      </span>
                      <span>{report.quantity_kg} kg</span>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(report.status)}`}
                      >
                        {report.status}
                      </span>
                    </div>
                    {collection && (
                      <p className="text-sm text-slate-600">
                        {t("wasteCollection.collectionScheduled")}:{" "}
                        {new Date(collection.scheduled_date).toLocaleDateString()} • {t("wasteCollection.status")}:{" "}
                        {collection.status}
                      </p>
                    )}
                  </div>
                  <div className="rounded-3xl bg-secondary/10 px-4 py-3 text-slate-700 text-sm">
                    <p className="font-semibold">{t("wasteCollection.submitted")}</p>
                    <p>{new Date(report.created_at).toLocaleDateString()}</p>
                    <p className="mt-1 flex items-center gap-2 text-slate-500">
                      <Clock className="h-4 w-4" /> {t("wasteCollection.awaitingCollection")}
                    </p>
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
