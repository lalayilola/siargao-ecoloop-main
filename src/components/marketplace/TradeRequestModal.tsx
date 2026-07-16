import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Database } from "@/integrations/supabase/types";

type Listing = Database["public"]["Tables"]["marketplace_listings"]["Row"];

interface TradeRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: Listing | null;
  userListings: Listing[];
  user: { id: string; full_name: string; primary_role: Database["public"]["Enums"]["role"] } | null;
  onSuccess?: () => void;
}

export function TradeRequestModal({ open, onOpenChange, listing, userListings, user, onSuccess }: TradeRequestModalProps) {
  const { profile } = useAuth();
  const [offeredItemId, setOfferedItemId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setQuantity(Math.max(1, Math.min(listing?.kg ?? 1, 1)));
    }
  }, [open, listing?.kg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing || !user) return;

    // Check if user is verified
    if (!profile?.lgu_approved) {
      toast.error("Your account must be verified by the LGU before you can send trade requests. Please upload your government ID and wait for verification.");
      return;
    }

    setIsSubmitting(true);

    try {
      const offeredItem = userListings.find(l => l.id === offeredItemId);
      
      const { error } = await supabase.from("trade_requests").insert({
        listing_id: listing.id,
        requester_user_id: user.id,
        requester_name: user.full_name,
        requester_role: user.primary_role,
        offered_item_id: offeredItemId || null,
        offered_item_title: offeredItem?.title || null,
        message: message || "I'm interested in trading for this item.",
        quantity_kg: quantity,
        status: "pending",
      } as any);

      if (error) throw error;

      // Create notification for listing owner
      await supabase.from("notifications").insert({
        user_id: listing.user_id,
        type: "trade_request",
        title: "New Trade Request",
        message: `${user.full_name} wants to trade for your listing: ${listing.title}`,
        link: `/requests`,
      } as any);

      toast.success("Trade request sent successfully!");
      setMessage("");
      setOfferedItemId("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(`Failed to send trade request: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Trade</DialogTitle>
          <DialogDescription>
            Send a trade request for {listing?.title}. The seller will review your offer and respond.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity (kg)</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={listing?.kg ?? 1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              />
              <p className="text-xs text-slate-500">Available: {listing?.kg ?? 0} kg</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="offered-item">Your Offered Item (Optional)</Label>
              <Select value={offeredItemId} onValueChange={setOfferedItemId}>
                <SelectTrigger id="offered-item">
                  <SelectValue placeholder="Select an item to offer" />
                </SelectTrigger>
                <SelectContent>
                  {userListings.length > 0 ? (
                    userListings.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title} ({item.kg}kg)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>No listings available</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">Select one of your listings to offer in exchange</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Describe what you'd like to trade or any additional details..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
            {listing?.acceptable_exchanges && listing.acceptable_exchanges.length > 0 && (
              <div className="bg-sand/50 p-3 rounded-lg">
                <p className="text-sm font-medium text-slate-700 mb-2">Seller accepts:</p>
                <div className="flex flex-wrap gap-1">
                  {listing.acceptable_exchanges.map((exchange, idx) => (
                    <span key={idx} className="text-xs bg-white px-2 py-1 rounded-full border border-primary/30">
                      {exchange}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Trade Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
