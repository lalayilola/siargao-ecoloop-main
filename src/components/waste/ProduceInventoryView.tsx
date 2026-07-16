import { useEffect, useState } from "react";
import { Container, PageHero } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Sprout,
  Package
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export function ProduceInventoryView() {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "reserved" | "sold">("all");
  const [filterKind, setFilterKind] = useState<"all" | "produce" | "waste">("all");

  useEffect(() => {
    if (!user) return;

    const loadListings = async () => {
      const { data, error } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(`Unable to load listings: ${error.message}`);
      } else {
        setListings(data || []);
      }
    };

    void loadListings();
  }, [user]);

  const handleDelete = async (listingId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    const { error } = await supabase
      .from("marketplace_listings")
      .delete()
      .eq("id", listingId);

    if (error) {
      toast.error(`Failed to delete listing: ${error.message}`);
      return;
    }

    setListings(prev => prev.filter(l => l.id !== listingId));
    toast.success("Listing deleted");
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || listing.status === filterStatus;
    const matchesKind = filterKind === "all" || listing.kind === filterKind;

    return matchesSearch && matchesStatus && matchesKind;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "reserved":
        return "bg-yellow-100 text-yellow-800";
      case "sold":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const totalQuantity = listings.reduce((sum, l) => sum + (l.kg || 0), 0);
  const availableQuantity = listings.filter(l => l.status === "available").reduce((sum, l) => sum + (l.kg || 0), 0);

  if (!profile || profile.primary_role !== "farmer") {
    return (
      <Container className="py-12">
        <Card className="p-8 text-center border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10">
          <Sprout className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-primary mb-2">Produce Inventory</h2>
          <p className="text-slate-600">This feature is only available for farmers.</p>
        </Card>
      </Container>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Inventory"
        title="Manage Your Produce Inventory"
        sub="Track, update, and manage your agricultural produce listings."
      />
      <Container className="py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{listings.length}</p>
                <p className="text-sm text-slate-600">Total Listings</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Sprout className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{availableQuantity} kg</p>
                <p className="text-sm text-slate-600">Available Quantity</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalQuantity} kg</p>
                <p className="text-sm text-slate-600">Total Quantity</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10 shadow-sm shadow-primary/10 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or category..."
                className="pl-9 border-primary/30 focus:border-primary focus:ring-primary/50"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-full md:w-40 border-primary/30 focus:border-primary focus:ring-primary/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterKind} onValueChange={(value: any) => setFilterKind(value)}>
              <SelectTrigger className="w-full md:w-40 border-primary/30 focus:border-primary focus:ring-primary/50">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="produce">Produce</SelectItem>
                <SelectItem value="waste">Waste</SelectItem>
              </SelectContent>
            </Select>
            <Link to="/marketplace">
              <Button className="w-full md:w-auto bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add New Listing
              </Button>
            </Link>
          </div>
        </Card>

        {/* Listings */}
        {filteredListings.length === 0 ? (
          <Card className="p-8 text-center border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10">
            <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No listings found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="p-6 border-2 border-primary/20 bg-gradient-to-br from-white to-secondary/10">
                <div className="flex flex-col md:flex-row gap-4">
                  {listing.image && (
                    <img
                      src={listing.image}
                      alt={listing.title}
                      className="w-full md:w-32 h-32 object-cover rounded-lg border border-primary/20"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{listing.title}</h3>
                        <p className="text-sm text-slate-600">{listing.category || "No category"}</p>
                      </div>
                      <Badge className={getStatusColor(listing.status)}>
                        {listing.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500">Quantity</p>
                        <p className="font-medium text-slate-900">{listing.kg} kg</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Price</p>
                        <p className="font-medium text-slate-900">{listing.price || "Free"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Type</p>
                        <p className="font-medium text-slate-900 capitalize">{listing.kind}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Location</p>
                        <p className="font-medium text-slate-900">{listing.barangay}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{listing.description}</p>
                    <div className="flex gap-2">
                      <Link to="/marketplace" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full border-primary/40 text-primary hover:bg-primary/10">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(listing.id)}
                        className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
