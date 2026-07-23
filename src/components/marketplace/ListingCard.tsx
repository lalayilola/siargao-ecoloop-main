import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Scale, ShoppingCart, GitCompareArrows, MessageCircle, Edit3, Trash2, Heart, Eye, Star, CheckCircle } from "lucide-react";
import { mediaSrc } from "@/components/common/Media";
import type { MediaKey } from "@/components/common/Media";
import { roleMeta } from "@/data/mock";
import type { Database } from "@/integrations/supabase/types";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LocationView } from "@/components/common/LocationView";
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
  onViewDetails,
}: {
  item: Listing;
  onAction?: () => void;
  onTrade?: () => void;
  onBuy?: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewDetails?: () => void;
}) {
  const { user } = useAuth();
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isOwner = user?.id === item.user_id;
  const meta = roleMeta[item.role as keyof typeof roleMeta] || { label: item.role, color: 'bg-gray-100 text-gray-700 border-gray-300' };
  
  // Get all images from the listing
  const allImages = (item as any).images && Array.isArray((item as any).images) && (item as any).images.length > 0 
    ? (item as any).images 
    : item.image 
      ? [item.image] 
      : [];
  
  // Process images to get proper URLs
  const processedImages = allImages.map((img: any) => {
    if (typeof img === "string" && (img.startsWith("http") || img.startsWith("/"))) {
      return img;
    } else {
      return mediaSrc(img as MediaKey | undefined);
    }
  }).filter(Boolean);
  
  const currentImage = processedImages[currentImageIndex] || processedImages[0];

  const getTransactionTypeLabel = (type: string) => {
    return "For Sale";
  };

  const getTransactionTypeColor = (type: string) => {
    return "bg-emerald-100 text-emerald-700 border-emerald-300";
  };

  const sellerInitials = item.seller
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <Card
      className={`overflow-hidden p-0 border border-gray-200 bg-white hover:border-emerald-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative ${onViewDetails ? "cursor-pointer" : ""}`}
      onClick={onViewDetails}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-56 w-full overflow-hidden rounded-t-lg">
        {currentImage ? (
          <img 
            src={currentImage} 
            alt="" 
            loading="lazy" 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
          />
        ) : (
          <div className="h-full w-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}
        
        {/* Quick actions overlay */}
        <div className={`absolute top-3 right-3 flex gap-2 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={(event) => {
              event.stopPropagation();
              setIsFavorited(!isFavorited);
            }}
            className="bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-all hover:scale-110"
          >
            <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onViewDetails?.();
            }}
            className="bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-all hover:scale-110"
          >
            <Eye className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {processedImages.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? processedImages.length - 1 : prev - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev === processedImages.length - 1 ? 0 : prev + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {currentImageIndex + 1} / {processedImages.length}
            </div>
          </>
        )}
      </div>
      <div className="space-y-3 p-4">
        {/* Product name and rating */}
        <div className="space-y-1">
          <h3 className="font-bold text-gray-900 line-clamp-2 text-lg">{item.title}</h3>
          <div className="flex items-center gap-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-3 w-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-xs text-gray-500">(12 reviews)</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-emerald-600">
            {item.kind === "waste" ? "Free" : (item.price ? `₱${item.price}` : "Free")}
          </span>
          {item.kind !== "waste" && item.price && (
            <span className="text-sm text-gray-500">/ kg</span>
          )}
        </div>

        {/* Seller municipality with location */}
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <MapPin className="h-4 w-4 text-emerald-600" />
          <span>{item.barangay}</span>
        </div>

        {/* Availability badge */}
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          Available: {item.kg} kg
        </Badge>

        {/* Seller name - clickable to view profile */}
        <Link
          to="/profile"
          search={{ userId: item.user_id }}
          className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Profile picture */}
          <div className="h-6 w-6 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 flex-shrink-0">
            {item.profiles?.profile_picture_url ? (
              <img src={item.profiles.profile_picture_url} alt={item.seller} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center font-semibold text-white text-xs">
                {sellerInitials}
              </div>
            )}
          </div>
          <CheckCircle className="h-3 w-3" />
          <span>{item.seller}</span>
        </Link>

        {/* View Details CTA */}
        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all hover:shadow-lg"
          onClick={(event) => {
            event.stopPropagation();
            onViewDetails?.();
          }}
        >
          View Details
        </Button>

        {/* Owner actions */}
        {isOwner && (
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-9"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit();
                }}
              >
                <Edit3 className="h-3 w-3 mr-1" /> Edit
              </Button>
            )}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-9 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
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
        )}

        {/* Buyer actions */}
        {!isOwner && (
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            {onMessage && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-9"
                onClick={(event) => {
                  event.stopPropagation();
                  onMessage();
                }}
              >
                <MessageCircle className="h-3 w-3 mr-1" /> Message
              </Button>
            )}
            {onBuy && (
              <Button
                size="sm"
                className="flex-1 h-9 bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={(event) => {
                  event.stopPropagation();
                  onBuy();
                }}
              >
                <ShoppingCart className="h-3 w-3 mr-1" /> {item.kind === "waste" ? "Collect" : "Buy"}
              </Button>
            )}
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
      </div>
    </Card>
  );
}
