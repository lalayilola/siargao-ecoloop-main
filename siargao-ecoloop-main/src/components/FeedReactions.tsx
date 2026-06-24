import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Heart, ThumbsUp, Handshake, Sprout } from "lucide-react";
import { toast } from "sonner";

type Reaction = {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: "like" | "love" | "helpful" | "support";
  created_at: string;
};

interface FeedReactionsProps {
  postId: string;
}

const REACTIONS = [
  { type: "like", icon: ThumbsUp, label: "Like", emoji: "👍" },
  { type: "love", icon: Heart, label: "Love", emoji: "❤️" },
  { type: "helpful", icon: Handshake, label: "Helpful", emoji: "🤝" },
  { type: "support", icon: Sprout, label: "Support", emoji: "🌱" },
] as const;

export function FeedReactions({ postId }: FeedReactionsProps) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [userReaction, setUserReaction] = useState<Reaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReactions();
  }, [postId]);

  const loadReactions = async () => {
    try {
      const { data, error } = await supabase
        .from("feed_reactions" as any)
        .select("*")
        .eq("post_id", postId);

      if (error) throw error;
      setReactions((data || []) as Reaction[]);

      // Find current user's reaction
      if (user) {
        const myReaction = data?.find((r: any) => r.user_id === user.id);
        setUserReaction((myReaction || null) as Reaction | null);
      }
    } catch (error: any) {
      console.error("Error loading reactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (reactionType: "like" | "love" | "helpful" | "support") => {
    if (!user) {
      toast.error("Please sign in to react");
      return;
    }

    try {
      // Use REST API to bypass schema cache
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

      if (userReaction?.reaction_type === reactionType) {
        // Remove reaction if clicking the same one
        const response = await fetch(`${supabaseUrl}/rest/v1/feed_reactions?id=eq.${userReaction.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': supabaseKey,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to delete reaction');
        }

        setReactions(reactions.filter((r) => r.id !== userReaction.id));
        setUserReaction(null);
      } else if (userReaction) {
        // Change reaction if clicking a different one
        const response = await fetch(`${supabaseUrl}/rest/v1/feed_reactions?id=eq.${userReaction.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({ reaction_type: reactionType } as any),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to update reaction');
        }

        const data = await response.json();
        setReactions(
          reactions.map((r) => (r.id === userReaction.id ? (data[0] as Reaction) : r))
        );
        setUserReaction(data[0] as Reaction);
      } else {
        // Add new reaction - check if user already has one first
        const checkResponse = await fetch(`${supabaseUrl}/rest/v1/feed_reactions?post_id=eq.${postId}&user_id=eq.${user.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': supabaseKey,
          },
        });

        if (checkResponse.ok) {
          const existingData = await checkResponse.json();
          if (existingData && existingData.length > 0) {
            // User already has a reaction, update it instead
            const existingReaction = existingData[0];
            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/feed_reactions?id=eq.${existingReaction.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`,
                'apikey': supabaseKey,
              },
              body: JSON.stringify({ reaction_type: reactionType } as any),
            });

            if (!updateResponse.ok) {
              const errorText = await updateResponse.text();
              throw new Error(errorText || 'Failed to update reaction');
            }

            const data = await updateResponse.json();
            setReactions(
              reactions.map((r) => (r.id === existingReaction.id ? (data[0] as Reaction) : r))
            );
            setUserReaction(data[0] as Reaction);
            return;
          }
        }

        // No existing reaction, add new one
        const response = await fetch(`${supabaseUrl}/rest/v1/feed_reactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType,
          } as any),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to add reaction');
        }

        const data = await response.json();
        setReactions([...reactions, data[0] as Reaction]);
        setUserReaction(data[0] as Reaction);
      }
    } catch (error: any) {
      toast.error(`Failed to update reaction: ${error.message}`);
    }
  };

  const getReactionCounts = () => {
    const counts: Record<string, number> = {
      like: 0,
      love: 0,
      helpful: 0,
      support: 0,
    };

    reactions.forEach((r) => {
      counts[r.reaction_type]++;
    });

    return counts;
  };

  const counts = getReactionCounts();

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading reactions...</div>;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {REACTIONS.map(({ type, icon: Icon, label, emoji }) => {
        const count = counts[type];
        const isActive = userReaction?.reaction_type === type;

        return (
          <Button
            key={type}
            onClick={() => handleReaction(type)}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            <span className="text-lg">{emoji}</span>
            <span className="text-sm">{label}</span>
            {count > 0 && <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">{count}</span>}
          </Button>
        );
      })}
      {reactions.length > 0 && (
        <span className="text-sm text-muted-foreground">
          {reactions.length} reaction{reactions.length !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
