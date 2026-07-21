import { useEffect, useMemo, useState } from "react";

import { Link } from "@tanstack/react-router";

import { Container, PageHero, PremiumHero } from "@/components/layout/Section";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { Card } from "@/components/ui/card";

import { ListingCard } from "@/components/marketplace/ListingCard";

import { Search, Lock, Plus, Filter, Check, X, MessageCircle, MapPin, AlertCircle } from "lucide-react";

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogFooter,

  DialogHeader,

  DialogTitle,

} from "@/components/ui/dialog";

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

import { BuyRequestModal } from "@/components/marketplace/BuyRequestModal";

import { Badge } from "@/components/ui/badge";

import { ChatMessenger } from "@/components/messaging/ChatMessenger";

import { LocationPicker } from "@/components/auth/LocationPicker";



type Listing = Database["public"]["Tables"]["marketplace_listings"]["Row"];

type PurchaseRequest = Database["public"]["Tables"]["purchase_requests"]["Row"];



const canViewListing = (listing: Listing, role: AppRole | null | undefined, currentUserId?: string) => {

  // Always show own listings

  if (currentUserId && listing.user_id === currentUserId) return true;



  if (!role) {

    return listing.kind === "produce";

  }



  // LGU admin can see all listings in their municipality (filtered at query level)

  if (role === "lgu_admin") {

    return true;

  }



  if (role === "farmer") {

    return listing.kind === "produce" || listing.kind === "compost";

  }



  if (role === "restaurant") {

    return listing.kind === "produce" || listing.kind === "waste";

  }



  if (role === "resident") {

    return listing.kind === "produce";

  }



  return false;

};



const canCreateListing = (role: AppRole | null | undefined, kind: Listing["kind"], lguApproved: boolean) => {

  if (!role) return false;

  if (!lguApproved) return false;



  if (role === "farmer") {

    return kind === "produce";

  }



  if (role === "restaurant") {

    return kind === "waste";

  }



  if (role === "lgu_admin") {

    return kind === "compost";

  }



  return false;

};



