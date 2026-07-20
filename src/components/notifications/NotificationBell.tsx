import { useState, useEffect } from "react";
import { Bell, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      const notifications = data as Notification[] | null;

      if (error) {
        console.error("Error loading notifications:", error);
        return;
      }

      setNotifications(notifications ?? []);
      setUnreadCount(notifications?.filter(n => !n.read_at).length ?? 0);
    };

    loadNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 10));
            setUnreadCount((prev) => prev + 1);
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await (supabase
      .from("notifications") as any)
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId);

    if (error) {
      toast.error("Failed to mark notification as read");
      return;
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const { error } = await (supabase
      .from("notifications") as any)
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user?.id)
      .is("read_at", null);

    if (error) {
      toast.error("Failed to mark all notifications as read");
      return;
    }

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      toast.error("Failed to delete notification");
      return;
    }

    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (notifications.find(n => n.id === notificationId)?.read_at === null) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const getNotificationLink = (notification: Notification) => {
    const titleLower = notification.title.toLowerCase();
    const typeLower = notification.type?.toLowerCase() || "";

    // Check for message notifications
    if (typeLower === "message" || titleLower.includes("message") || titleLower.includes("sent you")) {
      return "/messages";
    }
    // Check for purchase/trade notifications - override existing link
    else if (
      typeLower === "purchase_request" ||
      typeLower === "trade_request" ||
      titleLower.includes("purchase") ||
      titleLower.includes("trade") ||
      titleLower.includes("transaction")
    ) {
      return "/trades";
    }
    // Default to existing link if available
    else if (notification.link) {
      return notification.link;
    }
    return null;
  };

  if (!user) return null;

  return (
    <>
      <style>{`
        @keyframes bellShake {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(-8deg); }
          20% { transform: rotate(8deg); }
          30% { transform: rotate(-6deg); }
          40% { transform: rotate(6deg); }
          50% { transform: rotate(-4deg); }
          60% { transform: rotate(4deg); }
          70% { transform: rotate(-2deg); }
          80% { transform: rotate(2deg); }
          90% { transform: rotate(-1deg); }
        }
        @keyframes badgePulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
        }
        .bell-shake {
          animation: bellShake 0.6s ease-in-out;
        }
        .badge-pulse {
          animation: badgePulse 2s ease-in-out infinite;
        }
      `}</style>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`relative border border-primary/20 text-slate-700 hover:bg-secondary/10 hover:text-primary ${unreadCount > 0 ? 'bell-shake' : ''}`}
            style={unreadCount > 0 ? { animationIterationCount: 'infinite', animationDuration: '20s', animationDelay: '0s' } : {}}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs ${unreadCount > 0 ? 'badge-pulse' : ''}`}>
                {unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-1 text-xs" onClick={markAllAsRead}>
              <Check className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => {
              const link = getNotificationLink(notification);
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start p-3 cursor-pointer"
                  onClick={async () => {
                    if (!notification.read_at) {
                      await markAsRead(notification.id);
                    }
                    if (link) {
                      window.location.href = link;
                    }
                  }}
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {!notification.read_at && (
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  );
}
