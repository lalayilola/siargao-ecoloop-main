import { useState } from "react";
import { MapPin, Scale, Tag, Calendar, Edit3, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { mediaSrc, type MediaKey } from "./Media";
import { roleMeta } from "@/data/mock";
import type { Database } from "@/integrations/supabase/types";
import { FeedComments } from "./FeedComments";
import { FeedReactions } from "./FeedReactions";
import { LocationView } from "./LocationView";

type FeedPost = Database["public"]["Tables"]["feed_posts"]["Row"] & {
  profiles?: {
    avatar_url?: string;
  };
};

export function PostCard({ post, onDelete }: { post: FeedPost; onDelete?: (id: string) => void }) {
  const { user } = useAuth();
  const [body, setBody] = useState(post.body);
  const [editValue, setEditValue] = useState(post.body);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const meta = roleMeta[post.role];
  const isOwner = user?.id === post.user_id;

  console.log("PostCard post data:", post);
  console.log("PostCard profiles data:", post.profiles);

  let img: string | undefined;
  if (post.image) {
    // If image field is a URL (uploaded to storage), use it directly. Otherwise use local media map keys.
    if (typeof post.image === "string" && (post.image.startsWith("http") || post.image.startsWith("/"))) {
      img = post.image;
    } else {
      img = mediaSrc(post.image as MediaKey | undefined);
    }
  } else {
    img = undefined;
  }

  const initials = post.author
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  const handleSave = async () => {
    const updatedBody = editValue.trim();
    if (!updatedBody) {
      toast.error("Post body cannot be empty.");
      return;
    }

    const { data, error } = await supabase
      .from("feed_posts")
      .update({ body: updatedBody })
      .eq("id", post.id)
      .select()
      .single();

    if (error) {
      toast.error(`Could not update post: ${error.message}`);
      return;
    }

    setBody(data.body ?? updatedBody);
    setIsEditOpen(false);
    toast.success("Post updated.");
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const { error } = await supabase.from("feed_posts").delete().eq("id", post.id);
    setIsDeleting(false);

    if (error) {
      toast.error(`Could not delete post: ${error.message}`);
      return;
    }

    toast.success("Post deleted.");
    onDelete?.(post.id);
  };

  return (
    <Card className="overflow-hidden p-0 border-2 border-primary/20 bg-white/95 shadow-sm shadow-primary/10 transition-all hover:border-primary/60 hover:shadow-md">
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-secondary/10 to-transparent border-b border-primary/20">
        <div className="h-10 w-10 rounded-full overflow-hidden bg-secondary/10 flex-shrink-0 shadow-md border-2 border-primary/40">
          {post.profiles?.avatar_url ? (
            <img src={post.profiles.avatar_url} alt={post.author} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center font-semibold text-primary text-sm">
              {initials}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">{post.author}</span>
            <Badge variant="outline" className={`${meta.color} bg-secondary/10 text-primary border-primary/30`}>{meta.label}</Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {post.barangay} · {new Date(post.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
      <p className="px-4 pb-3 text-sm text-slate-700/90">{body}</p>
      {(post as any).location_name && (
        <div className="px-4 pb-3 flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-primary" onClick={() => setShowLocationDialog(true)}>
          <MapPin className="h-4 w-4" />
          <span>{(post as any).location_name}</span>
        </div>
      )}
      {showLocationDialog && (post as any).latitude && (post as any).longitude && (
        <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
          <DialogContent className="max-w-2xl">
            <LocationView
              latitude={(post as any).latitude}
              longitude={(post as any).longitude}
              locationName={(post as any).location_name}
              locationAddress={(post as any).location_address}
              onClose={() => setShowLocationDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}
      {isOwner && (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3 pt-2 bg-secondary/5 border-t border-primary/20">
          <Dialog open={isEditOpen} onOpenChange={(open) => {
            setIsEditOpen(open);
            if (open) setEditValue(body);
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10 hover:border-primary">
                <Edit3 className="h-4 w-4" /> Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-primary">Edit post</h2>
                <Textarea value={editValue} onChange={(event) => setEditValue(event.target.value)} className="min-h-[120px] border-primary/30 focus:border-primary focus:ring-primary/50" />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={handleSave}>
                    Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete post?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The post will be removed from EcoFeed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      {img && (
        <Dialog>
          <DialogTrigger asChild>
            <button className="block w-full overflow-hidden rounded-none text-left focus:outline-none focus:ring-2 focus:ring-primary/70">
              <img
                src={img}
                alt="Post image"
                loading="lazy"
                className="h-56 w-full object-cover transition-transform duration-200 hover:scale-[1.02]"
              />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl p-0">
            <img
              src={img}
              alt="Post image"
              className="max-h-[85vh] w-full object-contain"
            />
          </DialogContent>
        </Dialog>
      )}
      <div className="flex flex-wrap gap-3 border-t border-primary/20 px-4 py-3 text-xs text-primary/70 bg-secondary/10">
        {post.kg !== null && post.kg !== undefined && (
          <span className="inline-flex items-center gap-1 bg-secondary/10 text-primary px-2 py-1 rounded-full"><Scale className="h-3.5 w-3.5" />{post.kg} kg</span>
        )}
        {post.price && (
          <span className="inline-flex items-center gap-1 bg-secondary/10 text-primary px-2 py-1 rounded-full"><Tag className="h-3.5 w-3.5" />{post.price}</span>
        )}
        {post.date && (
          <span className="inline-flex items-center gap-1 bg-secondary/10 text-primary px-2 py-1 rounded-full"><Calendar className="h-3.5 w-3.5" />{post.date}</span>
        )}
      </div>
      
      {/* Reactions */}
      <div className="px-4 py-3 border-t border-primary/10">
        <FeedReactions postId={post.id} />
      </div>
      
      {/* Comments */}
      <div className="px-4 py-3 border-t border-primary/10">
        <FeedComments postId={post.id} />
      </div>
    </Card>
  );
}
