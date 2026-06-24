import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, ThumbsUp, Heart, MessageCircle, Filter, Search, Calendar, Tag, AlertCircle } from "lucide-react";
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
  const { user, profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterImportance, setFilterImportance] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");

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
          });

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
        });

      if (error) throw error;
      toast.success("Comment added successfully");
      setNewComment("");
      loadComments();
    } catch (error: any) {
      toast.error(`Failed to add comment: ${error.message}`);
    }
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: "bg-blue-100 text-blue-700 border-blue-200",
      emergency: "bg-red-100 text-red-700 border-red-200",
      event: "bg-purple-100 text-purple-700 border-purple-200",
      policy: "bg-orange-100 text-orange-700 border-orange-200",
    };
    return colors[category] || colors.general;
  };

  const getImportanceColor = (importance: string) => {
    const colors: Record<string, string> = {
      normal: "bg-gray-100 text-gray-700 border-gray-200",
      important: "bg-yellow-100 text-yellow-700 border-yellow-200",
      urgent: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[importance] || colors.normal;
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
      <PageHero
        eyebrow="Community Announcements"
        title="Stay informed with LGU updates."
        sub="View announcements from the Local Government Unit, react to important updates, and engage with community discussions."
      />
      <Container className="py-12">
        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px]">
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
              <SelectTrigger className="w-[150px]">
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
        </Card>

        {/* Announcements List */}
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading announcements...</p>
        ) : filteredAnnouncements.length === 0 ? (
          <Card className="p-8 text-center">
            <Megaphone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">No announcements found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or check back later for new announcements.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredAnnouncements.map((announcement) => {
              const userReaction = getUserReaction(announcement.id);
              const announcementComments = getAnnouncementComments(announcement.id);

              return (
                <Card key={announcement.id} className="p-6 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getCategoryColor(announcement.category)}>{announcement.category}</Badge>
                      <Badge className={getImportanceColor(announcement.importance)}>{announcement.importance}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(announcement.published_at || announcement.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <h3 className="font-display text-2xl font-semibold mb-3">{announcement.title}</h3>
                  <p className="text-muted-foreground mb-6 whitespace-pre-wrap">{announcement.content}</p>

                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={userReaction?.reaction_type === "like" ? "default" : "outline"}
                        onClick={() => handleReaction(announcement.id, "like")}
                        className="gap-2"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        {getReactionCount(announcement.id, "like")}
                      </Button>
                      <Button
                        size="sm"
                        variant={userReaction?.reaction_type === "love" ? "default" : "outline"}
                        onClick={() => handleReaction(announcement.id, "love")}
                        className="gap-2"
                      >
                        <Heart className="h-4 w-4" />
                        {getReactionCount(announcement.id, "love")}
                      </Button>
                      <Dialog open={isCommentsOpen && selectedAnnouncement?.id === announcement.id} onOpenChange={(open) => { setIsCommentsOpen(open); if (open) setSelectedAnnouncement(announcement); }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-2">
                            <MessageCircle className="h-4 w-4" />
                            {announcementComments.length}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Comments</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {announcementComments.length === 0 ? (
                              <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
                            ) : (
                              <div className="space-y-3">
                                {announcementComments.map((comment) => (
                                  <div key={comment.id} className="border rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-sm">User {comment.user_id.slice(0, 8)}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(comment.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-sm">{comment.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            <form onSubmit={handleAddComment} className="flex gap-2">
                              <Input
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="flex-1"
                              />
                              <Button type="submit">Send</Button>
                            </form>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Container>
    </>
  );
}
