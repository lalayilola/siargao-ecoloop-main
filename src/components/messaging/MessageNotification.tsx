import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNotificationSound } from "@/hooks/use-notification-sound";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";

export function MessageNotification() {
  const { user } = useAuth();
  const playNotificationSound = useNotificationSound();

  useEffect(() => {
    if (!user) return;

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel("new_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new as any;

          // Check if this message is for the current user
          const { data: conversation } = await supabase
            .from("conversations")
            .select("participant_1_id, participant_2_id")
            .eq("id", newMessage.conversation_id)
            .single();

          if (!conversation) return;

          const isForUser =
            conversation.participant_1_id === user.id || conversation.participant_2_id === user.id;
          const isFromOtherUser = newMessage.sender_id !== user.id;

          if (isForUser && isFromOtherUser) {
            // Get sender info
            const { data: senderProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", newMessage.sender_id)
              .single();

            // Play sound
            playNotificationSound();

            // Show popup notification with more prominent styling
            toast(
              <div className="flex items-center gap-3 p-2">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900">
                    New message from {senderProfile?.full_name || "Someone"}
                  </p>
                  <p className="text-xs text-slate-600 truncate">
                    {newMessage.content || "Sent a message"}
                  </p>
                </div>
              </div>,
              {
                duration: 6000,
                position: "top-right",
                style: {
                  background: "white",
                  border: "2px solid #10b981",
                  borderRadius: "12px",
                  padding: "16px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                },
                action: {
                  label: "View Messages",
                  onClick: () => {
                    window.location.href = "/messages";
                  },
                },
              },
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, playNotificationSound]);

  return null;
}
