import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Container, PremiumHero } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, ThumbsUp, Heart, MessageCircle, Search, Calendar, Tag, AlertCircle, Plus, Edit, Trash2, X, Image as ImageIcon, Eye, Clock, Pin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({ meta: [{ title: "Announcements — EcoLoop Siargao" }] }),
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

function UserAnnouncements() {
  const { user, profile, isLguAdmin } = useAuth();
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
      const { data, error } = await supabase
        .from("announcement_reactions")
        .select("*");

      if (error) throw error;
      setReactions(data || []);
    } catch (error: any) {
      console.error("Failed to load reactions:", error);
    }
  };

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from("announcement_comments")
        .select("*");

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
        r => r.announcement_id === announcementId && r.user_id === user.id && r.reaction_type === reactionType
      );

      if (existingReaction) {
        const { error } = await supabase
          .from("announcement_reactions")
          .delete()
          .eq("id", existingReaction.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("announcement_reactions")
          .insert({
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
      const { error } = await supabase
        .from("announcement_comments")
        .insert({
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
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `announcement-images/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('announcement-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('announcement-images')
            .getPublicUrl(filePath);

          return publicUrl;
        });

        images = await Promise.all(uploadPromises);
        imageUrl = images[0]; // Keep backward compatibility
      }

      const { error } = await supabase
        .from("announcements")
        .insert({
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
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `announcement-images/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('announcement-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('announcement-images')
            .getPublicUrl(filePath);

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
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

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
    // Parse existing images for preview
    let previews: string[] = [];
    if (announcement.images) {
      try {
        previews = JSON.parse(announcement.images as string);
      } catch (e) {
        previews = announcement.image_url ? [announcement.image_url] : [];
      }
    } else if (announcement.image_url) {
      previews = [announcement.image_url];
    }
    setImagePreviews(previews);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select only image files');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
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
    return reactions.find(r => r.announcement_id === announcementId && r.user_id === user.id);
  };

  const getReactionCount = (announcementId: string, reactionType: string) => {
    return reactions.filter(r => r.announcement_id === announcementId && r.reaction_type === reactionType).length;
  };

  const getAnnouncementComments = (announcementId: string) => {
    return comments.filter(c => c.announcement_id === announcementId);
  };


  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesCategory = filterCategory === "all" || announcement.category === filterCategory;
    const matchesImportance = filterImportance === "all" || announcement.importance === filterImportance;
    const matchesSearch = searchQuery === "" || 
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesImportance && matchesSearch;
  });

  if (!user) {
    return (
      <Container className="py-12">
        <Card className="mx-auto max-w-xl p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-3 font-display text-2xl font-semibold">Authentication required</h2>
          <p className="mt-2 text-sm text-muted-foreground">Please sign in to view announcements.</p>
        </Card>
      </Container>
    );
  }

  return (
    <>
      <PremiumHero
        title="Announcements"
        sub={isLguAdmin ? "Create, edit, publish, and manage announcements for the community." : "View announcements from the Local Government Unit, react to important updates, and engage with community discussions."}
      />
      <Container className="py-12">
        {/* Create Announcement Button - LGU Admin Only */}
        {isLguAdmin && (
          <div className="mb-8 flex justify-end">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Create Announcement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Announcement</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateAnnouncement} className="space-y-4">
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
                        id="announcement-image-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('announcement-image-upload')?.click()}
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
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
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
                      <Select value={formData.importance} onValueChange={(value) => setFormData({ ...formData, importance: value })}>
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
                    <Button type="button" variant="outline" onClick={() => {
                      setIsCreateDialogOpen(false);
                      clearAllImages();
                    }}>Cancel</Button>
                    <Button type="submit">Publish</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Edit Announcement Dialog - LGU Admin Only */}
        {isLguAdmin && editingAnnouncement && (
          <Dialog open={!!editingAnnouncement} onOpenChange={(open) => { if (!open) setEditingAnnouncement(null); }}>
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
                      onClick={() => document.getElementById('edit-announcement-image-upload')?.click()}
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
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
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
                    <Select value={formData.importance} onValueChange={(value) => setFormData({ ...formData, importance: value })}>
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
                  <Button type="button" variant="outline" onClick={() => {
                    setEditingAnnouncement(null);
                    clearAllImages();
                  }}>Cancel</Button>
                  <Button type="submit">Update</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Filters */}
        <Card className="p-6 mb-8 border-emerald-200 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all shadow-sm"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[140px]">
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
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Importance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Importance</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Announcements List */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex gap-4">
                  <div className="h-48 w-full max-w-md bg-slate-200 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-slate-200 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
                    <div className="h-4 bg-slate-200 rounded w-full animate-pulse" />
                    <div className="h-4 bg-slate-200 rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <Card className="p-12 text-center border-emerald-200 bg-white/80 backdrop-blur-sm">
            <Megaphone className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <h3 className="font-display text-xl font-semibold text-slate-900 mb-2">No announcements found</h3>
            <p className="text-slate-500">Try adjusting your filters or check back later for new announcements.</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {filteredAnnouncements.map((announcement) => {
              const userReaction = getUserReaction(announcement.id);
              const announcementComments = getAnnouncementComments(announcement.id);
              const isFeatured = announcement.importance === 'urgent';
              const previewText = announcement.content.length > 200 ? announcement.content.slice(0, 200) + '...' : announcement.content;
              let images: string[] = [];
              if (announcement.images) {
                try {
                  images = JSON.parse(announcement.images as string);
                } catch (e) {
                  images = announcement.image_url ? [announcement.image_url] : [];
                }
              } else if (announcement.image_url) {
                images = [announcement.image_url];
              }

              return (
                <Card 
                  key={announcement.id} 
                  className={`p-0 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-slate-200 hover:border-emerald-300 ${
                    isFeatured ? 'ring-2 ring-amber-400 ring-offset-2' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Cover Image */}
                    {images.length > 0 && (
                      <div className="md:w-80 h-64 md:h-auto relative">
                        <img
                          src={images[0]}
                          alt={announcement.title}
                          className="w-full h-full object-cover"
                        />
                        {isFeatured && (
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                              <Pin className="h-3 w-3" />
                              Featured
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                            announcement.category === 'general' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            announcement.category === 'emergency' ? 'bg-red-100 text-red-700 border-red-200' :
                            announcement.category === 'event' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            announcement.category === 'policy' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            <Tag className="h-3 w-3" />
                            {announcement.category}
                          </Badge>
                          <Badge className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                            announcement.importance === 'normal' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                            announcement.importance === 'important' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            announcement.importance === 'urgent' ? 'bg-red-100 text-red-700 border-red-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            <AlertCircle className="h-3 w-3" />
                            {announcement.importance}
                          </Badge>
                        </div>

                        {/* Actions - Edit/Delete for LGU Admin */}
                        {isLguAdmin && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(announcement);
                              }}
                              className="gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Are you sure you want to delete this announcement?")) {
                                  handleDeleteAnnouncement(announcement.id);
                                }
                              }}
                              className="gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-display text-2xl font-semibold text-slate-900 mb-3">{announcement.title}</h3>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(announcement.published_at || announcement.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(announcement.published_at || announcement.created_at).toLocaleTimeString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {Math.floor(Math.random() * 100) + 10} views
                        </div>
                      </div>

                      {/* Preview */}
                      <p className="text-slate-600 mb-4 line-clamp-3">{previewText}</p>

                      {/* Actions */}
                      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={userReaction?.reaction_type === "like" ? "default" : "outline"}
                            onClick={() => handleReaction(announcement.id, "like")}
                            className="gap-2 rounded-full"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            {getReactionCount(announcement.id, "like")}
                          </Button>
                          <Button
                            size="sm"
                            variant={userReaction?.reaction_type === "love" ? "default" : "outline"}
                            onClick={() => handleReaction(announcement.id, "love")}
                            className="gap-2 rounded-full"
                          >
                            <Heart className="h-4 w-4" />
                            {getReactionCount(announcement.id, "love")}
                          </Button>
                          <Button size="sm" variant="outline" className="gap-2 rounded-full">
                            <MessageCircle className="h-4 w-4" />
                            {announcementComments.length}
                          </Button>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => setSelectedAnnouncement(announcement)}
                        >
                          Read More
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Announcement Details Dialog */}
        {selectedAnnouncement && (
          <Dialog open={!!selectedAnnouncement} onOpenChange={(open) => { if (!open) setSelectedAnnouncement(null); }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedAnnouncement.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Larger Image */}
                {(() => {
                  let images: string[] = [];
                  if (selectedAnnouncement.images) {
                    try {
                      images = JSON.parse(selectedAnnouncement.images as string);
                    } catch (e) {
                      images = selectedAnnouncement.image_url ? [selectedAnnouncement.image_url] : [];
                    }
                  } else if (selectedAnnouncement.image_url) {
                    images = [selectedAnnouncement.image_url];
                  }
                  if (images.length > 0) {
                    return (
                      <div className="rounded-xl overflow-hidden">
                        <img
                          src={images[0]}
                          alt={selectedAnnouncement.title}
                          className="w-full h-96 object-cover"
                        />
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Badge className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                      selectedAnnouncement.category === 'general' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      selectedAnnouncement.category === 'emergency' ? 'bg-red-100 text-red-700 border-red-200' :
                      selectedAnnouncement.category === 'event' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                      selectedAnnouncement.category === 'policy' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      <Tag className="h-3 w-3" />
                      {selectedAnnouncement.category}
                    </Badge>
                    <Badge className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                      selectedAnnouncement.importance === 'normal' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                      selectedAnnouncement.importance === 'important' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      selectedAnnouncement.importance === 'urgent' ? 'bg-red-100 text-red-700 border-red-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      <AlertCircle className="h-3 w-3" />
                      {selectedAnnouncement.importance}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedAnnouncement.published_at || selectedAnnouncement.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(selectedAnnouncement.published_at || selectedAnnouncement.created_at).toLocaleTimeString()}
                  </div>
                </div>

                {/* Full Content */}
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedAnnouncement.content}</p>
                </div>

                {/* Reactions */}
                <div className="flex items-center gap-2 border-t pt-4">
                  <Button
                    size="sm"
                    variant={getUserReaction(selectedAnnouncement.id)?.reaction_type === "like" ? "default" : "outline"}
                    onClick={() => handleReaction(selectedAnnouncement.id, "like")}
                    className="gap-2 rounded-full"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {getReactionCount(selectedAnnouncement.id, "like")}
                  </Button>
                  <Button
                    size="sm"
                    variant={getUserReaction(selectedAnnouncement.id)?.reaction_type === "love" ? "default" : "outline"}
                    onClick={() => handleReaction(selectedAnnouncement.id, "love")}
                    className="gap-2 rounded-full"
                  >
                    <Heart className="h-4 w-4" />
                    {getReactionCount(selectedAnnouncement.id, "love")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </Container>
    </>
  );
}
