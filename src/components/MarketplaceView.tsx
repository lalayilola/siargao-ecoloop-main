import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Container, PageHero } from "@/components/Section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListingCard } from "@/components/ListingCard";
import { Search, Lock, Plus, Filter, Check, X, MessageCircle, MapPin } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import marketBg from "@/assets/siargao-spot.jpg";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TradeRequestModal } from "@/components/TradeRequestModal";
import { BuyRequestModal } from "@/components/BuyRequestModal";
import { Badge } from "@/components/ui/badge";
import { ChatMessenger } from "@/components/ChatMessenger";
import { LocationPicker } from "@/components/LocationPicker";

type Listing = Database["public"]["Tables"]["marketplace_listings"]["Row"];
type Trade = Database["public"]["Tables"]["trades"]["Row"];
type PurchaseRequest = Database["public"]["Tables"]["purchase_requests"]["Row"];

const canViewListing = (listing: Listing, role: AppRole | null | undefined, currentUserId?: string) => {
  if (currentUserId && listing.user_id === currentUserId) return true;

  if (!role) {
    return listing.kind === "produce";
  }

  if (role === "farmer") {
    return (listing.kind === "produce" && currentUserId && listing.user_id === currentUserId) ||
      (listing.kind === "waste" && listing.role === "lgu_admin");
  }

  if (role === "lgu_admin") {
    return (listing.kind === "waste" && listing.role === "restaurant") ||
      (listing.kind === "waste" && listing.user_id === currentUserId);
  }

  if (listing.kind === "produce") {
    return role === "restaurant" || role === "resident";
  }

  if (listing.kind === "waste") {
    if (listing.role === "lgu_admin") {
      return role === "farmer";
    }

    if (listing.role === "restaurant") {
      return role === "lgu_admin";
    }
  }

  return false;
};

const canCreateListing = (role: AppRole | null | undefined, kind: Listing["kind"]) => {
  if (!role) return false;

  if (role === "farmer") {
    return kind === "produce";
  }

  if (role === "restaurant") {
    return kind === "waste";
  }

  if (role === "lgu_admin") {
    return kind === "waste";
  }

  return false;
};

const canBuyListing = (listing: Listing, role: AppRole | null | undefined) => {
  if (!role) return listing.kind === "produce";

  if (listing.kind === "produce") {
    return role === "restaurant" || role === "resident";
  }

  if (listing.kind === "waste") {
    return (role === "farmer" && listing.role === "lgu_admin") ||
      (role === "lgu_admin" && listing.role === "restaurant");
  }

  return false;
};

const canTradeListing = (listing: Listing, role: AppRole | null | undefined) => {
  if (!role) return false;
  return role === "restaurant" && listing.kind === "produce";
};

