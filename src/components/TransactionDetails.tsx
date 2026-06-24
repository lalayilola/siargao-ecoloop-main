import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Calendar, MapPin, User, Star, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface TransactionDetailsProps {
  transaction: {
    id: string;
    type: 'trade' | 'purchase';
    status: string;
    created_at: string;
    item_name: string;
    item_image?: string;
    item_category?: string;
    quantity?: number;
    location?: string;
    buyer_name?: string;
    seller_name?: string;
    from_name?: string;
    from_user_id?: string;
    to_user_id?: string | null | undefined;
    notes?: string;
  };
  open: boolean;
  onClose: () => void;
}

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
  approved: "bg-blue-100 text-blue-700 border-blue-300",
  in_progress: "bg-purple-100 text-purple-700 border-purple-300",
  completed: "bg-green-100 text-green-700 border-green-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
  rejected: "bg-red-100 text-red-700 border-red-300",
  accepted: "bg-green-100 text-green-700 border-green-300",
  unknown: "bg-gray-100 text-gray-700 border-gray-300",
};

export function TransactionDetails({ transaction, open, onClose }: TransactionDetailsProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [hasRated, setHasRated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);

  // Validate transaction data
  if (!transaction || !transaction.id) {
    console.error("Invalid transaction data:", transaction);
    return null;
  }

  // Ensure required fields have safe defaults
  const safeTransaction = {
    ...transaction,
    item_name: transaction.item_name || 'Unknown Item',
    status: transaction.status || 'unknown',
    created_at: transaction.created_at || new Date().toISOString(),
    type: transaction.type || 'purchase',
  };

  useEffect(() => {
    // Check if user has already rated this transaction
    const checkExistingRating = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("transaction_ratings" as any)
          .select("*")
          .eq("transaction_id", safeTransaction.id)
          .eq("rater_id", user.id)
          .single() as any;

        if (data && !error) {
          setHasRated(true);
          setRating((data as any).rating);
          setReview((data as any).review || "");
        }
      } catch (error) {
        // If the table doesn't exist or there's an error, just ignore it
        console.log("Rating check failed (table may not exist yet):", error);
      }
    };

    if (open) {
      checkExistingRating();
    }
  }, [open, safeTransaction.id, user]);

  const handleRatingSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to rate transactions");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("transaction_ratings" as any)
        .insert({
          transaction_id: safeTransaction.id,
          transaction_type: safeTransaction.type,
          rater_id: user.id,
          rated_user_id: safeTransaction.to_user_id || safeTransaction.from_user_id,
          rating: rating,
          review: review || null,
        } as any);

      if (error) throw error;

      setHasRated(true);
      toast.success("Rating submitted successfully");
    } catch (error: any) {
      console.error("Rating submission error:", error);
      toast.error(`Failed to submit rating: ${error.message || "Table may not exist yet"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!user) {
      toast.error("You must be logged in to mark transactions as complete");
      return;
    }

    setMarkingComplete(true);
    try {
      const tableName = safeTransaction.type === 'trade' ? 'trades' : 'purchase_requests';
      console.log(`Updating ${tableName} with id ${safeTransaction.id} to status 'completed'`);
      
      // Use REST API for both types to bypass schema cache
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
      
      // For trades, try using a different approach - check if column exists first
      if (safeTransaction.type === 'trade') {
        // Try to get the trade data first to see what columns exist
        const checkResponse = await fetch(`${supabaseUrl}/rest/v1/trades?id=eq.${safeTransaction.id}&select=*`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': supabaseKey,
          },
        });
        
        if (checkResponse.ok) {
          const tradeData = await checkResponse.json();
          console.log("Trade data columns:", tradeData[0] ? Object.keys(tradeData[0]) : 'No data');
        }
      }
      
      const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?id=eq.${safeTransaction.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': supabaseKey,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("REST API error:", errorText);
        throw new Error(errorText || 'Failed to update');
      }

      toast.success("Transaction marked as completed");
      onClose();
      // Refresh the page to show updated status
      window.location.reload();
    } catch (error: any) {
      console.error("Mark complete error:", error);
      toast.error(`Failed to mark as complete: ${error.message || "Unknown error"}`);
    } finally {
      setMarkingComplete(false);
    }
  };

  const canRate = (safeTransaction.status === "completed" || safeTransaction.status === "rejected" || safeTransaction.status === "accepted") && !hasRated;
  const canMarkComplete = safeTransaction.status !== "completed" && safeTransaction.status !== "cancelled" && safeTransaction.status !== "rejected";

  // Debug logging
  console.log("TransactionDetails debug:", {
    status: safeTransaction.status,
    canRate,
    hasRated,
    canMarkComplete,
    user: user?.id,
    transactionId: safeTransaction.id,
  });

  try {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">Transaction Details</DialogTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Transaction Header */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={statusColor[safeTransaction.status]}>
              {safeTransaction.status}
            </Badge>
            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">
              {safeTransaction.type === 'trade' ? 'Trade' : 'Purchase'}
            </Badge>
          </div>

          {/* Item Information */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Item Information
            </h3>
            <div className="grid gap-4">
              {safeTransaction.item_image && (
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-100">
                  <img 
                    src={safeTransaction.item_image} 
                    alt={safeTransaction.item_name} 
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Item Name</label>
                <p className="font-semibold text-lg">{safeTransaction.item_name}</p>
              </div>
              {safeTransaction.item_category && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p>{safeTransaction.item_category}</p>
                </div>
              )}
              {safeTransaction.quantity && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                  <p>{safeTransaction.quantity} kg</p>
                </div>
              )}
              {safeTransaction.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{safeTransaction.location}</span>
                </div>
              )}
            </div>
          </Card>

          {/* User Information */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              User Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {safeTransaction.type === 'trade' ? 'Trade Partner' : 'Seller'}
                </label>
                <p className="font-semibold">{safeTransaction.seller_name || safeTransaction.from_name}</p>
              </div>
              {safeTransaction.buyer_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Buyer</label>
                  <p className="font-semibold">{safeTransaction.buyer_name}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Transaction Information */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Transaction Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                <p className="font-mono text-sm">{safeTransaction.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                <p>{new Date(safeTransaction.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="capitalize">{safeTransaction.status.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Transaction Type</label>
                <p className="capitalize">{safeTransaction.type}</p>
              </div>
              {safeTransaction.notes && (
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm">{safeTransaction.notes}</p>
                </div>
              )}
            </div>
            {canMarkComplete && (
              <div className="mt-4 pt-4 border-t">
                <Button 
                  onClick={handleMarkComplete}
                  disabled={markingComplete}
                  className="w-full"
                >
                  {markingComplete ? "Marking as complete..." : "Mark as Completed"}
                </Button>
              </div>
            )}
          </Card>

          {/* Rating Section */}
          {canRate && (
            <Card className="p-6">
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Rate This Transaction
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Rate your experience with this transaction. You can only rate completed, accepted, or rejected transactions once.
              </p>
              <div className="space-y-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Leave a review (optional)"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <Button onClick={handleRatingSubmit} className="w-full" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Rating"}
                </Button>
              </div>
            </Card>
          )}

          {hasRated && (
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <Star className="h-5 w-5 fill-green-500" />
                <span className="font-medium">You have rated this transaction</span>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
    );
  } catch (error) {
    console.error("TransactionDetails render error:", error);
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Error Loading Transaction Details</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              There was an error loading the transaction details. Please try again.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
}
