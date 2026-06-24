import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MessageCircle, Trash2, Edit2, Send } from "lucide-react";
import { toast } from "sonner";

type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
};

interface FeedCommentsProps {
  postId: string;
}

export function FeedComments({ postId }: FeedCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from("feed_comments" as any)
        .select("*")
        .eq("post_id", postId as any)
        .order("created_at", { ascending: false });

      if (commentsError) throw commentsError;

      // Fetch profile data for all users
      const userIds = [...new Set(commentsData?.map((c: any) => c.user_id) || [])];
      
      let profileMap = new Map();
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);

        profileMap = new Map(profilesData?.map((p: any) => [p.id, p]) || []);
      }

      // Combine comments with profile data
      const commentsWithProfiles = (commentsData || []).map((comment: any) => ({
        ...comment,
        profiles: profileMap.get(comment.user_id),
      }));

      setComments(commentsWithProfiles as unknown as Comment[]);
    } catch (error: any) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      const { data, error } = await supabase
        .from("feed_comments" as any)
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
        } as any)
        .select("*")
        .single();

      if (error) throw error;

      // Fetch profile for the new comment
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", user.id)
        .single();

      console.log("Profile data for new comment:", profileData, "Error:", profileError);

      const newCommentWithProfile = {
        ...(data as unknown as Comment),
        profiles: profileData || { full_name: user.email?.split('@')[0] || 'User' },
      };

      setComments([newCommentWithProfile as unknown as Comment, ...comments]);
      setNewComment("");
      toast.success("Comment added");
    } catch (error: any) {
      toast.error(`Failed to add comment: ${error.message}`);
    }
  };

  const updateComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from("feed_comments" as any)
        .update({ content: editContent.trim() } as any)
        .eq("id", commentId as any)
        .eq("user_id", user?.id as any);

      if (error) throw error;

      setComments(
        comments.map((c) =>
          c.id === commentId ? { ...c, content: editContent.trim() } : c
        ) as any
      );
      setEditingComment(null);
      setEditContent("");
      toast.success("Comment updated");
    } catch (error: any) {
      toast.error(`Failed to update comment: ${error.message}`);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("feed_comments" as any)
        .delete()
        .eq("id", commentId as any)
        .eq("user_id", user?.id as any);

      if (error) throw error;

      setComments(comments.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } catch (error: any) {
      toast.error(`Failed to delete comment: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading comments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Comments ({comments.length})</h3>
      </div>

      {/* Add Comment Form */}
      {user && (
        <div className="flex gap-2">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 min-h-[60px]"
          />
          <Button onClick={addComment} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm">
                      {comment.profiles?.full_name || "User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString()} at{" "}
                      {new Date(comment.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {editingComment === comment.id ? (
                    <div className="flex gap-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 min-h-[60px]"
                      />
                      <Button onClick={() => updateComment(comment.id)} size="sm">
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingComment(null);
                          setEditContent("");
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm">{comment.content}</p>
                  )}
                </div>
                {user && user.id === comment.user_id && (
                  <div className="flex gap-1">
                    <Button
                      onClick={() => {
                        setEditingComment(comment.id);
                        setEditContent(comment.content);
                      }}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => deleteComment(comment.id)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
