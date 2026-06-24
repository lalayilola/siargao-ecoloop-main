import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type CompostInventory = Database["public"]["Tables"]["compost_inventory"]["Row"];
type CompostRequestInsert = Database["public"]["Tables"]["compost_requests"]["Insert"];

export function CompostMarketplaceView() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [inventories, setInventories] = useState<CompostInventory[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<CompostInventory | null>(null);
  const [requestQuantity, setRequestQuantity] = useState(0);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    const loadInventory = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("compost_inventory")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading compost inventory:", error);
        toast.error("Unable to load compost inventory.");
        setInventories([]);
      } else {
        setInventories(data ?? []);
      }
      setIsLoading(false);
    };

    void loadInventory();
  }, []);

  const openRequestDialog = (inventory: CompostInventory) => {
    setSelectedInventory(inventory);
    setRequestQuantity(Math.min(inventory.quantity_kg, 10));
    setShowRequestDialog(true);
  };

  const handleRequestSubmit = async () => {
    if (!user || !profile || !selectedInventory) return;
    if (requestQuantity <= 0 || requestQuantity > selectedInventory.quantity_kg) {
      toast.error("Enter a valid request quantity.");
      return;
    }

    setIsRequesting(true);

    const payload: CompostRequestInsert = {
      farmer_id: user.id,
      farmer_name: profile.full_name,
      compost_inventory_id: selectedInventory.id,
      quantity_requested_kg: requestQuantity,
      status: "pending",
      request_date: new Date().toISOString().split("T")[0],
      collection_date: null,
      notes: null,
    };

    const { error } = await supabase.from("compost_requests").insert(payload);
    setIsRequesting(false);

    if (error) {
      console.error("Error requesting compost:", error);
      toast.error("Could not submit compost request.");
      return;
    }

    setShowRequestDialog(false);
    toast.success("Compost request submitted. LGU will confirm your pickup.");
  };

  if (!profile || profile.primary_role !== "farmer") {
    return (
      <>
        <PageHero
          eyebrow="Compost Marketplace"
          title="Request Compost & Fertilizer"
          sub="Browse available compost from LGU and submit requests for organic fertilizer."
        />
        <Container className="py-12">
          <Card className="p-8 border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10 shadow-sm shadow-primary/10 text-center">
            <Leaf className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-primary">Compost Marketplace</h2>
            <p className="text-slate-600 max-w-md mx-auto">This page is for farmers to request compost and organic fertilizer from LGU inventory.</p>
            <Button className="mt-6" onClick={() => navigate({ to: "/feed" })}>
              Back to EcoFeed
            </Button>
          </Card>
        </Container>
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Compost Marketplace"
        title="Request Compost & Fertilizer"
        sub="Browse available compost from LGU and submit requests for organic fertilizer."
      />
      <Container className="py-12">
        {isLoading ? (
          <Card className="p-8 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-slate-600">Loading available compost...</p>
          </Card>
        ) : inventories.length === 0 ? (
          <Card className="p-12 text-center border-2 border-primary/30 bg-gradient-to-br from-white to-secondary/10 shadow-sm shadow-primary/10">
            <Leaf className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-primary mb-2">No compost listings available</h2>
            <p className="text-slate-600 max-w-md mx-auto">LGU has not yet added compost inventory. Check back soon or contact your LGU team.</p>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {inventories.map((inventory) => (
              <Card key={inventory.id} className="p-6 border-2 border-primary/20 bg-white/95 hover:border-primary/40 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                        <Leaf className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{inventory.compost_type}</p>
                        <p className="text-sm text-slate-600">Available from {new Date(inventory.production_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3 text-sm text-slate-600">
                      <div className="rounded-2xl bg-slate-100 p-3">
                        <p className="font-semibold text-slate-900">{inventory.quantity_kg} kg</p>
                        <p>Available</p>
                      </div>
                      <div className="rounded-2xl bg-slate-100 p-3">
                        <p className="font-semibold text-slate-900">{inventory.status}</p>
                        <p>Status</p>
                      </div>
                      <div className="rounded-2xl bg-slate-100 p-3">
                        <p className="font-semibold text-slate-900">{inventory.expiry_date ? new Date(inventory.expiry_date).toLocaleDateString() : "N/A"}</p>
                        <p>Expiry</p>
                      </div>
                    </div>
                  </div>
                  <Button className="whitespace-nowrap" onClick={() => openRequestDialog(inventory)}>
                    <Plus className="h-4 w-4" /> Request Compost
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Request Compost</DialogTitle>
            <DialogDescription>
              Submit a compost request for {selectedInventory?.compost_type}. The LGU will confirm quantity and pickup details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Compost type</Label>
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{selectedInventory?.compost_type}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-quantity">Quantity requested (kg)</Label>
              <Input
                id="request-quantity"
                type="number"
                min={1}
                max={selectedInventory?.quantity_kg ?? 1}
                value={requestQuantity || ""}
                onChange={(event) => setRequestQuantity(Number(event.target.value) || 0)}
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Available quantity</p>
              <p>{selectedInventory?.quantity_kg ?? 0} kg</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestSubmit} disabled={isRequesting || requestQuantity <= 0}>
              {isRequesting ? "Sending request..." : "Submit Compost Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
