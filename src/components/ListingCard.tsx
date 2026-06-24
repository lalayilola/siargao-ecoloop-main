import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Scale, ShoppingCart, GitCompareArrows, MessageCircle, Edit3, Trash2 } from "lucide-react";
import { mediaSrc } from "./Media";
import type { MediaKey } from "./Media";
import { roleMeta } from "@/data/mock";
import type { Database } from "@/integrations/supabase/types";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LocationView } from "./LocationView";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";

type Listing = Database["public"]["Tables"]["marketplace_listings"]["Row"] & {
  profiles?: {
    profile_picture_url?: string;
    full_name?: string;
  };
};

export function ListingCard({
  item,
  onAction,
  onTrade,
  onBuy,
  onMessage,
  onEdit,
  onDelete,
}: {
  item: Listing;
  onAction?: () => void;
  onTrade?: () => void;
  onBuy?: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const { user } = useAuth();
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner = user?.id === item.user_id;
  const meta = roleMeta[item.role];
  let img: string | undefined;
  if (item.image) {
    if (typeof item.image === "string" && (item.image.startsWith("http") || item.image.startsWith("/"))) {
      img = item.image;
    } else {
      img = mediaSrc(item.image as MediaKey | undefined);
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "sell_only": return "Sell Only";
      case "barter_only": return "Barter Only";
      case "sell_and_barter": return "Sell & Barter";
      default: return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "sell_only": return "bg-blue-100 text-blue-700 border-blue-300";
      case "barter_only": return "bg-green-100 text-green-700 border-green-300";
      case "sell_and_barter": return "bg-purple-100 text-purple-700 border-purple-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const sellerInitials = item.seller
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <Card className="overflow-hidden p-0 border-2 border-primary/20 bg-white/95 hover:border-primary/60 hover:shadow-lg transition-all group">
      <img src={img} alt="" loading="lazy" className="h-44 w-full object-cover group-hover:scale-105 transition-transform duration-300" />
      <div className="space-y-3 p-5 bg-gradient-to-b from-white to-sand/10">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-slate-900">{item.title}</h3>
          <Badge variant="outline" className={`${meta.color} bg-secondary/15 text-primary border-primary/30`}>{meta.label}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full overflow-hidden bg-secondary/10 flex-shrink-0 shadow-md border-2 border-primary/40">
            {item.profiles?.profile_picture_url ? (
              <img src={item.profiles.profile_picture_url} alt={item.seller} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center font-semibold text-primary text-xs">
                {sellerInitials}
              </div>
            )}
          </div>
          <Link 
            to="/profile" 
            search={{ userId: item.user_id }}
            className="text-sm text-slate-600/80 font-medium hover:text-primary hover:underline"
          >
            {item.seller}
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline" className={getTransactionTypeColor(item.transaction_type)}>
            {getTransactionTypeLabel(item.transaction_type)}
          </Badge>
          {item.category && (
            <Badge variant="outline" className="bg-sand text-slate-700 border-primary/30">
              {item.category}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-3 pt-1 text-xs text-slate-600/70">
          <span className="inline-flex items-center gap-1 bg-sand px-2 py-1 rounded-full"><Scale className="h-3.5 w-3.5" />{item.kg} kg</span>
          <span className="inline-flex items-center gap-1 bg-sand px-2 py-1 rounded-full"><MapPin className="h-3.5 w-3.5" />{item.barangay}</span>
          <span className="inline-flex items-center gap-1 bg-sand px-2 py-1 rounded-full"><Calendar className="h-3.5 w-3.5" />{item.available_at}</span>
        </div>
        {(item as any).location_name && (
          <div className="pt-1 text-xs text-slate-600/70 flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => setShowLocationDialog(true)}>
            <MapPin className="h-3.5 w-3.5" />
            <span>{(item as any).location_name}</span>
          </div>
        )}
        {showLocationDialog && (item as any).latitude && (item as any).longitude && (
          <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
            <DialogContent className="max-w-2xl">
              <LocationView
                latitude={(item as any).latitude}
                longitude={(item as any).longitude}
                locationName={(item as any).location_name}
                locationAddress={(item as any).location_address}
                onClose={() => setShowLocationDialog(false)}
              />
            </DialogContent>
          </Dialog>
        )}
        {item.acceptable_exchanges && item.acceptable_exchanges.length > 0 && (
          <div className="pt-1">
            <p className="text-xs text-slate-600/70 mb-1">Accepts:</p>
            <div className="flex flex-wrap gap-1">
              {item.acceptable_exchanges.slice(0, 3).map((exchange, idx) => (
                <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                  {exchange}
                </Badge>
              ))}
              {item.acceptable_exchanges.length > 3 && (
                <Badge variant="outline" className="text-xs bg-sand text-slate-600 border-primary/30">
                  +{item.acceptable_exchanges.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between pt-2">
          <span className="font-display text-base font-semibold text-primary">
            {item.price ? `₱${item.price}` : "Free / Barter"}
          </span>
          {isOwner ? (
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-primary/40 text-primary hover:bg-primary/10"
                  onClick={onEdit}
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              )}
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full border-red-400 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. The listing will be removed from the marketplace.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={async () => {
                        setIsDeleting(true);
                        await onDelete();
                        setIsDeleting(false);
                      }}>
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              {onMessage && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-primary/40 text-primary hover:bg-primary/10"
                  onClick={onMessage}
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-1" /> Message
                </Button>
              )}
              {(item.transaction_type === "barter_only" || item.transaction_type === "sell_and_barter") && onTrade && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-green-500 text-green-700 hover:bg-green-50"
                  onClick={onTrade}
                >
                  <GitCompareArrows className="h-3.5 w-3.5 mr-1" /> Trade
                </Button>
              )}
              {(item.transaction_type === "sell_only" || item.transaction_type === "sell_and_barter") && onBuy && (
                <Button
                  size="sm"
                  className="rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/10 hover:from-primary/90 hover:to-secondary/90"
                  onClick={onBuy}
                >
                  <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Buy
                </Button>
              )}
              {onAction && !onTrade && !onBuy && (
                <Button
                  size="sm"
                  className="rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/10 hover:from-primary/90 hover:to-secondary/90"
                  onClick={onAction}
                >
                  {item.kind === "waste" ? "Request pickup" : "Reserve"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
