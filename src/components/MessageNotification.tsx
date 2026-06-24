import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";

export function MessageNotification() {
  const { user } = useAuth();
  const lastMessageId = useRef<string | null>(null);
  const audioInitialized = useRef(false);

  const playNotificationSound = () => {
    try {
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const audioContext = new AudioContext();
      
      // Create oscillator for beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 880; // A5 note
      oscillator.type = 'sine';
      gainNode.gain.value = 0.5; // Increase volume
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
      
      // Second beep
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        oscillator2.frequency.value = 1046; // C6 note
        oscillator2.type = 'sine';
        gainNode2.gain.value = 0.5;
        oscillator2.start();
        oscillator2.stop(audioContext.currentTime + 0.2);
      }, 250);
      
    } catch (error) {
      console.log("Audio play failed:", error);
    }
  };

  // Initialize audio on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioInitialized.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const audioContext = new AudioContext();
          if (audioContext.state === 'suspended') {
            audioContext.resume();
          }
          audioInitialized.current = true;
        }
      }
    };

    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    document.addEventListener('touchstart', initAudio);

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
  }, []);

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

          const isForUser = conversation.participant_1_id === user.id || conversation.participant_2_id === user.id;
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
                  <p className="font-semibold text-sm text-slate-900">New message from {senderProfile?.full_name || "Someone"}</p>
                  <p className="text-xs text-slate-600 truncate">{newMessage.content || "Sent a message"}</p>
                </div>
              </div>,
              {
                duration: 6000,
                position: "top-right",
                style: {
                  background: 'white',
                  border: '2px solid #10b981',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                },
                action: {
                  label: "View Messages",
                  onClick: () => {
                    window.location.href = "/messages";
                  },
                },
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
}