export function MarketplaceView() {
  const [q, setQ] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<Listing["kind"]>("produce");
  const [kg, setKg] = useState(0);
  const [price, setPrice] = useState("");
  const [availableAt, setAvailableAt] = useState("Today");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filterUserRole, setFilterUserRole] = useState<"farmer" | "restaurant" | "resident" | "lgu_admin" | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [filterTransactionType, setFilterTransactionType] = useState<"sell_only" | "barter_only" | "sell_and_barter" | "all">("all");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBarangay, setFilterBarangay] = useState("");
  const [transactionType, setTransactionType] = useState<"sell_only" | "barter_only" | "sell_and_barter">("sell_and_barter");
  const [acceptableExchanges, setAcceptableExchanges] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [incomingTradeRequests, setIncomingTradeRequests] = useState<TradeRequest[]>([]);
  const [incomingPurchaseRequests, setIncomingPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number; locationName: string; locationAddress: string } | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatUserId, setChatUserId] = useState<string | undefined>();
  const [chatUserName, setChatUserName] = useState<string | undefined>();
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editKg, setEditKg] = useState(0);
  const [editPrice, setEditPrice] = useState("");
  const [editAvailableAt, setEditAvailableAt] = useState("");
  const { user, profile } = useAuth();

  const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "uploads";

  useEffect(() => {
    const loadListings = async () => {
      const { data, error } = await supabase
        .from("marketplace_listings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error(`Unable to load marketplace listings: ${error.message}`);
      } else {
        // Fetch profile data for all listing owners
        const userIds = [...new Set(data?.map((l: any) => l.user_id) || [])];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, profile_picture_url, full_name")
          .in("id", userIds);

        const profileMap = new Map(profilesData?.map((p: any) => [p.id, p]) || []);

        // Combine listings with profile data
        const listingsWithProfiles = (data || []).map((listing: any) => ({
          ...listing,
          profiles: profileMap.get(listing.user_id),
        }));

        setListings(listingsWithProfiles);
      }
    };
    void loadListings();
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadUserListings = async () => {
      const { data, error } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error loading user listings:", error);
      } else {
        setUserListings(data ?? []);
      }
    };
    void loadUserListings();
  }, [user]);

  useEffect(() => {
    if (!user || userListings.length === 0) {
      setIncomingTradeRequests([]);
      setIncomingPurchaseRequests([]);
      return;
    }

    const loadIncomingRequests = async () => {
      const listingIds = userListings.map((listing) => listing.id);
      if (listingIds.length === 0) {
        setIncomingTradeRequests([]);
        setIncomingPurchaseRequests([]);
        return;
      }

      const { data: tradeData, error: tradeError } = await supabase
        .from("trade_requests")
        .select("*")
        .in("listing_id", listingIds)
        .order("created_at", { ascending: false });

      if (tradeError) {
        console.error("Error loading trade requests:", tradeError);
      } else {
        setIncomingTradeRequests(tradeData ?? []);
      }

      const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchase_requests")
        .select("*")
        .in("listing_id", listingIds)
        .order("created_at", { ascending: false });

      if (purchaseError) {
        console.error("Error loading purchase requests:", purchaseError);
      } else {
        setIncomingPurchaseRequests(purchaseData ?? []);
      }
    };

    void loadIncomingRequests();
  }, [user, userListings]);

  useEffect(() => {
      if (!file) {
        setPreviewUrl(null);
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

  const createListing = async () => {
    if (!user || !profile) return;
    if (!title.trim() || kg <= 0) {
      toast.error("Enter a title and quantity to list.");
      return;
    }

    let imageUrl: string | null = null;
    if (file) {
      try {
        const filePath = `marketplace/${user.id}/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: publicData } = await supabase.storage.from(STORAGE_BUCKET).getPublicUrl(uploadData.path ?? filePath);
        imageUrl = publicData.publicUrl;
      } catch (err: any) {
        const msg = err?.message ?? String(err);
        if (msg.includes("Bucket not found") || msg.includes("bucket not found") || msg.includes("no such bucket")) {
          toast.error(`Storage bucket "${STORAGE_BUCKET}" not found. Create it in Supabase Storage or set VITE_SUPABASE_STORAGE_BUCKET.`);
        } else if (msg.includes("row-level security") || msg.includes("violates row-level")) {
          toast.error(
            "Could not upload image: storage upload blocked by row-level security. " +
            "Ensure the signed-in user is authenticated and the Supabase storage bucket policy allows uploads."
          );
        } else {
          toast.error(`Could not upload image: ${msg}`);
        }
        return;
      }
    }

    if (!canCreateListing(profile.primary_role, kind)) {
      const message = profile.primary_role === "farmer"
        ? "Farmers can only list food produce." 
        : profile.primary_role === "restaurant"
          ? "Restaurants can only list food waste for the LGU." 
          : profile.primary_role === "lgu_admin"
            ? "LGU staff can only post organic fertilizer listings." 
            : "Residents can only list food produce.";
      toast.error(message);
      return;
    }

    const { data, error } = await (supabase
      .from("marketplace_listings") as any)
      .insert({
        user_id: user.id,
        role: profile.primary_role as "farmer" | "restaurant" | "resident" | "lgu_admin",
        seller: profile.full_name,
        title: title.trim(),
        kind,
        kg,
        price: price.trim() || null,
        available_at: availableAt,
        image: imageUrl,
        barangay: profile.barangay || "Siargao",
        transaction_type: "sell_and_barter",
        acceptable_exchanges: [],
        category: kind === "produce" ? "fresh produce" : "food waste",
      })
      .select()
      .single();

    if (error) {
      toast.error(`Could not create listing: ${error.message}`);
      return;
    }

    // Add profile data to the new listing
    const listingWithProfile = {
      ...(data as any),
      profiles: {
        profile_picture_url: profile?.profile_picture_url,
        full_name: profile?.full_name,
      },
    };

    setListings((current) => [listingWithProfile, ...current]);
    setTitle("");
    setKg(0);
    setPrice("");
    setAvailableAt("Today");
    setFile(null);
    setTransactionType("sell_and_barter");
    setAcceptableExchanges([]);
    setCategory("");
    setShowForm(false);
    setShowLocationPicker(false);
    setSelectedLocation(null);
    toast.success("Listing created.");
  };

  const requestListing = async (listing: Listing) => {
    if (!user || !profile) {
      toast.error("Sign in to request this listing.");
      return;
    }

    const { error } = await (supabase.from("trades") as any).insert({
      from_user_id: user.id,
      from_role: profile.primary_role,
      from_name: profile.full_name,
      from_gives: `Requesting ${listing.title}`,
      to_user_id: null,
      to_role: listing.role,
      to_name: listing.seller,
      to_gives: listing.title,
      status: "pending",
      trade_date: "Today",
    });

    if (error) {
      toast.error(`Could not request trade: ${error.message}`);
      return;
    }

    toast.success("Trade request sent.");
  };

  const handleTradeRequestStatus = async (requestId: string, status: Database["public"]["Enums"]["trade_status"]) => {
    const { error } = await supabase
      .from("trade_requests")
      .update({ status })
      .eq("id", requestId);

    if (error) {
      toast.error(`Could not update trade request: ${error.message}`);
      return;
    }

    setIncomingTradeRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, status } : request
      )
    );

    toast.success(`Trade request ${status}.`);
  };

  const handlePurchaseRequestStatus = async (requestId: string, status: Database["public"]["Enums"]["trade_status"]) => {
    const dbStatus = status === "accepted" ? "approved" : status === "rejected" ? "pending" : status;
    const uiStatus = status === "accepted" ? "accepted" : status;

    const { data: existingRequest, error: existingRequestError } = await supabase
      .from("purchase_requests")
      .select("status, listing_id, quantity_kg")
      .eq("id", requestId)
      .single();

    if (existingRequestError) {
      toast.error(`Could not load purchase request: ${existingRequestError.message}`);
      return;
    }

    const { data: updatedRequest, error } = await supabase
      .from("purchase_requests")
      .update({ status: dbStatus as any })
      .eq("id", requestId)
      .select("status, listing_id, quantity_kg")
      .single();

    if (error) {
      toast.error(`Could not update purchase request: ${error.message}`);
      return;
    }

    setIncomingPurchaseRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, status: uiStatus } : request
      )
    );

    if ((status === "accepted" || status === "completed") && updatedRequest) {
      const shouldDeduct = !(["accepted", "completed"].includes(existingRequest?.status ?? ""));
      if (shouldDeduct) {
        const listing = listings.find((item) => item.id === updatedRequest.listing_id) ?? userListings.find((item) => item.id === updatedRequest.listing_id);
        if (listing) {
          const requestedQty = Math.max(1, Number((updatedRequest as any)?.quantity_kg ?? (existingRequest as any)?.quantity_kg ?? 1) || 1);
          const currentKg = Number(listing.kg ?? 0);
          const nextKg = Math.max(0, currentKg - requestedQty);

          const { error: stockError } = await supabase
            .from("marketplace_listings")
            .update({ kg: nextKg, updated_at: new Date().toISOString() })
            .eq("id", listing.id);

          if (stockError) {
            toast.error(`Could not update stock: ${stockError.message}`);
            return;
          }

          setListings((prev) => prev.map((item) => item.id === listing.id ? { ...item, kg: nextKg } : item));
          setUserListings((prev) => prev.map((item) => item.id === listing.id ? { ...item, kg: nextKg } : item));
          setSelectedListing((prev) => prev?.id === listing.id ? { ...prev, kg: nextKg } : prev);
        }
      }
    }

    toast.success(`Purchase request ${uiStatus}.`);
  };

  const getListingById = (id: string) => userListings.find(l => l.id === id);

  const handleMessageClick = (listing: Listing) => {
    if (!user || user.id === listing.user_id) return;
    setChatUserId(listing.user_id);
    setChatUserName(listing.seller);
    setShowChat(true);
  };

  const handleEditListing = (listing: Listing) => {
    setEditingListing(listing);
    setEditTitle(listing.title);
    setEditKg(listing.kg);
    setEditPrice(listing.price || "");
    setEditAvailableAt(listing.available_at || "Today");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingListing || !editTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }

    const { error } = await (supabase
      .from("marketplace_listings") as any)
      .update({
        title: editTitle.trim(),
        kg: editKg,
        price: editPrice.trim() || null,
        available_at: editAvailableAt,
      })
      .eq("id", editingListing.id);

    if (error) {
      toast.error(`Could not update listing: ${error.message}`);
      return;
    }

    // Update listings in state
    setListings(prev =>
      prev.map(l =>
        l.id === editingListing.id
          ? {
              ...l,
              title: editTitle.trim(),
              kg: editKg,
              price: editPrice.trim() || null,
              available_at: editAvailableAt,
            }
          : l
      )
    );

    setUserListings(prev =>
      prev.map(l =>
        l.id === editingListing.id
          ? {
              ...l,
              title: editTitle.trim(),
              kg: editKg,
              price: editPrice.trim() || null,
              available_at: editAvailableAt,
            }
          : l
      )
    );

    setIsEditModalOpen(false);
    setEditingListing(null);
    toast.success("Listing updated");
  };

  const handleDeleteListing = async (listingId: string) => {
    const { error } = await supabase
      .from("marketplace_listings")
      .delete()
      .eq("id", listingId);

    if (error) {
      toast.error(`Could not delete listing: ${error.message}`);
      return;
    }

    // Remove from listings
    setListings(prev => prev.filter(l => l.id !== listingId));
    setUserListings(prev => prev.filter(l => l.id !== listingId));
    toast.success("Listing deleted");
  };

  const filtered = useMemo(
    () =>
      (kind: Listing["kind"], source: "all" | "restaurant" | "lgu_admin" = "all") =>
        listings
          .filter((l) => l.kind === kind)
          .filter((l) => canViewListing(l, profile?.primary_role, user?.id))
          .filter((l) => source === "all" || l.role === source)
          .filter((l) =>
            q ? `${l.title} ${l.seller} ${l.barangay}`.toLowerCase().includes(q.toLowerCase()) : true,
          )
          .filter((l) => filterTransactionType === "all" || l.transaction_type === filterTransactionType)
          .filter((l) => filterUserRole === "all" || l.role === filterUserRole)
          .filter((l) => !filterCategory || l.category?.toLowerCase().includes(filterCategory.toLowerCase()))
          .filter((l) => !filterBarangay || l.barangay?.toLowerCase().includes(filterBarangay.toLowerCase())),
    [listings, q, filterTransactionType, filterUserRole, filterCategory, filterBarangay, profile?.primary_role, user?.id],
  );

  const heroSub = profile?.primary_role === "farmer"
    ? "See the fresh produce you posted and buy organic fertilizer from LGU food waste listings."
    : profile?.primary_role === "lgu_admin"
      ? "Buy restaurant food waste and post organic fertilizer for farmers."
      : "Buy or barter fresh produce from local farmers. Or list food waste so it gets composted instead of landfilled.";

  return (
    <>
      <PageHero
        eyebrow="Marketplace"
        title="Two markets, one circular system."
        sub={heroSub}
        bgImage={marketBg}
      />
      <Container className="py-12">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-primary/20 bg-secondary/10 p-6 shadow-sm shadow-primary/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search crops, barangay or vendor" className="pl-9 border-primary/30 focus:border-primary focus:ring-primary/50" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-full border-primary/40 text-primary hover:bg-primary/10" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-1 h-4 w-4" /> Filters
            </Button>
            {user && profile?.primary_role !== "resident" && (
              <Button size="sm" className="rounded-full bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90" onClick={() => setShowForm((value) => !value)}>
                <Plus className="mr-1 h-4 w-4" /> New listing
              </Button>
            )}
          </div>
        </div>

        {showFilters && (
          <Card className="mb-6 p-4 border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10 shadow-sm shadow-primary/10">
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <Label className="mb-2 block text-sm font-medium text-primary">Transaction Type</Label>
                <Select value={filterTransactionType} onValueChange={(value: "sell_only" | "barter_only" | "sell_and_barter" | "all") => setFilterTransactionType(value)}>
                  <SelectTrigger className="border-primary/30 focus:border-primary focus:ring-primary/50">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="sell_only">Sell Only</SelectItem>
                    <SelectItem value="barter_only">Barter Only</SelectItem>
                    <SelectItem value="sell_and_barter">Sell & Barter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium text-primary">User Type</Label>
                <Select value={filterUserRole} onValueChange={(value: "farmer" | "restaurant" | "resident" | "lgu_admin" | "all") => setFilterUserRole(value)}>
                  <SelectTrigger className="border-primary/30 focus:border-primary focus:ring-primary/50">
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="farmer">Farmers</SelectItem>
                    <SelectItem value="restaurant">Restaurants</SelectItem>
                    <SelectItem value="resident">Residents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium text-primary">Category</Label>
                <Input value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} placeholder="e.g., vegetables, waste" className="border-primary/30 focus:border-primary focus:ring-primary/50" />
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium text-primary">Barangay</Label>
                <Input value={filterBarangay} onChange={(e) => setFilterBarangay(e.target.value)} placeholder="e.g., General Luna" className="border-primary/30 focus:border-primary focus:ring-primary/50" />
              </div>
            </div>
          </Card>
        )}

        {!user && (
          <Card className="mb-6 border-2 border-primary/30 p-4 text-center text-sm bg-secondary/10 text-slate-700">
            You're browsing as a guest. <Link to="/auth" className="text-primary underline hover:text-primary/80 font-medium">Sign in</Link> to message vendors, request trades and post your own listings.
          </Card>
        )}

        {showForm && user && profile?.primary_role !== "resident" && (
          <Card className="mb-6 p-6 border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10 shadow-sm shadow-primary/10">
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold text-primary">Create a new listing</h2>
                <p className="text-sm text-slate-600/70">
                  {profile?.primary_role === "farmer"
                    ? "Farmers can publish fresh produce only. Organic fertilizer appears from LGU food waste posts."
                    : profile?.primary_role === "lgu_admin"
                      ? "LGU staff can publish organic fertilizer listings for farmers."
                      : profile?.primary_role === "restaurant"
                        ? "Restaurants can post waste listings only."
                        : "Farmers can publish fresh produce or waste available for barter or pickup."}
                </p>
              </div>
              <Button variant="outline" size="sm" className="border-primary/40 text-primary hover:bg-primary/10" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Listing title" className="border-primary/30 focus:border-primary focus:ring-primary/50" />
              <Input type="number" value={kg || ""} onChange={(e) => setKg(Number(e.target.value) || 0)} placeholder="Quantity (kg)" className="border-primary/30 focus:border-primary focus:ring-primary/50" />
              <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price or terms" className="border-primary/30 focus:border-primary focus:ring-primary/50" />
              <Input value={availableAt} onChange={(e) => setAvailableAt(e.target.value)} placeholder="Available date" className="border-primary/30 focus:border-primary focus:ring-primary/50" />
              <div className="sm:col-span-2 flex flex-wrap gap-3">
                {profile?.primary_role === "restaurant" ? (
                  <Button type="button" className="bg-secondary text-slate-900 hover:bg-secondary/90">♻️ Waste</Button>
                ) : (
                  <>
                    {profile?.primary_role !== "lgu_admin" && (
                      <Button type="button" className={kind === "produce" ? "bg-primary text-white hover:bg-primary/90" : "text-primary border border-primary/30 hover:bg-primary/10"} onClick={() => setKind("produce")}>🌾 Produce</Button>
                    )}
                    {profile?.primary_role !== "farmer" && (
                      <Button type="button" className={kind === "waste" ? "bg-secondary text-slate-900 hover:bg-secondary/90" : "text-slate-700 border border-primary/30 hover:bg-primary/10"} onClick={() => setKind("waste")}>🧪 Organic Fertilizer</Button>
                    )}
                  </>
                )}
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-2 block text-sm font-medium text-primary">Transaction Type</Label>
                <Select value={transactionType} onValueChange={(value: "sell_only" | "barter_only" | "sell_and_barter") => setTransactionType(value)}>
                  <SelectTrigger className="border-primary/30 focus:border-primary focus:ring-primary/50">
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sell_only">Sell Only</SelectItem>
                    <SelectItem value="barter_only">Barter Only</SelectItem>
                    <SelectItem value="sell_and_barter">Sell and Barter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(transactionType === "barter_only" || transactionType === "sell_and_barter") && (
                <div className="sm:col-span-2">
                  <Label className="mb-2 block text-sm font-medium text-primary">Acceptable Exchanges</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {profile?.primary_role === "farmer" ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="food-waste"
                            checked={acceptableExchanges.includes("Food Waste")}
                            onCheckedChange={(checked) => {
                              setAcceptableExchanges(checked 
                                ? [...acceptableExchanges, "Food Waste"]
                                : acceptableExchanges.filter(e => e !== "Food Waste")
                              );
                            }}
                          />
                          <Label htmlFor="food-waste" className="text-sm">Food Waste</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="restaurant-food-waste"
                            checked={acceptableExchanges.includes("Restaurant Food Waste")}
                            onCheckedChange={(checked) => {
                              setAcceptableExchanges(checked 
                                ? [...acceptableExchanges, "Restaurant Food Waste"]
                                : acceptableExchanges.filter(e => e !== "Restaurant Food Waste")
                              );
                            }}
                          />
                          <Label htmlFor="restaurant-food-waste" className="text-sm">Restaurant Food Waste</Label>
                        </div>
                      </>
                    ) : profile?.primary_role === "restaurant" ? (
                      <>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="fresh-vegetables"
                            checked={acceptableExchanges.includes("Fresh Vegetables")}
                            onCheckedChange={(checked) => {
                              setAcceptableExchanges(checked 
                                ? [...acceptableExchanges, "Fresh Vegetables"]
                                : acceptableExchanges.filter(e => e !== "Fresh Vegetables")
                              );
                            }}
                          />
                          <Label htmlFor="fresh-vegetables" className="text-sm">Fresh Vegetables</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="fruits"
                            checked={acceptableExchanges.includes("Fruits")}
                            onCheckedChange={(checked) => {
                              setAcceptableExchanges(checked 
                                ? [...acceptableExchanges, "Fruits"]
                                : acceptableExchanges.filter(e => e !== "Fruits")
                              );
                            }}
                          />
                          <Label htmlFor="fruits" className="text-sm">Fruits</Label>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="fresh-vegetables-resident"
                            checked={acceptableExchanges.includes("Fresh Vegetables")}
                            onCheckedChange={(checked) => {
                              setAcceptableExchanges(checked 
                                ? [...acceptableExchanges, "Fresh Vegetables"]
                                : acceptableExchanges.filter(e => e !== "Fresh Vegetables")
                              );
                            }}
                          />
                          <Label htmlFor="fresh-vegetables-resident" className="text-sm">Fresh Vegetables</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="fruits-resident"
                            checked={acceptableExchanges.includes("Fruits")}
                            onCheckedChange={(checked) => {
                              setAcceptableExchanges(checked 
                                ? [...acceptableExchanges, "Fruits"]
                                : acceptableExchanges.filter(e => e !== "Fruits")
                              );
                            }}
                          />
                          <Label htmlFor="fruits-resident" className="text-sm">Fruits</Label>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              <div className="sm:col-span-2">
                <Label className="mb-2 block text-sm font-medium text-primary">Category</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={kind === "produce" ? "e.g., Tomatoes, Lettuce" : "e.g., Vegetable Scraps, Food Waste"} className="border-primary/30 focus:border-primary focus:ring-primary/50" />
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-primary">Add a photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-sm border border-primary/30 rounded-md p-2 w-full"
              />
              {previewUrl && (
                <img src={previewUrl} alt="Preview" className="mt-3 h-40 w-full rounded-md object-cover border-2 border-primary/30" />
              )}
            </div>
            <div className="mt-4">
              <Button 
                variant={selectedLocation ? "secondary" : "outline"} 
                onClick={() => setShowLocationPicker(true)}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                {selectedLocation ? "Location Selected" : "Add Location"}
              </Button>
              {selectedLocation && (
                <p className="text-sm text-muted-foreground mt-2">{selectedLocation.locationName}</p>
              )}
            </div>
            {showLocationPicker && (
              <div className="mt-4">
                <LocationPicker 
                  onLocationSelect={(location) => {
                    setSelectedLocation(location);
                    setShowLocationPicker(false);
                  }}
                  initialLocation={selectedLocation ? { latitude: selectedLocation.latitude, longitude: selectedLocation.longitude } : undefined}
                />
              </div>
            )}
            <div className="mt-4">
              <Button onClick={createListing} className="rounded-full bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90">Publish listing</Button>
            </div>
          </Card>
        )}

        <Tabs defaultValue={profile?.primary_role === "lgu_admin" ? "organic-fertilizer" : "produce"} className="mt-8">
          <TabsList className={`grid w-full ${profile?.primary_role === "lgu_admin" ? "grid-cols-1" : profile?.primary_role === "farmer" ? "grid-cols-2" : profile?.primary_role === "restaurant" ? "grid-cols-2" : "grid-cols-1"} bg-sand/50 border-2 border-primary/30 rounded-lg p-1`}>
            {profile?.primary_role !== "lgu_admin" && (
              <TabsTrigger value="produce" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white text-slate-700">
                {profile?.primary_role === "farmer" ? "🌾 My Produce" : profile?.primary_role === "restaurant" ? "🌾 Produce" : "🌾 Fresh Produce"}
              </TabsTrigger>
            )}
            {profile?.primary_role === "restaurant" && (
              <TabsTrigger value="restaurant-waste" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-primary data-[state=active]:text-white text-slate-700">
                🍽️ My Food Waste
              </TabsTrigger>
            )}
            {(profile?.primary_role === "farmer" || profile?.primary_role === "lgu_admin") && (
              <TabsTrigger value="organic-fertilizer" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-primary data-[state=active]:text-white text-slate-700">
                🧪 Organic Fertilizer
              </TabsTrigger>
            )}
          </TabsList>
          {profile?.primary_role !== "lgu_admin" && (
            <TabsContent value="produce" className="mt-6">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered("produce").map((l) => (
                  <ListingCard
                    key={l.id}
                    item={l}
                    onTrade={canTradeListing(l, profile?.primary_role) ? () => {
                      setSelectedListing(l);
                      setShowTradeModal(true);
                    } : undefined}
                    onBuy={canBuyListing(l, profile?.primary_role) ? () => {
                      setSelectedListing(l);
                      setShowBuyModal(true);
                    } : undefined}
                    onMessage={() => handleMessageClick(l)}
                    onEdit={() => handleEditListing(l)}
                    onDelete={() => handleDeleteListing(l.id)}
                  />
                ))}
              </div>
            </TabsContent>
          )}
          {profile?.primary_role === "restaurant" && (
            <TabsContent value="restaurant-waste" className="mt-6">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered("waste", "restaurant").map((l) => (
                  <ListingCard
                    key={l.id}
                    item={l}
                    onTrade={canTradeListing(l, profile?.primary_role) ? () => {
                      setSelectedListing(l);
                      setShowTradeModal(true);
                    } : undefined}
                    onBuy={canBuyListing(l, profile?.primary_role) ? () => {
                      setSelectedListing(l);
                      setShowBuyModal(true);
                    } : undefined}
                    onMessage={() => handleMessageClick(l)}
                    onEdit={() => handleEditListing(l)}
                    onDelete={() => handleDeleteListing(l.id)}
                  />
                ))}
              </div>
            </TabsContent>
          )}
          {(profile?.primary_role === "farmer" || profile?.primary_role === "lgu_admin") && (
            <TabsContent value="organic-fertilizer" className="mt-6">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered("waste", "lgu_admin").map((l) => (
                  <ListingCard
                    key={l.id}
                    item={l}
                    onTrade={canTradeListing(l, profile?.primary_role) ? () => {
                      setSelectedListing(l);
                      setShowTradeModal(true);
                    } : undefined}
                    onBuy={canBuyListing(l, profile?.primary_role) ? () => {
                      setSelectedListing(l);
                      setShowBuyModal(true);
                    } : undefined}
                    onMessage={() => handleMessageClick(l)}
                    onEdit={() => handleEditListing(l)}
                    onDelete={() => handleDeleteListing(l.id)}
                  />
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </Container>

      <TradeRequestModal
        open={showTradeModal}
        onOpenChange={setShowTradeModal}
        listing={selectedListing}
        userListings={userListings}
        user={user ? { id: user.id, full_name: profile?.full_name || "", primary_role: profile?.primary_role || "resident" } : null}
        onSuccess={() => {
          toast.success("Trade request sent successfully!");
        }}
      />

      <BuyRequestModal
        open={showBuyModal}
        onOpenChange={setShowBuyModal}
        listing={selectedListing}
        user={user ? { id: user.id, full_name: profile?.full_name || "", primary_role: profile?.primary_role || "resident" } : null}
        onSuccess={() => {
          toast.success("Purchase request sent successfully!");
        }}
      />

      <ChatMessenger
        open={showChat}
        onOpenChange={setShowChat}
        otherUserId={chatUserId}
        otherUserName={chatUserName}
      />

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-primary">Edit listing</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Listing title"
                  className="border-primary/30 focus:border-primary focus:ring-primary/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity (kg)</label>
                  <Input
                    type="number"
                    value={editKg || ""}
                    onChange={(e) => setEditKg(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="border-primary/30 focus:border-primary focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price / Terms</label>
                  <Input
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="Price or terms"
                    className="border-primary/30 focus:border-primary focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Available at</label>
                <Input
                  value={editAvailableAt}
                  onChange={(e) => setEditAvailableAt(e.target.value)}
                  placeholder="Today"
                  className="border-primary/30 focus:border-primary focus:ring-primary/50"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90"
              >
                Save changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
