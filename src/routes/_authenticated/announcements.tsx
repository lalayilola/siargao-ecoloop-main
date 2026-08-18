import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Container, PremiumHero } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertCircle,
  BellRing,
  Calendar,
  ChevronRight,
  Clock,
  Edit,
  Heart,
  Image as ImageIcon,
  Images,
  Megaphone,
  MessageCircle,
  Plus,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Tag,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({ meta: [{ title: "Announcements — Farm2Food Cycle" }] }),
  component: UserAnnouncements,
});

type Announcement = {
  id: string;
  lgu_admin_id: string;
  title: string;
  content: string;
  category: string;
  importance: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  image_url?: string | null;
  images?: string | null;
};

type Reaction = {
  id: string;
  announcement_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
};

type Comment = {
  id: string;
  announcement_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

const categoryStyles: Record<string, string> = {
  general: "border-sky-200 bg-sky-50 text-sky-700",
  emergency: "border-rose-200 bg-rose-50 text-rose-700",
  event: "border-violet-200 bg-violet-50 text-violet-700",
  policy: "border-amber-200 bg-amber-50 text-amber-700",
};

const importanceStyles: Record<string, string> = {
  normal: "border-slate-200 bg-slate-50 text-slate-600",
  important: "border-amber-200 bg-amber-50 text-amber-700",
  urgent: "border-rose-200 bg-rose-50 text-rose-700",
};

const getAnnouncementImages = (announcement: Announcement) => {
  if (announcement.images) {
    try {
      const parsed = JSON.parse(announcement.images);
      if (Array.isArray(parsed))
        return parsed.filter((image): image is string => typeof image === "string");
    } catch {
      // Fall back to the legacy single-image field.
    }
  }

  return announcement.image_url ? [announcement.image_url] : [];
};

const formatPublishedDate = (announcement: Announcement) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(announcement.published_at || announcement.created_at));

const formatPublishedTime = (announcement: Announcement) =>
  new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(announcement.published_at || announcement.created_at));