const canBuyListing = (listing: Listing, role: AppRole | null | undefined, lguApproved: boolean) => {

  if (!role) return listing.kind === "produce";

  if (!lguApproved) return false;



  if (listing.kind === "produce") {

    return role === "restaurant" || role === "resident" || role === "lgu_admin";

  }



  if (listing.kind === "waste") {

    return (role === "farmer" && listing.role === "restaurant") || role === "lgu_admin";

  }



  if (listing.kind === "compost") {

    return role === "farmer" || role === "lgu_admin";

  }



  return false;

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

  const [files, setFiles] = useState<File[]>([]);

  const [uploading, setUploading] = useState(false);

  const [filterUserRole, setFilterUserRole] = useState<"farmer" | "restaurant" | "resident" | "lgu_admin" | "all">("all");

  const [showFilters, setShowFilters] = useState(false);

  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [showBuyModal, setShowBuyModal] = useState(false);

  const [filterCategory, setFilterCategory] = useState("");

  const [filterBarangay, setFilterBarangay] = useState("");

  const [transactionType, setTransactionType] = useState<"sell_only">("sell_only");

  const [acceptableExchanges, setAcceptableExchanges] = useState<string[]>([]);

  const [category, setCategory] = useState("");

  const [userListings, setUserListings] = useState<Listing[]>([]);

  const [incomingPurchaseRequests, setIncomingPurchaseRequests] = useState<PurchaseRequest[]>([]);

  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number; locationName: string; locationAddress: string } | null>(null);

  const [listingLocationName, setListingLocationName] = useState("");

  const [listingLocationAddress, setListingLocationAddress] = useState("");

  const [showEditLocationPicker, setShowEditLocationPicker] = useState(false);

  const [editLocationName, setEditLocationName] = useState("");

  const [editLocationAddress, setEditLocationAddress] = useState("");

  const [editLatitude, setEditLatitude] = useState<number | null>(null);

  const [editLongitude, setEditLongitude] = useState<number | null>(null);

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

  const [stats, setStats] = useState({
    totalListings: 0,
    freshProduceListings: 0,
    foodWasteListings: 0,
    compostListings: 0,
    verifiedSellers: 0,
    activeBuyers: 0,
    completedTransactions: 0,
    wasteDiverted: 0,
  });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "uploads";

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        const municipality = profile?.municipality;
        
        // Build base query
        let listingsQuery = supabase.from("marketplace_listings").select("*");
        if (municipality) {
          listingsQuery = listingsQuery.eq("municipality", municipality);
        }
        
        const { data: listings } = await listingsQuery;
        
        // Calculate statistics
        const totalListings = listings?.length || 0;
        const freshProduceListings = listings?.filter(l => l.kind === "produce").length || 0;
        const foodWasteListings = listings?.filter(l => l.kind === "waste").length || 0;
        const compostListings = listings?.filter(l => l.kind === "compost").length || 0;
        
        // Get verified sellers
        let profilesQuery = supabase.from("profiles").select("*");
        if (municipality) {
          profilesQuery = profilesQuery.eq("municipality", municipality);
        }
        const { data: profiles } = await profilesQuery;
        const verifiedSellers = profiles?.filter(p => p.lgu_approved).length || 0;
        
        // Get active buyers (users who have made purchase requests)
        let purchaseRequestsQuery = supabase.from("purchase_requests").select("*");
        if (municipality) {
          purchaseRequestsQuery = purchaseRequestsQuery.eq("municipality", municipality);
        }
        const { data: purchaseRequests } = await purchaseRequestsQuery;
        const activeBuyers = new Set(purchaseRequests?.map(pr => pr.buyer_id)).size;
        
        // Get completed transactions
        const completedTransactions = purchaseRequests?.filter(pr => pr.status === "completed").length || 0;
        
        // Calculate waste diverted (sum of kg from completed waste transactions)
        const wasteDiverted = purchaseRequests
          ?.filter(pr => pr.status === "completed" && pr.kind === "waste")
          .reduce((sum, pr) => sum + (pr.quantity_kg || 0), 0) || 0;
        
        setStats({
          totalListings,
          freshProduceListings,
          foodWasteListings,
          compostListings,
          verifiedSellers,
          activeBuyers,
          completedTransactions,
          wasteDiverted,
        });
        setLastRefresh(new Date());
      } catch (error) {
        console.error("Error loading statistics:", error);
      }
    };

    loadStatistics();
  }, [profile?.municipality]);



  useEffect(() => {

    const loadListings = async () => {

      const query = supabase

        .from("marketplace_listings")

        .select("*");



      // Filter based on user role and municipality
      if (user?.id && profile?.municipality) {
        if (profile.primary_role === "farmer") {
          // Farmers see their own listings + listings from same municipality
          query.or(`municipality.eq.${profile.municipality},user_id.eq.${user.id}`);
        } else {
          // Other roles see their municipality listings plus their own
          query.or(`municipality.eq.${profile.municipality},user_id.eq.${user.id}`);
        }
      } else if (user?.id) {
        // If no municipality set, just show own listings
        query.eq("user_id", user.id);
      }



      const { data, error } = await query.order("created_at", { ascending: false });

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

  }, [profile, user]);



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

      setIncomingPurchaseRequests([]);

      return;

    }



    const loadIncomingRequests = async () => {

      const listingIds = userListings.map((listing) => listing.id);

      if (listingIds.length === 0) {

        setIncomingPurchaseRequests([]);

        return;

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

    setCurrentImageIndex(0);

  }, [selectedListing]);





  const createListing = async () => {

    if (!user || !profile) return;

    if (!title.trim() || kg <= 0) {

      toast.error("Enter a title and quantity to list.");

      return;

    }



    // Check if user is verified

    if (!profile.lgu_approved) {

      toast.error("Your account must be verified by the LGU before you can create listings. Please upload your government ID and wait for verification.");

      return;

    }



    let imageUrls: string[] = [];

    if (files.length > 0) {

      setUploading(true);

      try {

        const uploadPromises = files.map(async (file) => {

          const filePath = `marketplace/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;

          const { data: uploadData, error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: publicData } = await supabase.storage.from(STORAGE_BUCKET).getPublicUrl(uploadData.path ?? filePath);

          return publicData.publicUrl;

        });

        imageUrls = await Promise.all(uploadPromises);

      } catch (err: any) {

        const msg = err?.message ?? String(err);

        if (msg.includes("Bucket not found") || msg.includes("bucket not found") || msg.includes("no such bucket")) {

          toast.error(`Storage bucket "${STORAGE_BUCKET}" not found. Create it in Supabase Storage or set VITE_SUPABASE_STORAGE_BUCKET.`);

        } else if (msg.includes("row-level security") || msg.includes("violates row-level")) {

          toast.error(

            "Could not upload images: storage upload blocked by row-level security. " +

            "Ensure the signed-in user is authenticated and the Supabase storage bucket policy allows uploads."

          );

        } else {

          toast.error(`Could not upload images: ${msg}`);

        }

        setUploading(false);

        return;

      } finally {

        setUploading(false);

      }

    }



    if (!canCreateListing(profile.primary_role, kind, profile.lgu_approved || false)) {

      const message = !profile.lgu_approved
        ? "Your account must be verified by the LGU before you can create listings. Please upload your government ID and wait for verification."
        : profile.primary_role === "farmer"
          ? "Farmers can only list food produce."
          : profile.primary_role === "restaurant"
            ? "Hotels/Restaurants can only list food waste for the LGU."
            : profile.primary_role === "lgu_admin"
              ? "LGU staff can only post compost listings."
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

        image: imageUrls.length > 0 ? imageUrls[0] : null,

        images: imageUrls,

        barangay: profile.barangay || "Siargao",

        municipality: profile.municipality || "general_luna",

        transaction_type: "sell_only",

        acceptable_exchanges: [],

        category: kind === "produce" ? "fresh produce" : "food waste",

        location_name: listingLocationName.trim() || selectedLocation?.locationName || null,

        location_address: listingLocationAddress.trim() || selectedLocation?.locationAddress || null,

        latitude: selectedLocation?.latitude ?? null,

        longitude: selectedLocation?.longitude ?? null,

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

    setFiles([]);

    setTransactionType("sell_only");

    setAcceptableExchanges([]);

    setCategory("");

    setListingLocationName("");

    setListingLocationAddress("");

    setShowForm(false);

    setShowLocationPicker(false);

    setSelectedLocation(null);

    toast.success("Listing created.");

  };



  const handlePurchaseRequestStatus = async (requestId: string, status: Database["public"]["Enums"]["trade_status"]) => {

    const { data: existingRequest, error: existingRequestError } = await (supabase

      .from("purchase_requests") as any)

      .select("status, listing_id, quantity_kg")

      .eq("id", requestId)

      .single();



    if (existingRequestError) {

      toast.error(`Could not load purchase request: ${existingRequestError.message}`);

      return;

    }



    const { data: updatedRequest, error } = await (supabase

      .from("purchase_requests") as any)

      .update({ status })

      .eq("id", requestId)

      .select("status, listing_id, quantity_kg")

      .single();



    if (error) {

      toast.error(`Could not update purchase request: ${error.message}`);

      return;

    }



    setIncomingPurchaseRequests((prev) =>

      prev.map((request) =>

        request.id === requestId ? { ...request, status } : request

      )

    );



    if ((status === "accepted" || status === "completed") && updatedRequest) {
      const shouldDeduct = !(["accepted", "completed"].includes(existingRequest?.status ?? ""));

      if (shouldDeduct) {
        const listing = listings.find((item) => item.id === updatedRequest.listing_id) ?? userListings.find((item) => item.id === updatedRequest.listing_id);

        if (listing) {
          const requestedQty = Math.max(1, Number(updatedRequest?.quantity_kg ?? existingRequest?.quantity_kg ?? 1) || 1);
          const currentKg = Number(listing.kg ?? 0);
          const nextKg = Math.max(0, currentKg - requestedQty);

          const { error: stockError } = await (supabase
            .from("marketplace_listings") as any)
            .update({ kg: nextKg, updated_at: new Date().toISOString() })
            .eq("id", listing.id);

          if (stockError) {
            toast.error(`Could not update stock: ${stockError.message}`);
            return;
          }

          setListings((prev) => prev.map((item) => item.id === listing.id ? { ...item, kg: nextKg } : item));
          setUserListings((prev) => prev.map((item) => item.id === listing.id ? { ...item, kg: nextKg } : item));
          setSelectedListing((prev) => prev?.id === listing.id ? { ...prev, kg: nextKg } : prev);

          // If this is a waste listing and status is completed, add to food waste reports
          if (listing.kind === "waste" && status === "completed") {
            const { error: wasteError } = await supabase.from("food_waste_reports").insert({
              restaurant_id: listing.user_id,
              quantity_kg: requestedQty,
              status: "collected",
              listing_id: listing.id,
              buyer_user_id: updatedRequest.buyer_user_id,
            } as any);

            if (wasteError) {
              console.error("Could not create food waste report:", wasteError);
            }
          }
        }
      }
    }

    toast.success(`Purchase request ${status}.`);

  };



  const getListingById = (id: string) => userListings.find(l => l.id === id);



  const handleMessageClick = (listing: Listing) => {

    if (!user || user.id === listing.user_id) return;
    if (!profile?.lgu_approved) {
      toast.error("Your account must be verified by the LGU before you can send messages. Please upload your government ID in your profile.");
      return;
    }

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

    setEditLocationName(listing.location_name || "");

    setEditLocationAddress(listing.location_address || "");

    setEditLatitude(listing.latitude ?? null);

    setEditLongitude(listing.longitude ?? null);

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

        location_name: editLocationName.trim() || null,

        location_address: editLocationAddress.trim() || null,

        latitude: editLatitude,

        longitude: editLongitude,

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

              location_name: editLocationName.trim() || null,

              location_address: editLocationAddress.trim() || null,

              latitude: editLatitude,

              longitude: editLongitude,

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

              location_name: editLocationName.trim() || null,

              location_address: editLocationAddress.trim() || null,

              latitude: editLatitude,

              longitude: editLongitude,

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

          .filter((l) => filterUserRole === "all" || l.role === filterUserRole)

          .filter((l) => !filterCategory || l.category?.toLowerCase().includes(filterCategory.toLowerCase()))

          .filter((l) => !filterBarangay || l.barangay?.toLowerCase().includes(filterBarangay.toLowerCase())),

    [listings, q, filterUserRole, filterCategory, filterBarangay, profile?.primary_role, user?.id],

  );



  const heroSub = profile?.primary_role === "farmer"

    ? "See the fresh produce you posted."

    : profile?.primary_role === "lgu_admin"

      ? "Buy restaurant food waste."

      : "Buy fresh produce from local farmers. Or list food waste so it gets composted instead of landfilled.";



  const getGreeting = () => {
    const role = profile?.primary_role;
    const municipality = profile?.municipality || "your area";
    const name = profile?.full_name || "there";
    
    if (role === "lgu_admin") {
      return `Welcome back, ${municipality} LGU 👋`;
    } else if (role === "farmer") {
      return `Welcome back, ${name} 👋`;
    } else if (role === "restaurant") {
      return `Welcome back, ${name} 👋`;
    } else if (role === "resident") {
      return `Welcome back, ${name} 👋`;
    }
    return `Welcome back, ${name} 👋`;
  };

  const getDescription = () => {
    const role = profile?.primary_role;
    const municipality = profile?.municipality || "your municipality";
    
    if (role === "lgu_admin") {
      return `Monitor marketplace activity and discover sustainable opportunities across ${municipality}.`;
    } else if (role === "farmer") {
      return `Manage your produce listings and connect with buyers across ${municipality}.`;
    } else if (role === "restaurant") {
      return `List food waste for collection and source fresh produce across ${municipality}.`;
    } else if (role === "resident") {
      return `Browse fresh produce and sustainable opportunities across ${municipality}.`;
    }
    return `Monitor your marketplace activity and discover sustainable opportunities across ${municipality}.`;
  };

  const getQuickActions = () => {
    const role = profile?.primary_role;
    
    if (role === "lgu_admin") {
      return [
        { label: "Members Dashboard", to: "/dashboard" },
        { label: "Reports", to: "/reports" },
      ];
    } else if (role === "farmer") {
      return [
        { label: "New Listing", action: () => { setKind("produce"); setShowForm(true); } },
        { label: "Manage Listings", to: "/listings" },
      ];
    } else if (role === "restaurant") {
      return [
        { label: "New Listing", action: () => { setKind("waste"); setShowForm(true); } },
        { label: "Manage Listings", to: "/listings" },
      ];
    } else if (role === "resident") {
      return [
        { label: "Browse Listings", to: "#listings" },
        { label: "View Transactions", to: "/trades" },
      ];
    }
    return [];
  };

  const formatRefreshTime = () => {
    const now = new Date();
    const diff = now.getTime() - lastRefresh.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return "Updated just now";
    if (seconds < 3600) return `Updated ${Math.floor(seconds / 60)} min ago`;
    return `Updated ${Math.floor(seconds / 3600)} hours ago`;
  };

  return (
    <>
      <PremiumHero
        title="Marketplace"
        sub="Find fresh produce, food waste, and compost from verified sellers across Siargao."
        action={
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                placeholder="Search products, sellers, or municipalities..." 
                className="h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 bg-white shadow-md hover:shadow-lg transition-all duration-200"
              />
            </div>
            {user && profile?.primary_role !== "resident" && profile?.lgu_approved && (
              <Button 
                size="lg" 
                className="h-14 rounded-2xl bg-gradient-to-r from-primary to-emerald-600 text-white hover:from-primary/90 hover:to-emerald-600/90 px-8 shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => {
                  setShowForm((value) => !value);
                  if (profile?.primary_role === "lgu_admin") {
                    setKind("compost");
                  } else if (profile?.primary_role === "restaurant") {
                    setKind("waste");
                  } else {
                    setKind("produce");
                  }
                }}
              >
                <Plus className="mr-2 h-5 w-5" /> New Listing
              </Button>
            )}
          </div>
        }
      />

      <Container className="py-8">

        {user && profile && !profile.lgu_approved && (
          <div className="mb-6 rounded-3xl border-2 border-amber-400 bg-amber-50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-400 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-800" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-900">Account Verification Required</p>
                <p className="text-sm text-amber-700">Upload your government ID in your <Link to="/profile" search={{ userId: undefined }} className="underline font-medium">profile</Link> to get verified by the LGU. Verification is required to create listings, buy, and send messages.</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <Button size="sm" variant="outline" className="rounded-full border-primary/40 text-primary hover:bg-primary/10" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-1 h-4 w-4" /> Filters
          </Button>
        </div>



        {showFilters && (

          <Card className="mb-6 p-4 border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10 shadow-sm shadow-primary/10">

            <div className="grid gap-4 sm:grid-cols-3">

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

            You're browsing as a guest. <Link to="/auth" className="text-primary underline hover:text-primary/80 font-medium">Sign in</Link> to message vendors and post your own listings.

          </Card>

        )}



        {showForm && user && profile?.primary_role !== "resident" && (

          <Card className="mb-6 p-4 border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10 shadow-sm shadow-primary/10">

            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

              <div>

                <h2 className="font-display text-lg font-semibold text-primary">Create a new listing</h2>

                <p className="text-xs text-slate-600/70">

                  {profile?.primary_role === "farmer"

                    ? "Farmers can publish fresh produce only."

                    : profile?.primary_role === "lgu_admin"

                      ? "LGU staff cannot create listings."

                      : profile?.primary_role === "restaurant"

                        ? "Hotels/Restaurants can post waste listings only."

                        : "Farmers can publish fresh produce or waste available for barter or pickup."}

                </p>

              </div>

              <Button variant="outline" size="sm" className="border-primary/40 text-primary hover:bg-primary/10" onClick={() => setShowForm(false)}>Cancel</Button>

            </div>

            <div className="grid grid-cols-2 gap-2">

              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Listing title" className="border-primary/30 focus:border-primary focus:ring-primary/50 h-8 text-xs" />

              <Input type="number" value={kg || ""} onChange={(e) => setKg(Number(e.target.value) || 0)} placeholder="Quantity (kg)" className="border-primary/30 focus:border-primary focus:ring-primary/50 h-8 text-xs" />

              <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder={kind === "waste" ? "" : "Price"} className="border-primary/30 focus:border-primary focus:ring-primary/50 h-8 text-xs" />

              <Input value={availableAt} onChange={(e) => setAvailableAt(e.target.value)} placeholder="Available date" className="border-primary/30 focus:border-primary focus:ring-primary/50 h-8 text-xs" />

              <div className="col-span-2 flex flex-wrap gap-2">
                {profile?.primary_role === "restaurant" ? (
                  <Button type="button" className={kind === "waste" ? "bg-primary text-white hover:bg-primary/90" : "text-primary border border-primary/30 hover:bg-primary/10"} onClick={() => setKind("waste")}>♻️ Waste</Button>
                ) : profile?.primary_role === "lgu_admin" ? (
                  <Button type="button" className={kind === "compost" ? "bg-primary text-white hover:bg-primary/90" : "text-primary border border-primary/30 hover:bg-primary/10"} onClick={() => setKind("compost")}>🌱 Compost</Button>
                ) : (
                  <Button type="button" className={kind === "produce" ? "bg-primary text-white hover:bg-primary/90" : "text-primary border border-primary/30 hover:bg-primary/10"} onClick={() => setKind("produce")}>🌾 Produce</Button>
                )}
              </div>

              <div className="col-span-2">
                <Label className="mb-1 block text-[10px] font-medium text-primary">Category</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={kind === "produce" ? "e.g., Tomatoes" : "e.g., Food Waste"} className="border-primary/30 focus:border-primary focus:ring-primary/50 h-8 text-xs" />
              </div>

            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] font-medium text-primary">Add photos</label>
                <div className="relative border-2 border-dashed border-primary/40 rounded-lg p-3 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const newFiles = Array.from(e.target.files || []);
                      setFiles([...files, ...newFiles]);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary/60 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-[10px] text-primary/60">Click to upload</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2">
                      <p className="text-[10px] text-primary/70 font-medium">{files.length} image{files.length !== 1 ? 's' : ''} selected</p>
                      <p className="text-[9px] text-primary/50">Click to add more</p>
                    </div>
                  )}
                </div>
                {files.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`preview ${index + 1}`}
                          className="h-16 w-full object-cover rounded-md border-2 border-primary/30"
                        />
                        <button
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-medium text-slate-700 mb-1">Location</label>
                  <Input
                    value={listingLocationName}
                    onChange={(e) => setListingLocationName(e.target.value)}
                    placeholder="e.g., Cloud 9"
                    className="border-primary/30 focus:border-primary focus:ring-primary/50 h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-700 mb-1">Address</label>
                  <Input
                    value={listingLocationAddress}
                    onChange={(e) => setListingLocationAddress(e.target.value)}
                    placeholder="Optional"
                    className="border-primary/30 focus:border-primary focus:ring-primary/50 h-8 text-xs"
                  />
                </div>
                <Button 
                  variant={selectedLocation ? "secondary" : "outline"} 
                  onClick={() => setShowLocationPicker(true)}
                  className="w-full flex items-center gap-2 h-7 text-xs"
                >
                  <MapPin className="h-3 w-3" />
                  {selectedLocation ? "Location Updated from Map" : "Or pick from map"}
                </Button>
                {selectedLocation && (
                  <p className="text-[10px] text-muted-foreground">{selectedLocation.locationName}</p>
                )}
              </div>
            </div>

            {showLocationPicker && (
              <div className="mt-2">
                <LocationPicker 
                  onLocationSelect={(location) => {
                    setListingLocationName(location.locationName);
                    setListingLocationAddress(location.locationAddress);
                    setSelectedLocation(location);
                    setShowLocationPicker(false);
                  }}
                  initialLocation={selectedLocation ? { latitude: selectedLocation.latitude, longitude: selectedLocation.longitude } : undefined}
                />
              </div>
            )}

            <div className="mt-2">
              <Button onClick={createListing} disabled={uploading} className="rounded-full bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 h-8 text-xs">
                {uploading ? "Uploading..." : "Publish listing"}
              </Button>
            </div>

          </Card>

        )}



        <Tabs defaultValue={profile?.primary_role === "restaurant" ? "produce" : profile?.primary_role === "lgu_admin" ? "compost" : "produce"} className="mt-8">

          <TabsList className={`grid w-full ${profile?.primary_role === "lgu_admin" ? "grid-cols-3" : profile?.primary_role === "farmer" || profile?.primary_role === "restaurant" ? "grid-cols-2" : "grid-cols-1"} bg-sand/50 border-2 border-primary/30 rounded-lg p-1`}>

            <TabsTrigger value="produce" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white text-slate-700">

              🌾 Fresh Produce

            </TabsTrigger>

            {(profile?.primary_role === "restaurant" || profile?.primary_role === "lgu_admin") && (
              <TabsTrigger value="waste" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-primary data-[state=active]:text-white text-slate-700">

                🍽️ Food Waste

              </TabsTrigger>
            )}

            {(profile?.primary_role === "farmer" || profile?.primary_role === "lgu_admin") && (
              <TabsTrigger value="compost" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-primary data-[state=active]:text-white text-slate-700">

                🧪 Compost

              </TabsTrigger>
            )}

          </TabsList>

          <TabsContent value="produce" className="mt-6">

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {filtered("produce").map((l) => (

                <ListingCard

                  key={l.id}

                  item={l}

                  onViewDetails={() => {

                    setSelectedListing(l);

                    setShowDetailModal(true);

                  }}

                  onBuy={canBuyListing(l, profile?.primary_role, profile?.lgu_approved || false) ? () => {

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

          <TabsContent value="waste" className="mt-6">

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {filtered("waste", profile?.primary_role === "lgu_admin" ? "all" : "restaurant").map((l) => (

                <ListingCard

                  key={l.id}

                  item={l}

                  onViewDetails={() => {

                    setSelectedListing(l);

                    setShowDetailModal(true);

                  }}

                  onBuy={canBuyListing(l, profile?.primary_role, profile?.lgu_approved || false) ? () => {

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

          {(profile?.primary_role === "lgu_admin" || profile?.primary_role === "farmer") && (

            <TabsContent value="compost" className="mt-6">

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                {filtered("compost", profile?.primary_role === "lgu_admin" ? "lgu_admin" : "all").map((l) => (

                  <ListingCard

                    key={l.id}

                    item={l}

                    onViewDetails={() => {

                      setSelectedListing(l);

                      setShowDetailModal(true);

                    }}

                    onBuy={canBuyListing(l, profile?.primary_role, profile?.lgu_approved || false) ? () => {

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



      <BuyRequestModal

        open={showBuyModal}

        onOpenChange={setShowBuyModal}

        listing={selectedListing}

        user={user ? { id: user.id, full_name: profile?.full_name || "", primary_role: (profile?.primary_role === "super_admin" ? "lgu_admin" : profile?.primary_role) || "resident" } : null}

        onSuccess={() => {

          toast.success("Purchase request sent successfully!");

        }}

      />



      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>

        <DialogContent className="max-w-6xl w-full overflow-hidden p-0">

          {selectedListing ? (

            <div className="grid gap-6 bg-background sm:grid-cols-[1.5fr_1fr]">

              <div className="relative overflow-hidden bg-slate-950">

                {selectedListing.images && selectedListing.images.length > 0 ? (

                  <>

                    <img

                      src={selectedListing.images[currentImageIndex]}

                      alt={selectedListing.title}

                      className="h-full w-full object-cover"

                    />

                    {selectedListing.images.length > 1 && (

                      <>

                        <button

                          onClick={() => setCurrentImageIndex((prev) => (prev - 1 + selectedListing.images!.length) % selectedListing.images!.length)}

                          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"

                        >

                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />

                          </svg>

                        </button>

                        <button

                          onClick={() => setCurrentImageIndex((prev) => (prev + 1) % selectedListing.images!.length)}

                          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"

                        >

                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />

                          </svg>

                        </button>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">

                          {selectedListing.images.map((_, index) => (

                            <button

                              key={index}

                              onClick={() => setCurrentImageIndex(index)}

                              className={`h-2 rounded-full transition-all ${index === currentImageIndex ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/75"}`}

                            />

                          ))}

                        </div>

                      </>

                    )}

                  </>

                ) : selectedListing.image ? (

                  <img

                    src={selectedListing.image}

                    alt={selectedListing.title}

                    className="h-full w-full object-cover"

                  />

                ) : (

                  <div className="flex h-full items-center justify-center bg-slate-900 text-slate-200 text-sm">

                    No image available

                  </div>

                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 to-transparent p-6">

                  <p className="text-sm uppercase tracking-[0.2em] text-slate-200/70">{selectedListing.kind === "produce" ? "Produce" : "Waste"}</p>

                  <h2 className="mt-2 text-3xl font-semibold text-white">{selectedListing.title}</h2>

                  <p className="mt-2 text-lg font-semibold text-primary">{selectedListing.price ? `₱${selectedListing.price}` : "Free / Barter"}</p>

                </div>

              </div>

              <div className="flex flex-col gap-6 p-6">

                <DialogHeader>

                  <DialogTitle>{selectedListing.title}</DialogTitle>

                  <DialogDescription>

                    {selectedListing.barangay} • {selectedListing.available_at} • {selectedListing.kg} kg

                  </DialogDescription>

                </DialogHeader>



                <div className="space-y-4">

                  <div className="rounded-3xl border border-slate-200/60 bg-white/80 p-4 shadow-sm">

                    <div className="flex items-center justify-between gap-4">

                      <div>

                        <p className="text-sm font-medium text-slate-900">Seller</p>

                        <p className="text-base font-semibold text-slate-800">{selectedListing.seller}</p>

                        <p className="text-sm text-slate-600">{selectedListing.role.replace("hotel_restaurant", "Restaurant").replace("lgu_admin", "LGU")}</p>

                      </div>

                      <div className="text-right">

                        <p className="text-sm text-slate-500">Transaction</p>

                        <p className="font-semibold text-slate-800">{selectedListing.transaction_type.replace("sell_only", "Sell only").replace("barter_only", "Barter only").replace("sell_and_barter", "Sell & barter")}</p>

                      </div>

                    </div>

                  </div>



                  <div className="space-y-2">

                    <p className="text-sm font-medium text-slate-900">Description</p>

                    <p className="text-sm leading-relaxed text-slate-700">

                      {selectedListing.category ? `${selectedListing.category.charAt(0).toUpperCase() + selectedListing.category.slice(1)} available in ${selectedListing.barangay}.` : "A marketplace listing from the community."}

                    </p>

                    {selectedListing.acceptable_exchanges && selectedListing.acceptable_exchanges.length > 0 && (

                      <div className="flex flex-wrap gap-2 pt-2">

                        {selectedListing.acceptable_exchanges.map((exchange, index) => (

                          <span key={index} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">{exchange}</span>

                        ))}

                      </div>

                    )}

                  </div>



                  {selectedListing.images && selectedListing.images.length > 1 && (

                    <div className="space-y-3">

                      <p className="text-sm font-medium text-slate-900">All photos</p>

                      <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">

                        {selectedListing.images.map((photo, index) => (

                          <button

                            key={index}

                            onClick={() => setCurrentImageIndex(index)}

                            className={`relative rounded-xl overflow-hidden border-2 transition-all hover:border-primary ${

                              index === currentImageIndex ? "border-primary ring-2 ring-primary" : "border-slate-200/60 hover:border-primary/60"

                            }`}

                          >

                            <img

                              src={photo}

                              alt={`${selectedListing.title} ${index + 1}`}

                              className="h-24 w-full object-cover"

                            />

                            {index === currentImageIndex && (

                              <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">

                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">

                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />

                                </svg>

                              </div>

                            )}

                          </button>

                        ))}

                      </div>

                    </div>

                  )}

                </div>



                <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div className="space-y-1 text-sm text-slate-600">

                    <p>{selectedListing.location_name || "Location not provided"}</p>

                    {selectedListing.location_address && <p>{selectedListing.location_address}</p>}

                  </div>

                  <div className="flex flex-wrap gap-3">

                    {canBuyListing(selectedListing, profile?.primary_role, profile?.lgu_approved || false) && (

                      <Button onClick={() => {

                        setShowDetailModal(false);

                        setSelectedListing(selectedListing);

                        setShowBuyModal(true);

                      }} className="rounded-full bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90">

                        Contact / Buy

                      </Button>

                    )}

                    <Button variant="outline" onClick={() => setShowDetailModal(false)} className="rounded-full border-slate-300 text-slate-700 hover:bg-slate-100">

                      Close

                    </Button>

                  </div>

                </div>

              </div>

            </div>

          ) : null}

        </DialogContent>

      </Dialog>



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

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>

                <Input

                  value={editLocationName}

                  onChange={(e) => setEditLocationName(e.target.value)}

                  placeholder="e.g., Cloud 9, General Luna"

                  className="border-primary/30 focus:border-primary focus:ring-primary/50"

                />

              </div>

              <div>

                <label className="block text-sm font-medium text-slate-700 mb-1">Address (Optional)</label>

                <Input

                  value={editLocationAddress}

                  onChange={(e) => setEditLocationAddress(e.target.value)}

                  placeholder="e.g., Near the main beach"

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

