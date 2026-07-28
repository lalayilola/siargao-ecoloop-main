import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNotificationSound } from "@/hooks/use-notification-sound";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";

export function AnnouncementNotification() {
  const { user } = useAuth();
  const playNotificationSound = useNotificationSound();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("new_announcements")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "announcements",
          filter: "status=eq.published",
        },
        async (payload) => {
          const newAnnouncement = payload.new as any;
          
          // Don't notify if the user is the one who published it
          if (newAnnouncement.lgu_admin_id === user.id) return;

          // Get LGU admin info
          const { data: adminProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", newAnnouncement.lgu_admin_id)
            .single();

          // Play sound
          playNotificationSound();

          // Show popup notification
          toast(
            <div className="flex items-center gap-3 p-2">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Megaphone className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900">New Announcement from {adminProfile?.full_name || "LGU Admin"}</p>
                <p className="text-xs text-slate-600 truncate">{newAnnouncement.title}</p>
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
                label: "View",
                onClick: () => {
                  window.location.href = "/announcements";
                },
              },
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, playNotificationSound]);

  return null;
}
