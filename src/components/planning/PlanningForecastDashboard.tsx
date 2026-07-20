import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Container, PageHero, PremiumHero } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getSupabaseErrorMessage } from "@/lib/supabase-error";
import { Calendar, Sprout, Truck, Trash2, Plus, Edit, Trash, CheckCircle, Clock, AlertCircle, MessageCircle, MapPin, Package, TrendingUp, BarChart3, Filter, Scale } from "lucide-react";

interface HarvestForecast {
  id: string;
  user_id: string;
  farmer_name: string;
  crop_type: string;
  estimated_quantity_kg: number;
  projected_harvest_date: string;
  municipality: string;
  barangay: string;
  notes: string | null;
  status: string;
  created_at: string;
  images: string[] | null;
}

interface LGUDistribution {
  id: string;
  user_id: string;
  lgu_name: string;
  distribution_type: string;
  title: string;
  description: string;
  distribution_date: string;
  location: string;
  target_beneficiaries: string[];
  municipality: string;
  barangay: string[];
  quantity_available: number | null;
  status: string;
  created_at: string;
  images: string[] | null;
}

interface ProjectedWaste {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  estimated_quantity_kg: number;
  projected_date: string;
  waste_type: string;
  municipality: string;
  barangay: string;
  notes: string | null;
  status: string;
  created_at: string;
  images: string[] | null;
}

