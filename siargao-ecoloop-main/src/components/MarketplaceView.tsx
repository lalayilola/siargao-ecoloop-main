import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Container, PageHero } from "@/components/Section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListingCard } from "@/components/ListingCard";
import { Search, Lock, Plus, Filter, Check, X, MessageCircle, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
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
type TransactionType = Database["public"]["Enums"]["transaction_type"];
type TradeRequest = Database["public"]["Tables"]["trade_requests"]["Row"];
type PurchaseRequest = Database["public"]["Tables"]["purchase_requests"]["Row"];

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
  const [transactionType, setTransactionType] = useState<TransactionType>("sell_and_barter");
  const [acceptableExchanges, setAcceptableExchanges] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [filterTransactionType, setFilterTransactionType] = useState<TransactionType | "all">("all");
  const [filterUserRole, setFilterUserRole] = useState<Database["public"]["Enums"]["app_role"] | "all">("all");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBarangay, setFilterBarangay] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [incomingTradeRequests, setIncomingTradeRequests] = useState<TradeRequest[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number; locationName: string; locationAddress: string } | null>(null);
  const [incomingPurchaseRequests, setIncomingPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [chatUserId, setChatUserId] = useState<string | undefined>();
  const [chatUserName, setChatUserName] = useState<string | undefined>();
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
          .select("id, avatar_url, full_name")
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
    if (!user || userListings.length === 0) return;

    const loadIncomingRequests = async () => {
      const listingIds = userListings.map(l => l.id);
      
      // Load incoming trade requests
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

      // Load incoming purchase requests
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

    const { data, error } = await supabase
      .from("marketplace_listings")
      .insert({
        user_id: user.id,
        title: title.trim(),
        kind,
        seller: profile.full_name,
        role: profile.primary_role,
        barangay: profile.barangay,
        kg,
        price: price.trim() || null,
        available_at: availableAt,
        image: imageUrl ?? (kind === "produce" ? "produce" : "compost"),
        transaction_type: transactionType,
        acceptable_exchanges: acceptableExchanges,
        category: category || kind === "produce" ? "fresh produce" : "food waste",
        latitude: selectedLocation?.latitude || null,
        longitude: selectedLocation?.longitude || null,
        location_name: selectedLocation?.locationName || null,
        location_address: selectedLocation?.locationAddress || null,
      } as any)
      .select()
      .single();

    if (error) {
      toast.error(`Could not create listing: ${error.message}`);
      return;
    }

    setListings((current) => [data, ...current]);
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

    const { error } = await supabase.from("trades").insert({
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
      toast.error(`Failed to update trade request: ${error.message}`);
      return;
    }

    setIncomingTradeRequests(prev => 
      prev.map(req => req.id === requestId ? { ...req, status } : req)
    );
    toast.success(`Trade request ${status}`);
  };

  const handlePurchaseRequestStatus = async (requestId: string, status: Database["public"]["Enums"]["trade_status"]) => {
    const uiStatus = status === "accepted" ? "accepted" : status;
    const candidateStatuses = status === "accepted"
      ? (["approved", "accepted", "completed"] as const)
      : status === "rejected"
        ? (["rejected", "pending"] as const)
        : ([status] as const);

    const { data: existingRequest, error: existingRequestError } = await supabase
      .from("purchase_requests")
      .select("status, listing_id, quantity_kg")
      .eq("id", requestId)
      .single();

    if (existingRequestError) {
      toast.error(`Failed to load purchase request: ${existingRequestError.message}`);
      return;
    }

    let updatedRequest: any = null;
    let updateError: any = null;

    for (const candidateStatus of candidateStatuses) {
      const result = await supabase
        .from("purchase_requests")
        .update({ status: candidateStatus as any })
        .eq("id", requestId)
        .select("status, listing_id, quantity_kg")
        .single();

      if (!result.error) {
        updatedRequest = result.data;
        updateError = null;
        break;
      }

      updateError = result.error;
    }

    if (updateError) {
      toast.error(`Failed to update purchase request: ${updateError.message}`);
      return;
    }

    setIncomingPurchaseRequests(prev => 
      prev.map(req => req.id === requestId ? { ...req, status: uiStatus } : req)
    );

    if ((status === "accepted" || status === "completed") && updatedRequest) {
      const shouldDeduct = !(["accepted", "completed", "approved"].includes(existingRequest?.status ?? ""));
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

    toast.success(`Purchase request ${uiStatus}`);
  };

  const getListingById = (id: string) => userListings.find(l => l.id === id);

  const handleMessageClick = (listing: Listing) => {
    if (!user || user.id === listing.user_id) return;
    setChatUserId(listing.user_id);
    setChatUserName(listing.seller);
    setShowChat(true);
  };

  const filtered = useMemo(
    () =>
      (kind: Listing["kind"]) =>
        listings
          .filter((l) => l.kind === kind)
          .filter((l) =>
            q ? `${l.title} ${l.seller} ${l.barangay}`.toLowerCase().includes(q.toLowerCase()) : true,
          )
          .filter((l) => filterTransactionType === "all" || l.transaction_type === filterTransactionType)
          .filter((l) => filterUserRole === "all" || l.role === filterUserRole)
          .filter((l) => !filterCategory || l.category?.toLowerCase().includes(filterCategory.toLowerCase()))
          .filter((l) => !filterBarangay || l.barangay?.toLowerCase().includes(filterBarangay.toLowerCase())),
    [listings, q, filterTransactionType, filterUserRole, filterCategory, filterBarangay],
  );

  return (
    <>
      <PageHero
        eyebrow="Marketplace"
        title="Two markets, one circular system."
        sub="Buy or barter fresh produce from local farmers. Or list food waste so it gets composted instead of landfilled."
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
            {user ? (
              <Button size="sm" className="rounded-full bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90" onClick={() => setShowForm((value) => !value)}>
                <Plus className="mr-1 h-4 w-4" /> New listing
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline" className="rounded-full border-primary/40 text-primary hover:bg-primary/10">
                <Link to="/auth"><Lock className="mr-1 h-4 w-4" /> Sign in to list</Link>
              </Button>
            )}
          </div>
        </div>

        {showFilters && (
          <Card className="mb-6 p-4 border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10 shadow-sm shadow-primary/10">
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <Label className="mb-2 block text-sm font-medium text-primary">Transaction Type</Label>
                <Select value={filterTransactionType} onValueChange={(value: TransactionType | "all") => setFilterTransactionType(value)}>
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
                <Select value={filterUserRole} onValueChange={(value: Database["public"]["Enums"]["app_role"] | "all") => setFilterUserRole(value)}>
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

        {showForm && user && (
          <Card className="mb-6 p-6 border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10 shadow-sm shadow-primary/10">
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold text-primary">Create a new listing</h2>
                <p className="text-sm text-slate-600/70">Farmers can publish fresh produce or waste available for barter or pickup.</p>
              </div>
              <Button variant="outline" size="sm" className="border-primary/40 text-primary hover:bg-primary/10" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Listing title" className="border-primary/30 focus:border-primary focus:ring-primary/50" />
              <Input type="number" value={kg || ""} onChange={(e) => setKg(Number(e.target.value) || 0)} placeholder="Quantity (kg)" className="border-primary/30 focus:border-primary focus:ring-primary/50" />
              <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price or terms" className="border-primary/30 focus:border-primary focus:ring-primary/50" />
              <Input value={availableAt} onChange={(e) => setAvailableAt(e.target.value)} placeholder="Available date" className="border-primary/30 focus:border-primary focus:ring-primary/50" />
              <div className="sm:col-span-2 flex flex-wrap gap-3">
                <Button type="button" className={kind === "produce" ? "bg-primary text-white hover:bg-primary/90" : "text-primary border border-primary/30 hover:bg-primary/10"} onClick={() => setKind("produce")}>🌾 Produce</Button>
                <Button type="button" className={kind === "waste" ? "bg-secondary text-slate-900 hover:bg-secondary/90" : "text-slate-700 border border-primary/30 hover:bg-primary/10"} onClick={() => setKind("waste")}>♻️ Waste</Button>
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-2 block text-sm font-medium text-primary">Transaction Type</Label>
                <Select value={transactionType} onValueChange={(value: TransactionType) => setTransactionType(value)}>
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
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="cooked-food"
                            checked={acceptableExchanges.includes("Cooked Food")}
                            onCheckedChange={(checked) => {
                              setAcceptableExchanges(checked 
                                ? [...acceptableExchanges, "Cooked Food"]
                                : acceptableExchanges.filter(e => e !== "Cooked Food")
                              );
                            }}
                          />
                          <Label htmlFor="cooked-food" className="text-sm">Cooked Food</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="other-produce"
                            checked={acceptableExchanges.includes("Other Fresh Produce")}
                            onCheckedChange={(checked) => {
                              setAcceptableExchanges(checked 
                                ? [...acceptableExchanges, "Other Fresh Produce"]
                                : acceptableExchanges.filter(e => e !== "Other Fresh Produce")
                              );
                            }}
                          />
                          <Label htmlFor="other-produce" className="text-sm">Other Fresh Produce</Label>
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
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="agricultural-products"
                            checked={acceptableExchanges.includes("Agricultural Products")}
                            onCheckedChange={(checked) => {
                              setAcceptableExchanges(checked 
                                ? [...acceptableExchanges, "Agricultural Products"]
                                : acceptableExchanges.filter(e => e !== "Agricultural Products")
                              );
                            }}
                          />
                          <Label htmlFor="agricultural-products" className="text-sm">Agricultural Products</Label>
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

        <Tabs defaultValue="produce" className="mt-8">
          <TabsList className="grid w-full grid-cols-3 bg-sand/50 border-2 border-primary/30 rounded-lg p-1">
            <TabsTrigger value="produce" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white text-slate-700">🌾 Fresh Produce</TabsTrigger>
            <TabsTrigger value="waste" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-primary data-[state=active]:text-white text-slate-700">♻️ Food Waste</TabsTrigger>
            {user && (
              <TabsTrigger value="requests" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white text-slate-700">
                📨 My Requests {incomingTradeRequests.length + incomingPurchaseRequests.length > 0 && `(${incomingTradeRequests.length + incomingPurchaseRequests.length})`}
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="produce" className="mt-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered("produce").map((l) => (
                <ListingCard
                  key={l.id}
                  item={l}
                  onTrade={() => {
                    setSelectedListing(l);
                    setShowTradeModal(true);
                  }}
                  onBuy={() => {
                    setSelectedListing(l);
                    setShowBuyModal(true);
                  }}
                  onMessage={() => handleMessageClick(l)}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="waste" className="mt-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered("waste").map((l) => (
                <ListingCard
                  key={l.id}
                  item={l}
                  onTrade={() => {
                    setSelectedListing(l);
                    setShowTradeModal(true);
                  }}
                  onBuy={() => {
                    setSelectedListing(l);
                    setShowBuyModal(true);
                  }}
                  onMessage={() => handleMessageClick(l)}
                />
              ))}
            </div>
          </TabsContent>
          {user && (
            <TabsContent value="requests" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-display text-lg font-semibold text-primary mb-4">Trade Requests</h3>
                  {incomingTradeRequests.length === 0 ? (
                    <Card className="p-6 text-center border-2 border-primary/20 bg-secondary/10">
                      <p className="text-slate-600">No trade requests yet</p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {incomingTradeRequests.map((request) => {
                        const listing = getListingById(request.listing_id);
                        return (
                          <Card key={request.id} className="p-4 border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={request.status === 'pending' ? 'default' : request.status === 'accepted' ? 'secondary' : 'outline'}>
                                    {request.status}
                                  </Badge>
                                  <span className="text-sm text-slate-500">
                                    {new Date(request.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="font-medium text-slate-900">{request.requester_name}</p>
                                <p className="text-sm text-slate-600 mb-2">wants to trade for: {listing?.title}</p>
                                {request.offered_item_title && (
                                  <p className="text-sm text-slate-600">offering: {request.offered_item_title}</p>
                                )}
                                {request.message && (
                                  <p className="text-sm text-slate-500 mt-2 italic">"{request.message}"</p>
                                )}
                              </div>
                              {request.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleTradeRequestStatus(request.id, 'accepted')}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleTradeRequestStatus(request.id, 'rejected')}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-display text-lg font-semibold text-primary mb-4">Purchase Requests</h3>
                  {incomingPurchaseRequests.length === 0 ? (
                    <Card className="p-6 text-center border-2 border-primary/20 bg-secondary/10">
                      <p className="text-slate-600">No purchase requests yet</p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {incomingPurchaseRequests.map((request) => {
                        const listing = getListingById(request.listing_id);
                        return (
                          <Card key={request.id} className="p-4 border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={request.status === 'pending' ? 'default' : request.status === 'accepted' ? 'secondary' : 'outline'}>
                                    {request.status}
                                  </Badge>
                                  <span className="text-sm text-slate-500">
                                    {new Date(request.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="font-medium text-slate-900">{request.buyer_name}</p>
                                <p className="text-sm text-slate-600 mb-2">wants to buy: {listing?.title}</p>
                                {request.message && (
                                  <p className="text-sm text-slate-500 mt-2 italic">"{request.message}"</p>
                                )}
                              </div>
                              {request.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handlePurchaseRequestStatus(request.id, 'accepted')}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handlePurchaseRequestStatus(request.id, 'rejected')}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
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
    </>
  );
}