const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function UserAnnouncements() {
  const { user, isLguAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterImportance, setFilterImportance] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
    importance: "normal",
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    loadAnnouncements();
    loadReactions();
    loadComments();
  }, [user]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      toast.error(`Failed to load announcements: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadReactions = async () => {
    try {
      const { data, error } = await supabase.from("announcement_reactions").select("*");

      if (error) throw error;
      setReactions(data || []);
    } catch (error: any) {
      console.error("Failed to load reactions:", error);
    }
  };

  const loadComments = async () => {
    try {
      const { data, error } = await supabase.from("announcement_comments").select("*");

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      console.error("Failed to load comments:", error);
    }
  };

  const handleReaction = async (announcementId: string, reactionType: string) => {
    if (!user) return;

    try {
      const existingReaction = reactions.find(
        (r) =>
          r.announcement_id === announcementId &&
          r.user_id === user.id &&
          r.reaction_type === reactionType,
      );

      if (existingReaction) {
        const { error } = await supabase
          .from("announcement_reactions")
          .delete()
          .eq("id", existingReaction.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("announcement_reactions").insert({
          announcement_id: announcementId,
          user_id: user.id,
          reaction_type: reactionType,
        } as any);

        if (error) throw error;
      }

      loadReactions();
    } catch (error: any) {
      toast.error(`Failed to update reaction: ${error.message}`);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAnnouncement || !newComment.trim()) return;

    try {
      const { error } = await supabase.from("announcement_comments").insert({
        announcement_id: selectedAnnouncement.id,
        user_id: user.id,
        content: newComment.trim(),
      } as any);

      if (error) throw error;
      toast.success("Comment added successfully");
      setNewComment("");
      loadComments();
    } catch (error: any) {
      toast.error(`Failed to add comment: ${error.message}`);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isLguAdmin) return;

    try {
      let imageUrl = null;
      let images: string[] = [];

      // Upload images if selected
      if (selectedImages.length > 0) {
        const uploadPromises = selectedImages.map(async (file) => {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `announcement-images/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("announcement-images")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from("announcement-images").getPublicUrl(filePath);

          return publicUrl;
        });

        images = await Promise.all(uploadPromises);
        imageUrl = images[0]; // Keep backward compatibility
      }

      const { error } = await supabase.from("announcements").insert({
        lgu_admin_id: user.id,
        title: formData.title,
        content: formData.content,
        category: formData.category,
        importance: formData.importance,
        status: "published",
        published_at: new Date().toISOString(),
        image_url: imageUrl,
        images: images.length > 0 ? JSON.stringify(images) : null,
      } as any);

      if (error) throw error;
      toast.success("Announcement published successfully");
      setIsCreateDialogOpen(false);
      setFormData({ title: "", content: "", category: "general", importance: "normal" });
      setSelectedImages([]);
      setImagePreviews([]);
      loadAnnouncements();
    } catch (error: any) {
      toast.error(`Failed to publish announcement: ${error.message}`);
    }
  };

  const handleEditAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isLguAdmin || !editingAnnouncement) return;

    try {
      let imageUrl = editingAnnouncement.image_url;
      let images: string[] = [];

      // Parse existing images
      if (editingAnnouncement.images) {
        try {
          images = JSON.parse(editingAnnouncement.images);
        } catch (e) {
          images = editingAnnouncement.image_url ? [editingAnnouncement.image_url] : [];
        }
      } else if (editingAnnouncement.image_url) {
        images = [editingAnnouncement.image_url];
      }

      // Upload new images if selected
      if (selectedImages.length > 0) {
        const uploadPromises = selectedImages.map(async (file) => {
          const fileExt = file.name.split(".").pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `announcement-images/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("announcement-images")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from("announcement-images").getPublicUrl(filePath);

          return publicUrl;
        });

        const newImages = await Promise.all(uploadPromises);
        images = [...images, ...newImages];
        imageUrl = images[0]; // Keep backward compatibility
      }

      const { error } = await (supabase.from("announcements") as any)
        .update({
          title: formData.title,
          content: formData.content,
          category: formData.category,
          importance: formData.importance,
          image_url: imageUrl,
          images: images.length > 0 ? JSON.stringify(images) : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingAnnouncement.id);

      if (error) throw error;
      toast.success("Announcement updated successfully");
      setEditingAnnouncement(null);
      setFormData({ title: "", content: "", category: "general", importance: "normal" });
      setSelectedImages([]);
      setImagePreviews([]);
      loadAnnouncements();
    } catch (error: any) {
      toast.error(`Failed to update announcement: ${error.message}`);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!user || !isLguAdmin) return;

    try {
      const { error } = await supabase.from("announcements").delete().eq("id", id);

      if (error) throw error;
      toast.success("Announcement deleted successfully");
      loadAnnouncements();
    } catch (error: any) {
      toast.error(`Failed to delete announcement: ${error.message}`);
    }
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      importance: announcement.importance,
    });
    setImagePreviews(getAnnouncementImages(announcement));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select only image files");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    setSelectedImages([...selectedImages, ...newFiles]);
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const clearImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setSelectedImages([]);
    setImagePreviews([]);
  };

  const getUserReaction = (announcementId: string) => {
    if (!user) return null;
    return reactions.find((r) => r.announcement_id === announcementId && r.user_id === user.id);
  };

  const getReactionCount = (announcementId: string, reactionType: string) => {
    return reactions.filter(
      (r) => r.announcement_id === announcementId && r.reaction_type === reactionType,
    ).length;
  };

  const getAnnouncementComments = (announcementId: string) => {
    return comments.filter((c) => c.announcement_id === announcementId);
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesCategory = filterCategory === "all" || announcement.category === filterCategory;
    const matchesImportance =
      filterImportance === "all" || announcement.importance === filterImportance;
    const matchesSearch =
      searchQuery === "" ||
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesImportance && matchesSearch;
  });

  const urgentCount = announcements.filter(
    (announcement) => announcement.importance === "urgent",
  ).length;
  const activeFilterCount =
    Number(searchQuery.trim().length > 0) +
    Number(filterCategory !== "all") +
    Number(filterImportance !== "all");

  const clearFilters = () => {
    setSearchQuery("");
    setFilterCategory("all");
    setFilterImportance("all");
  };
  const detailImages = selectedAnnouncement ? getAnnouncementImages(selectedAnnouncement) : [];

  if (!user) {
    return (
      <Container className="py-12">
        <Card className="mx-auto max-w-xl p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-3 font-display text-2xl font-semibold">Authentication required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please sign in to view announcements.
          </p>
        </Card>
      </Container>
    );
  }

  return (
    <>
      <PremiumHero
        title="Community Announcements"
        sub={
          isLguAdmin
            ? "Keep Siargao informed with timely community news, advisories, and events."
            : "Stay informed with the latest news, advisories, and events from your Local Government Unit."
        }
      />
      <Container className="py-8 sm:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-100">
                <BellRing className="h-4 w-4" />
              </span>
              Community bulletin
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              What’s happening in Siargao
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Browse official updates, share a reaction, or join the conversation.
            </p>
          </div>

          {/* Create Announcement Button - LGU Admin Only */}
          {isLguAdmin && (
            <div className="flex shrink-0">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="h-11 rounded-xl bg-emerald-600 px-5 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700">
                    <Plus className="mr-2 h-4 w-4" /> New announcement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl">
                  <DialogHeader>
                    <div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <DialogTitle className="font-display text-2xl">
                      Create a new announcement
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      Share a clear, timely update with the community.
                    </p>
                  </DialogHeader>
                  <form onSubmit={handleCreateAnnouncement} className="space-y-5">
                    <div>
                      <label
                        htmlFor="announcement-title"
                        className="mb-1.5 block text-sm font-semibold text-slate-700"
                      >
                        Title
                      </label>
                      <Input
                        id="announcement-title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Coastal clean-up this Saturday"
                        className="h-11 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="announcement-content"
                        className="mb-1.5 block text-sm font-semibold text-slate-700"
                      >
                        Message
                      </label>
                      <Textarea
                        id="announcement-content"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Include the important details your community needs to know…"
                        rows={6}
                        className="resize-none rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700">
                        Images <span className="font-normal text-slate-400">(optional)</span>
                      </label>
                      <div className="mt-2">
                        {imagePreviews.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {imagePreviews.map((preview, index) => (
                              <div key={index} className="relative inline-block">
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  className="h-24 w-24 rounded-xl border object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                  aria-label={`Remove image ${index + 1}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    clearImage(index);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                          id="announcement-image-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document.getElementById("announcement-image-upload")?.click()
                          }
                          className="h-11 w-full rounded-xl border-dashed"
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          {imagePreviews.length > 0 ? "Add more images" : "Upload images"}
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                          Category
                        </label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger className="h-11 w-full rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                            <SelectItem value="event">Event</SelectItem>
                            <SelectItem value="policy">Policy</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                          Priority
                        </label>
                        <Select
                          value={formData.importance}
                          onValueChange={(value) => setFormData({ ...formData, importance: value })}
                        >
                          <SelectTrigger className="h-11 w-full rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="important">Important</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => {
                          setIsCreateDialogOpen(false);
                          clearAllImages();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <Megaphone className="mr-2 h-4 w-4" />
                        Publish announcement
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Edit Announcement Dialog - LGU Admin Only */}
        {isLguAdmin && editingAnnouncement && (
          <Dialog
            open={!!editingAnnouncement}
            onOpenChange={(open) => {
              if (!open) setEditingAnnouncement(null);
            }}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Announcement</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditAnnouncement} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Announcement title"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Announcement content"
                    rows={6}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Images (optional)</label>
                  <div className="mt-2">
                    {imagePreviews.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative inline-block">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="h-24 w-24 object-cover rounded-lg border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                              onClick={(e) => {
                                e.preventDefault();
                                clearImage(index);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                      id="edit-announcement-image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("edit-announcement-image-upload")?.click()
                      }
                      className="w-full"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      {imagePreviews.length > 0 ? "Add more images" : "Upload images"}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="policy">Policy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Importance</label>
                    <Select
                      value={formData.importance}
                      onValueChange={(value) => setFormData({ ...formData, importance: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="important">Important</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingAnnouncement(null);
                      clearAllImages();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Update</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Filters */}
        <Card className="mb-7 overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 to-white px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">
                    {announcements.length}{" "}
                    {announcements.length === 1 ? "published update" : "published updates"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {urgentCount > 0
                      ? `${urgentCount} marked urgent`
                      : "You’re all caught up on urgent notices"}
                  </p>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="rounded-lg text-slate-600 hover:bg-white hover:text-emerald-700"
                >
                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  Clear {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"}
                </Button>
              )}
            </div>
          </div>
          <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                aria-label="Search announcements"
                placeholder="Search by title or keyword"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 transition-colors focus:bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterImportance} onValueChange={setFilterImportance}>
              <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="important">Important</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {!loading && filteredAnnouncements.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">
              Showing{" "}
              <span className="font-bold text-slate-900">{filteredAnnouncements.length}</span>{" "}
              {filteredAnnouncements.length === 1 ? "announcement" : "announcements"}
            </p>
            <p className="hidden text-xs text-slate-400 sm:block">Newest updates appear first</p>
          </div>
        )}

        {/* Announcements List */}
        {loading ? (
          <div className="space-y-4" aria-label="Loading announcements" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden rounded-2xl border-slate-200">
                <div className="flex flex-col md:flex-row">
                  <div className="h-52 animate-pulse bg-slate-100 md:h-auto md:w-72" />
                  <div className="flex-1 space-y-4 p-5 sm:p-6">
                    <div className="flex gap-2">
                      <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
                      <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
                    </div>
                    <div className="h-7 w-3/4 animate-pulse rounded-lg bg-slate-100" />
                    <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
                    <div className="space-y-2">
                      <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                      <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
              <Megaphone className="h-8 w-8" />
            </span>
            <h3 className="mt-5 font-display text-xl font-bold text-slate-900">
              {activeFilterCount > 0 ? "No matching announcements" : "No announcements yet"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {activeFilterCount > 0
                ? "Try a different keyword or clear your filters to see all community updates."
                : "Official community updates will appear here as soon as they are published."}
            </p>
            {activeFilterCount > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-white"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear all filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => {
              const userReaction = getUserReaction(announcement.id);
              const announcementComments = getAnnouncementComments(announcement.id);
              const isUrgent = announcement.importance === "urgent";
              const images = getAnnouncementImages(announcement);

              return (
                <Card
                  key={announcement.id}
                  className={`group overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70 ${
                    isUrgent
                      ? "border-rose-200 ring-1 ring-rose-100"
                      : "border-slate-200 hover:border-emerald-200"
                  }`}
                >
                  {isUrgent && (
                    <div className="h-1 bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400" />
                  )}
                  <article className="flex flex-col md:flex-row">
                    <button
                      type="button"
                      onClick={() => setSelectedAnnouncement(announcement)}
                      className="relative h-52 shrink-0 overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 text-left md:h-auto md:min-h-72 md:w-72"
                      aria-label={`Read ${announcement.title}`}
                    >
                      {images.length > 0 ? (
                        <img
                          src={images[0]}
                          alt={announcement.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-700">
                          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-emerald-100">
                            <Megaphone className="h-8 w-8" />
                          </span>
                          <span className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700/70">
                            Official update
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent opacity-60" />
                      {images.length > 1 && (
                        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-slate-950/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                          <Images className="h-3.5 w-3.5" />
                          {images.length}
                        </span>
                      )}
                      {isUrgent && (
                        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-rose-950/20">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Urgent notice
                        </span>
                      )}
                    </button>

                    <div className="min-w-0 flex-1 p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${categoryStyles[announcement.category] || categoryStyles.general}`}
                          >
                            <Tag className="mr-1 h-3 w-3" />
                            {titleCase(announcement.category)}
                          </Badge>
                          {!isUrgent && (
                            <Badge
                              variant="outline"
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${importanceStyles[announcement.importance] || importanceStyles.normal}`}
                            >
                              {titleCase(announcement.importance)}
                            </Badge>
                          )}
                        </div>
                        {isLguAdmin && (
                          <div className="flex shrink-0 gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(announcement);
                              }}
                              className="h-8 rounded-lg px-2.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <Edit className="mr-1 h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Are you sure you want to delete this announcement?")) {
                                  handleDeleteAnnouncement(announcement.id);
                                }
                              }}
                              className="h-8 rounded-lg px-2.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedAnnouncement(announcement)}
                        className="mt-4 block text-left"
                      >
                        <h3 className="font-display text-xl font-bold leading-tight text-slate-900 transition-colors group-hover:text-emerald-800 sm:text-2xl">
                          {announcement.title}
                        </h3>
                      </button>

                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {formatPublishedDate(announcement)}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {formatPublishedTime(announcement)}
                        </span>
                      </div>

                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600 sm:text-[15px]">
                        {announcement.content}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReaction(announcement.id, "like")}
                            aria-label="Like announcement"
                            className={`h-9 rounded-full px-3 ${
                              userReaction?.reaction_type === "like"
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                            }`}
                          >
                            <ThumbsUp className="h-4 w-4" />
                            <span className="ml-1.5 text-xs font-semibold">
                              {getReactionCount(announcement.id, "like")}
                            </span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReaction(announcement.id, "love")}
                            aria-label="Love announcement"
                            className={`h-9 rounded-full px-3 ${
                              userReaction?.reaction_type === "love"
                                ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                                : "text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                            }`}
                          >
                            <Heart className="h-4 w-4" />
                            <span className="ml-1.5 text-xs font-semibold">
                              {getReactionCount(announcement.id, "love")}
                            </span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 rounded-full px-3 text-slate-500 hover:bg-sky-50 hover:text-sky-700"
                            onClick={() => setSelectedAnnouncement(announcement)}
                            aria-label="Open comments"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span className="ml-1.5 text-xs font-semibold">
                              {announcementComments.length}
                            </span>
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 rounded-full px-3 font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                          onClick={() => setSelectedAnnouncement(announcement)}
                        >
                          Read full update
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </article>
                </Card>
              );
            })}
          </div>
        )}

        {/* Announcement Details Dialog */}
        {selectedAnnouncement && (
          <Dialog
            open={!!selectedAnnouncement}
            onOpenChange={(open) => {
              if (!open) setSelectedAnnouncement(null);
            }}
          >
            <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl p-0 sm:max-w-4xl">
              <div className="border-b border-slate-100 bg-gradient-to-br from-emerald-50 via-white to-white px-5 pb-6 pt-7 sm:px-8 sm:pt-8">
                <DialogHeader className="pr-8 text-left">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${categoryStyles[selectedAnnouncement.category] || categoryStyles.general}`}
                    >
                      <Tag className="mr-1 h-3 w-3" />
                      {titleCase(selectedAnnouncement.category)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${importanceStyles[selectedAnnouncement.importance] || importanceStyles.normal}`}
                    >
                      {selectedAnnouncement.importance === "urgent" && (
                        <AlertCircle className="mr-1 h-3 w-3" />
                      )}
                      {titleCase(selectedAnnouncement.importance)}
                    </Badge>
                  </div>
                  <DialogTitle className="font-display text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                    {selectedAnnouncement.title}
                  </DialogTitle>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatPublishedDate(selectedAnnouncement)}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatPublishedTime(selectedAnnouncement)}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
                    <span>Official LGU update</span>
                  </div>
                </DialogHeader>
              </div>

              <div className="space-y-7 px-5 py-6 sm:px-8 sm:py-8">
                {detailImages.length > 0 && (
                  <div
                    className={`grid overflow-hidden rounded-2xl bg-slate-100 ${
                      detailImages.length > 1 ? "grid-cols-2 gap-1" : "grid-cols-1"
                    }`}
                  >
                    {detailImages.slice(0, 3).map((image, index) => (
                      <div
                        key={image}
                        className={
                          index === 0 && detailImages.length > 1
                            ? "col-span-2 h-64 sm:h-80"
                            : detailImages.length === 2
                              ? "col-span-2 h-40 sm:h-48"
                              : "relative h-40 sm:h-48"
                        }
                      >
                        <img
                          src={image}
                          alt={`${selectedAnnouncement.title}${index > 0 ? ` — image ${index + 1}` : ""}`}
                          className="h-full w-full object-cover"
                        />
                        {index === 2 && detailImages.length > 3 && (
                          <div className="absolute inset-0 grid place-items-center bg-slate-950/60 text-lg font-bold text-white">
                            +{detailImages.length - 3} more
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-l-4 border-emerald-500 pl-4 sm:pl-5">
                  <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700 sm:text-base">
                    {selectedAnnouncement.content}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 sm:px-4">
                  <p className="text-sm font-semibold text-slate-700">Was this update helpful?</p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReaction(selectedAnnouncement.id, "like")}
                      className={`rounded-full bg-white ${
                        getUserReaction(selectedAnnouncement.id)?.reaction_type === "like"
                          ? "border-emerald-300 text-emerald-700"
                          : "text-slate-600"
                      }`}
                    >
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Helpful · {getReactionCount(selectedAnnouncement.id, "like")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReaction(selectedAnnouncement.id, "love")}
                      aria-label="Love this announcement"
                      className={`rounded-full bg-white ${
                        getUserReaction(selectedAnnouncement.id)?.reaction_type === "love"
                          ? "border-rose-300 text-rose-700"
                          : "text-slate-600"
                      }`}
                    >
                      <Heart className="h-4 w-4" />
                      <span className="ml-1.5">
                        {getReactionCount(selectedAnnouncement.id, "love")}
                      </span>
                    </Button>
                  </div>
                </div>

                <section
                  className="border-t border-slate-200 pt-7"
                  aria-labelledby="discussion-title"
                >
                  <div className="mb-5 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700">
                      <MessageCircle className="h-5 w-5" />
                    </span>
                    <div>
                      <h3
                        id="discussion-title"
                        className="font-display text-lg font-bold text-slate-900"
                      >
                        Community discussion
                      </h3>
                      <p className="text-xs text-slate-500">
                        {getAnnouncementComments(selectedAnnouncement.id).length}{" "}
                        {getAnnouncementComments(selectedAnnouncement.id).length === 1
                          ? "comment"
                          : "comments"}
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleAddComment}
                    className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <label htmlFor="new-comment" className="sr-only">
                      Add a comment
                    </label>
                    <Textarea
                      id="new-comment"
                      value={newComment}
                      onChange={(event) => setNewComment(event.target.value)}
                      placeholder="Share a helpful comment…"
                      rows={3}
                      className="resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0"
                    />
                    <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3">
                      <p className="hidden text-xs text-slate-400 sm:block">
                        Keep the conversation respectful and on topic.
                      </p>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!newComment.trim()}
                        className="ml-auto rounded-xl bg-emerald-600 px-4 text-white hover:bg-emerald-700"
                      >
                        <Send className="mr-2 h-3.5 w-3.5" />
                        Post comment
                      </Button>
                    </div>
                  </form>

                  {getAnnouncementComments(selectedAnnouncement.id).length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-center">
                      <MessageCircle className="mx-auto h-7 w-7 text-slate-300" />
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        Start the conversation
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Be the first to leave a helpful comment.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getAnnouncementComments(selectedAnnouncement.id).map((comment) => (
                        <div
                          key={comment.id}
                          className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4"
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                            {comment.user_id === user.id ? "YO" : "CM"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className="text-sm font-bold text-slate-800">
                                {comment.user_id === user.id ? "You" : "Community member"}
                              </p>
                              <time className="text-[11px] text-slate-400">
                                {new Intl.DateTimeFormat("en-PH", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                }).format(new Date(comment.created_at))}
                              </time>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </Container>
    </>
  );
}
