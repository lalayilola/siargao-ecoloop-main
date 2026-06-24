import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Listing = Database["public"]["Tables"]["marketplace_listings"]["Row"];

interface BuyRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: Listing | null;
  user: { id: string; full_name: string; primary_role: Database["public"]["Enums"]["app_role"] } | null;
  onSuccess?: () => void;
}

export function BuyRequestModal({ open, onOpenChange, listing, user, onSuccess }: BuyRequestModalProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing || !user) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("purchase_requests").insert({
        listing_id: listing.id,
        buyer_user_id: user.id,
        buyer_name: user.full_name,
        buyer_role: user.primary_role,
        message: message || "I'm interested in purchasing this item.",
        quantity_kg: 1,
        status: "pending",
      });

      if (error) throw error;

      // Create notification for listing owner
      await supabase.from("notifications").insert({
        user_id: listing.user_id,
        type: "purchase_request",
        title: "New Purchase Request",
        message: `${user.full_name} wants to buy your listing: ${listing.title}`,
        link: `/marketplace`,
      });

      toast.success("Purchase request sent successfully!");
      setMessage("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(`Failed to send purchase request: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Buy Now</DialogTitle>
          <DialogDescription>
            Send a purchase request for {listing?.title}. The seller will review your request and respond.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {listing?.price && (
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-sm font-medium text-slate-700">Price:</p>
                <p className="text-lg font-semibold text-primary">{listing.price}</p>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a message to the seller..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div className="bg-sand/50 p-3 rounded-lg">
              <p className="text-sm text-slate-600">
                The seller will receive your request and can approve or reject it. Once approved, you'll be able to coordinate the transaction details.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Purchase Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