export function PlanningForecastDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [harvestForecasts, setHarvestForecasts] = useState<HarvestForecast[]>([]);
  const [lguDistributions, setLguDistributions] = useState<LGUDistribution[]>([]);
  const [projectedWaste, setProjectedWaste] = useState<ProjectedWaste[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMunicipality, setFilterMunicipality] = useState<string>("all");
  const [filterCropType, setFilterCropType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showLGUHarvestView, setShowLGUHarvestView] = useState(false);

  // Distribution filters
  const [filterDistributionMunicipality, setFilterDistributionMunicipality] = useState<string>("all");
  const [filterDistributionType, setFilterDistributionType] = useState<string>("all");
  const [filterDistributionStatus, setFilterDistributionStatus] = useState<string>("all");

  // Waste filters
  const [filterWasteMunicipality, setFilterWasteMunicipality] = useState<string>("all");
  const [filterWasteType, setFilterWasteType] = useState<string>("all");
  const [filterWasteStatus, setFilterWasteStatus] = useState<string>("all");

  // Dialog states
  const [showHarvestDialog, setShowHarvestDialog] = useState(false);
  const [showDistributionDialog, setShowDistributionDialog] = useState(false);
  const [showWasteDialog, setShowWasteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("lgu-harvests");

  // Edit mode states
  const [editingHarvest, setEditingHarvest] = useState<HarvestForecast | null>(null);
  const [editingDistribution, setEditingDistribution] = useState<LGUDistribution | null>(null);
  const [editingWaste, setEditingWaste] = useState<ProjectedWaste | null>(null);

  // Detail modal states
  const [selectedHarvest, setSelectedHarvest] = useState<HarvestForecast | null>(null);
  const [selectedDistribution, setSelectedDistribution] = useState<LGUDistribution | null>(null);
  const [selectedWaste, setSelectedWaste] = useState<ProjectedWaste | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Image upload states
  const [harvestImages, setHarvestImages] = useState<File[]>([]);
  const [distributionImages, setDistributionImages] = useState<File[]>([]);
  const [wasteImages, setWasteImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "uploads";

  // Form states
  const [harvestForm, setHarvestForm] = useState({
    crop_type: "",
    estimated_quantity_kg: "",
    projected_harvest_date: "",
    municipality: "general_luna",
    barangay: "",
    notes: "",
  });

  const [distributionForm, setDistributionForm] = useState({
    distribution_type: "fertilizer",
    title: "",
    description: "",
    distribution_date: "",
    location: "",
    target_beneficiaries: ["farmer"],
    municipality: "general_luna",
    barangay: [] as string[],
    quantity_available: "",
  });

  const [wasteForm, setWasteForm] = useState({
    estimated_quantity_kg: "",
    projected_date: "",
    waste_type: "food",
    municipality: "general_luna",
    barangay: "",
    notes: "",
  });

  const municipalities = [
    "burgos", "dapa", "general_luna", "pilar", "san_benito", 
    "san_isidro", "santa_monica", "socorro", "del_carmen"
  ];

  useEffect(() => {
    if (!profile) return;

    if (profile.primary_role === "restaurant") {
      setActiveTab("waste");
    } else {
      setActiveTab("lgu-harvests");
    }

    loadData();
  }, [profile]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedHarvest, selectedDistribution, selectedWaste]);

  const loadData = async () => {
    if (!profile) return;

    try {
      // Load harvest forecasts (visible to farmers, restaurants, residents, and LGU)
      if (profile.primary_role === "farmer" || profile.primary_role === "restaurant" || profile.primary_role === "resident" || profile.primary_role === "lgu_admin") {
        const { data: harvestData } = await supabase
          .from("harvest_forecasts")
          .select("*")
          .eq("status", "active")
          .order("projected_harvest_date", { ascending: true });

        if (harvestData) setHarvestForecasts(harvestData);
      }

      // Load LGU distributions (visible to farmers and LGU admins)
      if (profile.primary_role === "farmer" || profile.primary_role === "lgu_admin") {
        const { data: distributionData } = await supabase
          .from("lgu_distributions")
          .select("*")
          .order("distribution_date", { ascending: true });

        if (distributionData) setLguDistributions(distributionData);
      }

      // Load projected waste (visible to LGU admins and restaurant owners)
      if (profile.primary_role === "lgu_admin" || profile.primary_role === "restaurant") {
        let query = supabase
          .from("projected_waste_reports")
          .select("*")
          .order("projected_date", { ascending: true });

        if (profile.primary_role !== "lgu_admin" && user) {
          query = query.eq("user_id", user.id);
        }

        const { data: wasteData } = await query;

        if (wasteData) setProjectedWaste(wasteData);
      }
    } catch (error) {
      console.error("Error loading forecasts:", error);
      toast.error("Failed to load forecasts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHarvestForecast = async () => {
    if (!user || !profile) return;

    try {
      const imageUrls = await uploadImages(harvestImages);

      const { error } = await supabase.from("harvest_forecasts").insert({
        user_id: user.id,
        farmer_name: profile.full_name,
        crop_type: harvestForm.crop_type,
        estimated_quantity_kg: parseFloat(harvestForm.estimated_quantity_kg),
        projected_harvest_date: harvestForm.projected_harvest_date,
        municipality: harvestForm.municipality,
        barangay: harvestForm.barangay,
        notes: harvestForm.notes || null,
        images: imageUrls.length > 0 ? imageUrls : null,
      });

      if (error) throw error;

      toast.success("Harvest forecast created successfully");
      setShowHarvestDialog(false);
      setHarvestForm({
        crop_type: "",
        estimated_quantity_kg: "",
        projected_harvest_date: "",
        municipality: "general_luna",
        barangay: "",
        notes: "",
      });
      setHarvestImages([]);
      loadData();
    } catch (error) {
      console.error("Error creating harvest forecast:", error);
      toast.error("Failed to create harvest forecast");
    }
  };

  const handleUpdateHarvestForecast = async () => {
    if (!editingHarvest || !user) return;

    try {
      const imageUrls = harvestImages.length > 0 ? await uploadImages(harvestImages) : editingHarvest.images;

      const { error } = await supabase
        .from("harvest_forecasts")
        .update({
          crop_type: harvestForm.crop_type,
          estimated_quantity_kg: parseFloat(harvestForm.estimated_quantity_kg),
          projected_harvest_date: harvestForm.projected_harvest_date,
          municipality: harvestForm.municipality,
          barangay: harvestForm.barangay,
          notes: harvestForm.notes || null,
          images: imageUrls,
        })
        .eq("id", editingHarvest.id);

      if (error) throw error;

      toast.success("Harvest forecast updated successfully");
      setShowHarvestDialog(false);
      setEditingHarvest(null);
      setHarvestForm({
        crop_type: "",
        estimated_quantity_kg: "",
        projected_harvest_date: "",
        municipality: "general_luna",
        barangay: "",
        notes: "",
      });
      setHarvestImages([]);
      loadData();
    } catch (error) {
      console.error("Error updating harvest forecast:", error);
      toast.error("Failed to update harvest forecast");
    }
  };

  const handleDeleteHarvestForecast = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("harvest_forecasts").delete().eq("id", id);

      if (error) throw error;

      toast.success("Harvest forecast deleted successfully");
      loadData();
    } catch (error) {
      console.error("Error deleting harvest forecast:", error);
      toast.error("Failed to delete harvest forecast");
    }
  };

  const handleCreateDistribution = async () => {
    if (!user || !profile) return;

    try {
      const imageUrls = await uploadImages(distributionImages);

      const { error } = await supabase.from("lgu_distributions").insert({
        user_id: user.id,
        lgu_name: profile.full_name,
        distribution_type: distributionForm.distribution_type,
        title: distributionForm.title,
        description: distributionForm.description,
        distribution_date: distributionForm.distribution_date,
        location: distributionForm.location,
        target_beneficiaries: distributionForm.target_beneficiaries,
        municipality: distributionForm.municipality,
        barangay: distributionForm.barangay,
        quantity_available: distributionForm.quantity_available ? parseInt(distributionForm.quantity_available) : null,
        images: imageUrls.length > 0 ? imageUrls : null,
      });

      if (error) throw error;

      toast.success("Distribution created successfully");
      setShowDistributionDialog(false);
      setDistributionForm({
        distribution_type: "fertilizer",
        title: "",
        description: "",
        distribution_date: "",
        location: "",
        target_beneficiaries: ["farmer"],
        municipality: "general_luna",
        barangay: [],
        quantity_available: "",
      });
      setDistributionImages([]);
      loadData();
    } catch (error) {
      console.error("Error creating distribution:", error);
      toast.error("Failed to create distribution");
    }
  };

  const handleUpdateDistribution = async () => {
    if (!editingDistribution || !user) return;

    try {
      const imageUrls = distributionImages.length > 0 ? await uploadImages(distributionImages) : editingDistribution.images;

      const { error } = await supabase
        .from("lgu_distributions")
        .update({
          distribution_type: distributionForm.distribution_type,
          title: distributionForm.title,
          description: distributionForm.description,
          distribution_date: distributionForm.distribution_date,
          location: distributionForm.location,
          target_beneficiaries: distributionForm.target_beneficiaries,
          municipality: distributionForm.municipality,
          barangay: distributionForm.barangay,
          quantity_available: distributionForm.quantity_available ? parseInt(distributionForm.quantity_available) : null,
          images: imageUrls,
        })
        .eq("id", editingDistribution.id);

      if (error) throw error;

      toast.success("Distribution updated successfully");
      setShowDistributionDialog(false);
      setEditingDistribution(null);
      setDistributionForm({
        distribution_type: "fertilizer",
        title: "",
        description: "",
        distribution_date: "",
        location: "",
        target_beneficiaries: ["farmer"],
        municipality: "general_luna",
        barangay: [],
        quantity_available: "",
      });
      setDistributionImages([]);
      loadData();
    } catch (error) {
      console.error("Error updating distribution:", error);
      toast.error("Failed to update distribution");
    }
  };

  const handleDeleteDistribution = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("lgu_distributions").delete().eq("id", id);

      if (error) throw error;

      toast.success("Distribution deleted successfully");
      loadData();
    } catch (error) {
      console.error("Error deleting distribution:", error);
      toast.error("Failed to delete distribution");
    }
  };

  const handleCreateProjectedWaste = async () => {
    if (!user || !profile) return;

    const estimatedQuantity = parseFloat(wasteForm.estimated_quantity_kg);
    if (!wasteForm.estimated_quantity_kg || Number.isNaN(estimatedQuantity) || estimatedQuantity <= 0) {
      toast.error("Please enter a valid estimated quantity.");
      return;
    }
    if (!wasteForm.projected_date) {
      toast.error("Please choose a projected date.");
      return;
    }
    if (!wasteForm.barangay.trim()) {
      toast.error("Please enter your barangay.");
      return;
    }
    if (!wasteForm.waste_type.trim()) {
      toast.error("Please select a waste type.");
      return;
    }

    try {
      const imageUrls = await uploadImages(wasteImages);

      const { data: insertedWaste, error } = await supabase.from("projected_waste_reports").insert({
        user_id: user.id,
        business_name: profile.full_name,
        business_type: "restaurant",
        estimated_quantity_kg: estimatedQuantity,
        projected_date: wasteForm.projected_date,
        waste_type: wasteForm.waste_type,
        municipality: wasteForm.municipality,
        barangay: wasteForm.barangay,
        notes: wasteForm.notes || null,
        images: imageUrls.length > 0 ? imageUrls : null,
      }).select();

      if (error) throw error;

      toast.success("Projected waste report created successfully");
      setShowWasteDialog(false);
      setWasteForm({
        estimated_quantity_kg: "",
        projected_date: "",
        waste_type: "food",
        municipality: "general_luna",
        barangay: "",
        notes: "",
      });
      setWasteImages([]);
      setFilterWasteMunicipality("all");
      setFilterWasteType("all");
      setFilterWasteStatus("all");
      setActiveTab("waste");
      if (insertedWaste && insertedWaste.length > 0) {
        setProjectedWaste((prev) => [...prev, ...insertedWaste]);
      }
      await loadData();
    } catch (error) {
      console.error("Error creating projected waste report:", error);
      toast.error(getSupabaseErrorMessage(error, "Failed to create projected waste report"));
    }
  };

  const handleUpdateProjectedWaste = async () => {
    if (!editingWaste || !user) return;

    const estimatedQuantity = parseFloat(wasteForm.estimated_quantity_kg);
    if (!wasteForm.estimated_quantity_kg || Number.isNaN(estimatedQuantity) || estimatedQuantity <= 0) {
      toast.error("Please enter a valid estimated quantity.");
      return;
    }
    if (!wasteForm.projected_date) {
      toast.error("Please choose a projected date.");
      return;
    }
    if (!wasteForm.barangay.trim()) {
      toast.error("Please enter your barangay.");
      return;
    }
    if (!wasteForm.waste_type.trim()) {
      toast.error("Please select a waste type.");
      return;
    }

    try {
      const imageUrls = wasteImages.length > 0 ? await uploadImages(wasteImages) : editingWaste.images;

      const { error } = await supabase
        .from("projected_waste_reports")
        .update({
          estimated_quantity_kg: estimatedQuantity,
          projected_date: wasteForm.projected_date,
          waste_type: wasteForm.waste_type,
          municipality: wasteForm.municipality,
          barangay: wasteForm.barangay,
          notes: wasteForm.notes || null,
          images: imageUrls,
        })
        .eq("id", editingWaste.id);

      if (error) throw error;

      toast.success("Projected waste report updated successfully");
      setShowWasteDialog(false);
      setEditingWaste(null);
      setWasteForm({
        estimated_quantity_kg: "",
        projected_date: "",
        waste_type: "food",
        municipality: "general_luna",
        barangay: "",
        notes: "",
      });
      setWasteImages([]);
      setFilterWasteMunicipality("all");
      setFilterWasteType("all");
      setFilterWasteStatus("all");
      setActiveTab("waste");
      loadData();
    } catch (error) {
      console.error("Error updating projected waste report:", error);
      toast.error("Failed to update projected waste report");
    }
  };

  const handleDeleteProjectedWaste = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("projected_waste_reports").delete().eq("id", id);

      if (error) throw error;

      toast.success("Projected waste report deleted successfully");
      loadData();
    } catch (error) {
      console.error("Error deleting projected waste report:", error);
      toast.error("Failed to delete projected waste report");
    }
  };

  const canCreateHarvest = profile?.primary_role === "farmer";
  const canCreateDistribution = profile?.primary_role === "lgu_admin";
  const canCreateWaste = profile?.primary_role === "restaurant";
  const isLGUAdmin = profile?.primary_role === "lgu_admin";

  const handleEditHarvest = (harvest: HarvestForecast) => {
    setEditingHarvest(harvest);
    setHarvestForm({
      crop_type: harvest.crop_type,
      estimated_quantity_kg: harvest.estimated_quantity_kg.toString(),
      projected_harvest_date: harvest.projected_harvest_date,
      municipality: harvest.municipality,
      barangay: harvest.barangay,
      notes: harvest.notes || "",
    });
    setShowHarvestDialog(true);
  };

  const handleEditDistribution = (distribution: LGUDistribution) => {
    setEditingDistribution(distribution);
    setDistributionForm({
      distribution_type: distribution.distribution_type,
      title: distribution.title,
      description: distribution.description,
      distribution_date: distribution.distribution_date,
      location: distribution.location,
      target_beneficiaries: distribution.target_beneficiaries,
      municipality: distribution.municipality,
      barangay: distribution.barangay,
      quantity_available: distribution.quantity_available?.toString() || "",
    });
    setShowDistributionDialog(true);
  };

  const handleEditWaste = (waste: ProjectedWaste) => {
    setEditingWaste(waste);
    setWasteForm({
      estimated_quantity_kg: waste.estimated_quantity_kg.toString(),
      projected_date: waste.projected_date,
      waste_type: waste.waste_type,
      municipality: waste.municipality,
      barangay: waste.barangay,
      notes: waste.notes || "",
    });
    setShowWasteDialog(true);
  };

  // Filter harvest forecasts for LGU admin
  const filteredHarvestForecasts = harvestForecasts.filter((forecast) => {
    if (filterMunicipality !== "all" && forecast.municipality !== filterMunicipality) return false;
    if (filterCropType !== "all" && forecast.crop_type.toLowerCase() !== filterCropType.toLowerCase()) return false;
    if (filterStatus !== "all" && forecast.status !== filterStatus) return false;
    return true;
  });

  // Get unique crop types for filter
  const uniqueCropTypes = Array.from(new Set(harvestForecasts.map((f) => f.crop_type)));

  // Calculate harvest statistics
  const harvestStats = {
    totalForecasts: harvestForecasts.length,
    totalQuantity: harvestForecasts.reduce((sum, f) => sum + f.estimated_quantity_kg, 0),
    upcomingThisMonth: harvestForecasts.filter((f) => {
      const harvestDate = new Date(f.projected_harvest_date);
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return harvestDate >= now && harvestDate <= endOfMonth;
    }).length,
    byMunicipality: harvestForecasts.reduce((acc, f) => {
      acc[f.municipality] = (acc[f.municipality] || 0) + f.estimated_quantity_kg;
      return acc;
    }, {} as Record<string, number>),
  };

  // Calculate distribution statistics
  const distributionStats = {
    totalDistributions: lguDistributions.length,
    totalQuantity: lguDistributions.reduce((sum, d) => sum + (d.quantity_available || 0), 0),
    upcomingThisMonth: lguDistributions.filter((d) => {
      const distDate = new Date(d.distribution_date);
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return distDate >= now && distDate <= endOfMonth;
    }).length,
    byMunicipality: lguDistributions.reduce((acc, d) => {
      acc[d.municipality] = (acc[d.municipality] || 0) + (d.quantity_available || 0);
      return acc;
    }, {} as Record<string, number>),
  };

  // Calculate waste statistics
  const wasteStats = {
    totalReports: projectedWaste.length,
    totalQuantity: projectedWaste.reduce((sum, w) => sum + w.estimated_quantity_kg, 0),
    upcomingThisMonth: projectedWaste.filter((w) => {
      const wasteDate = new Date(w.projected_date);
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return wasteDate >= now && wasteDate <= endOfMonth;
    }).length,
    byMunicipality: projectedWaste.reduce((acc, w) => {
      acc[w.municipality] = (acc[w.municipality] || 0) + w.estimated_quantity_kg;
      return acc;
    }, {} as Record<string, number>),
  };

  // Filter distributions
  const filteredDistributions = lguDistributions.filter((dist) => {
    if (filterDistributionMunicipality !== "all" && dist.municipality !== filterDistributionMunicipality) return false;
    if (filterDistributionType !== "all" && dist.distribution_type !== filterDistributionType) return false;
    if (filterDistributionStatus !== "all" && dist.status !== filterDistributionStatus) return false;
    return true;
  });

  // Filter waste
  const filteredWaste = projectedWaste.filter((waste) => {
    if (filterWasteMunicipality !== "all" && waste.municipality !== filterWasteMunicipality) return false;
    if (filterWasteType !== "all" && waste.waste_type !== filterWasteType) return false;
    if (filterWasteStatus !== "all" && waste.status !== filterWasteStatus) return false;
    return true;
  });

  // Get unique distribution types and waste types
  const uniqueDistributionTypes = Array.from(new Set(lguDistributions.map((d) => d.distribution_type)));
  const uniqueWasteTypes = Array.from(new Set(projectedWaste.map((w) => w.waste_type)));

  const handleMessageClick = (targetUserId: string, targetUserName: string) => {
    if (!user || user.id === targetUserId) return;
    if (!profile?.lgu_approved) {
      toast.error("Your account must be verified by the LGU before you can send messages. Please upload your government ID in your profile.");
      return;
    }
    navigate({ to: "/messages", search: { userId: targetUserId } });
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const filePath = `forecasts/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicData } = await supabase.storage.from(STORAGE_BUCKET).getPublicUrl(uploadData.path ?? filePath);
        return publicData.publicUrl;
      });

      return await Promise.all(uploadPromises);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (msg.includes("Bucket not found") || msg.includes("bucket not found")) {
        toast.error(`Storage bucket "${STORAGE_BUCKET}" not found. Create it in Supabase Storage.`);
      } else if (msg.includes("row-level security") || msg.includes("violates row-level")) {
        toast.error("Could not upload images: storage upload blocked by row-level security.");
      } else {
        toast.error(`Could not upload images: ${msg}`);
      }
      return [];
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <PremiumHero
        title="Planning & Forecast"
        sub="Coordinate future harvests, distributions, and waste management with role-based forecasting tools."
      />
      <Container className="py-12">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className={`grid w-full max-w-3xl mx-auto ${
              (profile?.primary_role === "farmer" || profile?.primary_role === "restaurant") ? "grid-cols-2" : "grid-cols-3"
            }`}>
              {(profile?.primary_role === "farmer" || profile?.primary_role === "lgu_admin" || profile?.primary_role === "restaurant") && (
                <TabsTrigger value="lgu-harvests">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Harvest Forecast
                </TabsTrigger>
              )}
              {(profile?.primary_role === "farmer" || profile?.primary_role === "lgu_admin") && (
                <TabsTrigger value="distributions">
                  <Truck className="mr-2 h-4 w-4" />
                  LGU Distributions
                </TabsTrigger>
              )}
              {(profile?.primary_role === "lgu_admin" || profile?.primary_role === "restaurant") && (
                <TabsTrigger value="waste">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Projected Waste
                </TabsTrigger>
              )}
            </TabsList>

            {/* Harvest Forecast Tab (for farmers, LGU admin, and restaurant owners) */}
            {(profile?.primary_role === "farmer" || profile?.primary_role === "lgu_admin" || profile?.primary_role === "restaurant") && (
              <TabsContent value="lgu-harvests" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">{isLGUAdmin || profile?.primary_role === "restaurant" ? "Farmers' Harvest Forecast" : "My Harvest Forecasts"}</h2>
                  {canCreateHarvest && (
                    <Button onClick={() => setShowHarvestDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Forecast
                    </Button>
                  )}
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Sprout className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Forecasts</p>
                        <p className="text-2xl font-bold text-green-900">{harvestStats.totalForecasts}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Quantity</p>
                        <p className="text-2xl font-bold text-blue-900">{harvestStats.totalQuantity.toLocaleString()} kg</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-100 rounded-lg">
                        <Calendar className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">This Month</p>
                        <p className="text-2xl font-bold text-amber-900">{harvestStats.upcomingThisMonth}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Municipalities</p>
                        <p className="text-2xl font-bold text-purple-900">{Object.keys(harvestStats.byMunicipality).length}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Filters */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Filter Harvests</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="filter-municipality">Municipality</Label>
                      <Select value={filterMunicipality} onValueChange={setFilterMunicipality}>
                        <SelectTrigger id="filter-municipality">
                          <SelectValue placeholder="All municipalities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Municipalities</SelectItem>
                          {municipalities.map((m) => (
                            <SelectItem key={m} value={m}>{m.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="filter-crop">Crop Type</Label>
                      <Select value={filterCropType} onValueChange={setFilterCropType}>
                        <SelectTrigger id="filter-crop">
                          <SelectValue placeholder="All crops" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Crops</SelectItem>
                          {uniqueCropTypes.map((crop) => (
                            <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="filter-status">Status</Label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger id="filter-status">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>

                {/* Municipality Breakdown */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-bold">Harvest by Municipality</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(harvestStats.byMunicipality).map(([municipality, quantity]) => (
                      <div key={municipality} className="flex items-center gap-4">
                        <div className="w-40 text-sm font-medium">
                          {municipality.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full"
                            style={{ width: `${(quantity / harvestStats.totalQuantity) * 100}%` }}
                          />
                        </div>
                        <div className="w-24 text-sm font-bold text-right">{quantity.toLocaleString()} kg</div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Filtered Harvest Forecast Cards */}
                <h3 className="text-xl font-bold">Upcoming Harvests</h3>
                {filteredHarvestForecasts.length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground">
                    No harvest forecasts found
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredHarvestForecasts.map((forecast) => (
                      <Card key={forecast.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        {forecast.images && forecast.images.length > 0 && (
                          <div className="relative h-48 bg-gray-100">
                            <img
                              src={forecast.images[0]}
                              alt={forecast.crop_type}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 border-b">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <Sprout className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg">{forecast.crop_type}</h3>
                                <Link
                                  to="/profile"
                                  search={{ userId: forecast.user_id }}
                                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                                >
                                  by {forecast.farmer_name}
                                </Link>
                              </div>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                              forecast.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}>
                              {forecast.status}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Quantity:</span>
                            <span className="font-semibold">{forecast.estimated_quantity_kg} kg</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Harvest Date:</span>
                            <span className="font-semibold">{new Date(forecast.projected_harvest_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Location:</span>
                            <span className="font-semibold">{forecast.barangay}, {forecast.municipality}</span>
                          </div>
                          {forecast.notes && (
                            <p className="text-sm text-muted-foreground italic border-t pt-3 mt-3">{forecast.notes}</p>
                          )}
                          {user && user.id === forecast.user_id && (
                            <div className="flex gap-2 pt-3 mt-3 border-t">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditHarvest(forecast)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteHarvestForecast(forecast.id)}
                              >
                                <Trash className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {/* LGU Distributions Tab */}
            {(profile?.primary_role === "farmer" || profile?.primary_role === "lgu_admin") && (
              <TabsContent value="distributions" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">LGU Distributions</h2>
                  {canCreateDistribution && (
                    <Button onClick={() => setShowDistributionDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Distribution
                    </Button>
                  )}
                </div>

                {/* LGU Admin Distribution Analytics */}
                {isLGUAdmin && (
                  <div className="space-y-6">
                    {/* Statistics Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Truck className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Distributions</p>
                            <p className="text-2xl font-bold text-blue-900">{distributionStats.totalDistributions}</p>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-green-100 rounded-lg">
                            <Package className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Quantity</p>
                            <p className="text-2xl font-bold text-green-900">{distributionStats.totalQuantity.toLocaleString()} units</p>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-amber-100 rounded-lg">
                            <Calendar className="h-6 w-6 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">This Month</p>
                            <p className="text-2xl font-bold text-amber-900">{distributionStats.upcomingThisMonth}</p>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-purple-100 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Municipalities</p>
                            <p className="text-2xl font-bold text-purple-900">{Object.keys(distributionStats.byMunicipality).length}</p>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Filters */}
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold">Filter Distributions</h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <Label htmlFor="filter-dist-municipality">Municipality</Label>
                          <Select value={filterDistributionMunicipality} onValueChange={setFilterDistributionMunicipality}>
                            <SelectTrigger id="filter-dist-municipality">
                              <SelectValue placeholder="All municipalities" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Municipalities</SelectItem>
                              {municipalities.map((m) => (
                                <SelectItem key={m} value={m}>{m.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="filter-dist-type">Distribution Type</Label>
                          <Select value={filterDistributionType} onValueChange={setFilterDistributionType}>
                            <SelectTrigger id="filter-dist-type">
                              <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              {uniqueDistributionTypes.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="filter-dist-status">Status</Label>
                          <Select value={filterDistributionStatus} onValueChange={setFilterDistributionStatus}>
                            <SelectTrigger id="filter-dist-status">
                              <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="upcoming">Upcoming</SelectItem>
                              <SelectItem value="distributed">Distributed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>

                    {/* Municipality Breakdown */}
                    <Card className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-bold">Distributions by Municipality</h3>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(distributionStats.byMunicipality).map(([municipality, quantity]) => (
                          <div key={municipality} className="flex items-center gap-4">
                            <div className="w-40 text-sm font-medium">
                              {municipality.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full"
                                style={{ width: `${(quantity / distributionStats.totalQuantity) * 100}%` }}
                              />
                            </div>
                            <div className="w-24 text-sm font-bold text-right">{quantity.toLocaleString()} units</div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Distribution Cards */}
                <h3 className="text-xl font-bold">Upcoming Distributions</h3>
                {filteredDistributions.length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground">
                    No distributions found
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {filteredDistributions.map((dist) => (
                      <Card key={dist.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedDistribution(dist)}>
                        {dist.images && dist.images.length > 0 && (
                          <div className="relative h-48 bg-gray-100">
                            <img
                              src={dist.images[0]}
                              alt={dist.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Truck className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg">{dist.title}</h3>
                                <Link
                                  to="/profile"
                                  search={{ userId: dist.user_id }}
                                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                                >
                                  by {dist.lgu_name}
                                </Link>
                              </div>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                              dist.status === "upcoming" ? "bg-blue-100 text-blue-800" :
                              dist.status === "distributed" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}>
                              {dist.status}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Type:</span>
                            <span className="font-semibold capitalize">{dist.distribution_type}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-semibold">{new Date(dist.distribution_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Location:</span>
                            <span className="font-semibold">{dist.location}</span>
                          </div>
                          {dist.quantity_available && (
                            <div className="flex items-center gap-2 text-sm">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Available:</span>
                              <span className="font-semibold">{dist.quantity_available} units</span>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground italic border-t pt-3 mt-3">{dist.description}</p>
                        </div>
                        {user && user.id !== dist.user_id && (
                          <div className="p-4 border-t bg-gray-50">
                            <Button
                              className="w-full"
                              onClick={() => handleMessageClick(dist.user_id, dist.lgu_name)}
                            >
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Message LGU
                            </Button>
                          </div>
                        )}
                        {user && user.id === dist.user_id && (
                          <div className="flex gap-2 p-4 border-t bg-gray-50">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditDistribution(dist);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDistribution(dist.id);
                              }}
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {/* Projected Waste Tab */}
            {(profile?.primary_role === "lgu_admin" || profile?.primary_role === "restaurant") && (
              <TabsContent value="waste" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Projected Food Waste</h2>
                  {canCreateWaste && (
                    <Button onClick={() => setShowWasteDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Waste Projection
                    </Button>
                  )}
                </div>

                {/* Waste Analytics */}
                <div className="space-y-6">
                  {/* Statistics Cards */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 rounded-lg">
                          <Package className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Reports</p>
                          <p className="text-2xl font-bold text-red-900">{wasteStats.totalReports}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-orange-100 rounded-lg">
                          <Scale className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Quantity</p>
                          <p className="text-2xl font-bold text-orange-900">{wasteStats.totalQuantity.toLocaleString()} kg</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-6 bg-gradient-to-br from-yellow-50 to-lime-50 border-yellow-200">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <Calendar className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">This Month</p>
                          <p className="text-2xl font-bold text-yellow-900">{wasteStats.upcomingThisMonth}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Municipalities</p>
                          <p className="text-2xl font-bold text-purple-900">{Object.keys(wasteStats.byMunicipality).length}</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Filters */}
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Filter Waste Reports</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="filter-waste-municipality">Municipality</Label>
                        <Select value={filterWasteMunicipality} onValueChange={setFilterWasteMunicipality}>
                          <SelectTrigger id="filter-waste-municipality">
                            <SelectValue placeholder="All municipalities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Municipalities</SelectItem>
                            {municipalities.map((m) => (
                              <SelectItem key={m} value={m}>{m.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="filter-waste-type">Waste Type</Label>
                        <Select value={filterWasteType} onValueChange={setFilterWasteType}>
                          <SelectTrigger id="filter-waste-type">
                            <SelectValue placeholder="All types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {uniqueWasteTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Waste Report Cards */}
                <h3 className="text-xl font-bold">Waste Projections</h3>
                {filteredWaste.length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground">
                    No waste reports found
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {filteredWaste.map((waste) => (
                      <Card key={waste.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedWaste(waste)}>
                        {waste.images && waste.images.length > 0 && (
                          <div className="relative h-48 bg-gray-100">
                            <img
                              src={waste.images[0]}
                              alt={waste.business_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 border-b">
                          <div className="flex items-center gap-3">
                            <div>
                              <Link
                                to="/profile"
                                search={{ userId: waste.user_id }}
                                className="font-bold text-lg hover:text-primary hover:underline"
                              >
                                {waste.business_name}
                              </Link>
                              <p className="text-sm text-muted-foreground">{waste.business_type}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Estimated:</span>
                            <span className="font-semibold">{waste.estimated_quantity_kg} kg</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-semibold">{new Date(waste.projected_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Type:</span>
                            <span className="font-semibold capitalize">{waste.waste_type}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Location:</span>
                            <span className="font-semibold">{waste.barangay}, {waste.municipality}</span>
                          </div>
                          {waste.notes && (
                            <p className="text-sm text-muted-foreground italic border-t pt-3 mt-3">{waste.notes}</p>
                          )}
                        </div>
                        {user && user.id === waste.user_id && (
                          <div className="flex gap-2 p-4 border-t bg-gray-50">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditWaste(waste);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProjectedWaste(waste.id);
                              }}
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        )}
      </Container>

      {/* Harvest Forecast Dialog */}
      <Dialog open={showHarvestDialog} onOpenChange={(open) => {
        setShowHarvestDialog(open);
        if (!open) {
          setEditingHarvest(null);
          setHarvestForm({
            crop_type: "",
            estimated_quantity_kg: "",
            projected_harvest_date: "",
            municipality: "general_luna",
            barangay: "",
            notes: "",
          });
          setHarvestImages([]);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHarvest ? "Edit Harvest Forecast" : "Add Harvest Forecast"}</DialogTitle>
            <DialogDescription>
              {editingHarvest ? "Update your harvest forecast details" : "Post your expected harvest to help buyers plan ahead"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="crop_type">Crop Type</Label>
              <Input
                id="crop_type"
                value={harvestForm.crop_type}
                onChange={(e) => setHarvestForm({ ...harvestForm, crop_type: e.target.value })}
                placeholder="e.g., Rice, Corn, Vegetables"
              />
            </div>
            <div>
              <Label htmlFor="quantity">Estimated Quantity (kg)</Label>
              <Input
                id="quantity"
                type="number"
                value={harvestForm.estimated_quantity_kg}
                onChange={(e) => setHarvestForm({ ...harvestForm, estimated_quantity_kg: e.target.value })}
                placeholder="e.g., 500"
              />
            </div>
            <div>
              <Label htmlFor="harvest_date">Projected Harvest Date</Label>
              <Input
                id="harvest_date"
                type="date"
                value={harvestForm.projected_harvest_date}
                onChange={(e) => setHarvestForm({ ...harvestForm, projected_harvest_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="municipality">Municipality</Label>
              <Select value={harvestForm.municipality} onValueChange={(v) => setHarvestForm({ ...harvestForm, municipality: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {municipalities.map((m) => (
                    <SelectItem key={m} value={m}>{m.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="barangay">Barangay</Label>
              <Input
                id="barangay"
                value={harvestForm.barangay}
                onChange={(e) => setHarvestForm({ ...harvestForm, barangay: e.target.value })}
                placeholder="e.g., Barangay 1"
              />
            </div>
            <div>
              <Label htmlFor="images">Images (optional)</Label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files || []);
                    setHarvestImages([...harvestImages, ...newFiles]);
                  }}
                  className="text-sm border-2 border-dashed border-primary/40 rounded-lg p-4 w-full cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors"
                />
                {harvestImages.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center text-primary/60">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">Click to upload images</p>
                      <p className="text-xs mt-1">or drag and drop (multiple allowed)</p>
                    </div>
                  </div>
                )}
              </div>
              {harvestImages.length > 0 && (
                <div className="mt-2 text-sm text-primary/70 font-medium">
                  {harvestImages.length} image{harvestImages.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={harvestForm.notes}
                onChange={(e) => setHarvestForm({ ...harvestForm, notes: e.target.value })}
                placeholder="Additional details about your harvest"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHarvestDialog(false)}>Cancel</Button>
            <Button onClick={editingHarvest ? handleUpdateHarvestForecast : handleCreateHarvestForecast} disabled={uploading}>
              {uploading ? "Uploading images..." : editingHarvest ? "Update Forecast" : "Create Forecast"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LGU Distribution Dialog */}
      <Dialog open={showDistributionDialog} onOpenChange={(open) => {
        setShowDistributionDialog(open);
        if (!open) {
          setEditingDistribution(null);
          setDistributionForm({
            distribution_type: "fertilizer",
            title: "",
            description: "",
            distribution_date: "",
            location: "",
            target_beneficiaries: ["farmer"],
            municipality: "general_luna",
            barangay: [],
            quantity_available: "",
          });
          setDistributionImages([]);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDistribution ? "Edit LGU Distribution" : "Add LGU Distribution"}</DialogTitle>
            <DialogDescription>
              {editingDistribution ? "Update your distribution details" : "Post upcoming fertilizer distributions or agricultural assistance programs"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="distribution_type">Distribution Type</Label>
              <Select value={distributionForm.distribution_type} onValueChange={(v) => setDistributionForm({ ...distributionForm, distribution_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fertilizer">Fertilizer</SelectItem>
                  <SelectItem value="seeds">Seeds</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="assistance">Agricultural Assistance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={distributionForm.title}
                onChange={(e) => setDistributionForm({ ...distributionForm, title: e.target.value })}
                placeholder="e.g., Free Fertilizer Distribution Program"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={distributionForm.description}
                onChange={(e) => setDistributionForm({ ...distributionForm, description: e.target.value })}
                placeholder="Describe the distribution program"
              />
            </div>
            <div>
              <Label htmlFor="distribution_date">Distribution Date</Label>
              <Input
                id="distribution_date"
                type="date"
                value={distributionForm.distribution_date}
                onChange={(e) => setDistributionForm({ ...distributionForm, distribution_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={distributionForm.location}
                onChange={(e) => setDistributionForm({ ...distributionForm, location: e.target.value })}
                placeholder="e.g., Municipal Hall"
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity Available (optional)</Label>
              <Input
                id="quantity"
                type="number"
                value={distributionForm.quantity_available}
                onChange={(e) => setDistributionForm({ ...distributionForm, quantity_available: e.target.value })}
                placeholder="e.g., 100"
              />
            </div>
            <div>
              <Label htmlFor="municipality">Municipality</Label>
              <Select value={distributionForm.municipality} onValueChange={(v) => setDistributionForm({ ...distributionForm, municipality: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {municipalities.map((m) => (
                    <SelectItem key={m} value={m}>{m.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="distribution_images">Images (optional)</Label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files || []);
                    setDistributionImages([...distributionImages, ...newFiles]);
                  }}
                  className="text-sm border-2 border-dashed border-primary/40 rounded-lg p-4 w-full cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors"
                />
                {distributionImages.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center text-primary/60">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">Click to upload images</p>
                      <p className="text-xs mt-1">or drag and drop (multiple allowed)</p>
                    </div>
                  </div>
                )}
              </div>
              {distributionImages.length > 0 && (
                <div className="mt-2 text-sm text-primary/70 font-medium">
                  {distributionImages.length} image{distributionImages.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDistributionDialog(false)}>Cancel</Button>
            <Button onClick={editingDistribution ? handleUpdateDistribution : handleCreateDistribution} disabled={uploading}>
              {uploading ? "Uploading images..." : editingDistribution ? "Update Distribution" : "Create Distribution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Projected Waste Dialog */}
      <Dialog open={showWasteDialog} onOpenChange={(open) => {
        setShowWasteDialog(open);
        if (!open) {
          setEditingWaste(null);
          setWasteForm({
            estimated_quantity_kg: "",
            projected_date: "",
            waste_type: "food",
            municipality: "general_luna",
            barangay: "",
            notes: "",
          });
          setWasteImages([]);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWaste ? "Edit Projected Waste Report" : "Add Projected Waste Report"}</DialogTitle>
            <DialogDescription>
              {editingWaste ? "Update your waste projection details" : "Report expected food waste to help LGU plan for recovery and management"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="waste_quantity">Estimated Quantity (kg)</Label>
              <Input
                id="waste_quantity"
                type="number"
                value={wasteForm.estimated_quantity_kg}
                onChange={(e) => setWasteForm({ ...wasteForm, estimated_quantity_kg: e.target.value })}
                placeholder="e.g., 50"
              />
            </div>
            <div>
              <Label htmlFor="projected_date">Projected Date</Label>
              <Input
                id="projected_date"
                type="date"
                value={wasteForm.projected_date}
                onChange={(e) => setWasteForm({ ...wasteForm, projected_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="waste_type">Waste Type</Label>
              <Select value={wasteForm.waste_type} onValueChange={(v) => setWasteForm({ ...wasteForm, waste_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food Waste</SelectItem>
                  <SelectItem value="organic">Organic Waste</SelectItem>
                  <SelectItem value="mixed">Mixed Waste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="waste_municipality">Municipality</Label>
              <Select value={wasteForm.municipality} onValueChange={(v) => setWasteForm({ ...wasteForm, municipality: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {municipalities.map((m) => (
                    <SelectItem key={m} value={m}>{m.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="waste_barangay">Barangay</Label>
              <Input
                id="waste_barangay"
                value={wasteForm.barangay}
                onChange={(e) => setWasteForm({ ...wasteForm, barangay: e.target.value })}
                placeholder="e.g., Barangay 1"
              />
            </div>
            <div>
              <Label htmlFor="waste_images">Images (optional)</Label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const newFiles = Array.from(e.target.files || []);
                    setWasteImages([...wasteImages, ...newFiles]);
                  }}
                  className="text-sm border-2 border-dashed border-primary/40 rounded-lg p-4 w-full cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors"
                />
                {wasteImages.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center text-primary/60">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">Click to upload images</p>
                      <p className="text-xs mt-1">or drag and drop (multiple allowed)</p>
                    </div>
                  </div>
                )}
              </div>
              {wasteImages.length > 0 && (
                <div className="mt-2 text-sm text-primary/70 font-medium">
                  {wasteImages.length} image{wasteImages.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="waste_notes">Notes (optional)</Label>
              <Textarea
                id="waste_notes"
                value={wasteForm.notes}
                onChange={(e) => setWasteForm({ ...wasteForm, notes: e.target.value })}
                placeholder="Additional details about the projected waste"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWasteDialog(false)}>Cancel</Button>
            <Button onClick={editingWaste ? handleUpdateProjectedWaste : handleCreateProjectedWaste} disabled={uploading}>
              {uploading ? "Uploading images..." : editingWaste ? "Update Report" : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Harvest Forecast Detail Modal */}
      <Dialog open={!!selectedHarvest} onOpenChange={() => setSelectedHarvest(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedHarvest && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedHarvest.crop_type}</DialogTitle>
                <DialogDescription>
                  <Link
                    to="/profile"
                    search={{ userId: selectedHarvest.user_id }}
                    className="text-primary hover:underline"
                  >
                    by {selectedHarvest.farmer_name}
                  </Link>
                </DialogDescription>
              </DialogHeader>

              {selectedHarvest.images && selectedHarvest.images.length > 0 && (
                <div className="relative overflow-hidden bg-slate-950 rounded-lg">
                  <img
                    src={selectedHarvest.images[currentImageIndex]}
                    alt={selectedHarvest.crop_type}
                    className="w-full h-96 object-cover"
                  />
                  {selectedHarvest.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev - 1 + selectedHarvest.images!.length) % selectedHarvest.images!.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % selectedHarvest.images!.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {selectedHarvest.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`h-2 rounded-full transition-all ${index === currentImageIndex ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/75"}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2 mt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Harvest Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium">{selectedHarvest.estimated_quantity_kg} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Harvest Date:</span>
                        <span className="font-medium">{new Date(selectedHarvest.projected_harvest_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium">{selectedHarvest.barangay}, {selectedHarvest.municipality.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`font-medium capitalize ${selectedHarvest.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                          {selectedHarvest.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedHarvest.notes && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Notes</h3>
                      <p className="text-sm text-muted-foreground">{selectedHarvest.notes}</p>
                    </div>
                  )}

                  {user && user.id !== selectedHarvest.user_id && (
                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedHarvest(null);
                        handleMessageClick(selectedHarvest.user_id, selectedHarvest.farmer_name);
                      }}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Message Farmer
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* LGU Distribution Detail Modal */}
      <Dialog open={!!selectedDistribution} onOpenChange={() => setSelectedDistribution(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedDistribution && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedDistribution.title}</DialogTitle>
                <DialogDescription>
                  <Link
                    to="/profile"
                    search={{ userId: selectedDistribution.user_id }}
                    className="text-primary hover:underline"
                  >
                    by {selectedDistribution.lgu_name}
                  </Link>
                </DialogDescription>
              </DialogHeader>

              {selectedDistribution.images && selectedDistribution.images.length > 0 && (
                <div className="relative overflow-hidden bg-slate-950 rounded-lg">
                  <img
                    src={selectedDistribution.images[currentImageIndex]}
                    alt={selectedDistribution.title}
                    className="w-full h-96 object-cover"
                  />
                  {selectedDistribution.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev - 1 + selectedDistribution.images!.length) % selectedDistribution.images!.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % selectedDistribution.images!.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {selectedDistribution.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`h-2 rounded-full transition-all ${index === currentImageIndex ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/75"}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2 mt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Distribution Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium capitalize">{selectedDistribution.distribution_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">{new Date(selectedDistribution.distribution_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium">{selectedDistribution.location}</span>
                      </div>
                      {selectedDistribution.quantity_available && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Available:</span>
                          <span className="font-medium">{selectedDistribution.quantity_available} units</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`font-medium capitalize ${
                          selectedDistribution.status === 'upcoming' ? 'text-blue-600' :
                          selectedDistribution.status === 'distributed' ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {selectedDistribution.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">{selectedDistribution.description}</p>
                  </div>

                  {user && user.id !== selectedDistribution.user_id && (
                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedDistribution(null);
                        handleMessageClick(selectedDistribution.user_id, selectedDistribution.lgu_name);
                      }}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Message LGU
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Projected Waste Detail Modal */}
      <Dialog open={!!selectedWaste} onOpenChange={() => setSelectedWaste(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedWaste && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedWaste.business_name}</DialogTitle>
                <DialogDescription>
                  <Link
                    to="/profile"
                    search={{ userId: selectedWaste.user_id }}
                    className="text-primary hover:underline"
                  >
                    {selectedWaste.business_type}
                  </Link>
                </DialogDescription>
              </DialogHeader>

              {selectedWaste.images && selectedWaste.images.length > 0 && (
                <div className="relative overflow-hidden bg-slate-950 rounded-lg">
                  <img
                    src={selectedWaste.images[currentImageIndex]}
                    alt={selectedWaste.business_name}
                    className="w-full h-96 object-cover"
                  />
                  {selectedWaste.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev - 1 + selectedWaste.images!.length) % selectedWaste.images!.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % selectedWaste.images!.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {selectedWaste.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`h-2 rounded-full transition-all ${index === currentImageIndex ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/75"}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2 mt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Waste Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estimated:</span>
                        <span className="font-medium">{selectedWaste.estimated_quantity_kg} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">{new Date(selectedWaste.projected_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium capitalize">{selectedWaste.waste_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium">{selectedWaste.barangay}, {selectedWaste.municipality.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedWaste.notes && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Notes</h3>
                      <p className="text-sm text-muted-foreground">{selectedWaste.notes}</p>
                    </div>
                  )}

                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
