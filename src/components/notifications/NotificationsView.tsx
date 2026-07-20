import { useEffect, useState } from "react";
import { Container, PageHero, PremiumHero } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Trash2, MessageCircle, ShoppingCart, Leaf, Award } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export function NotificationsView() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Unable to load notifications.");
        console.error("Error loading notifications:", error);
        return;
      }

      setNotifications(data ?? []);
    };

    void loadNotifications();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("id", notificationId);

    if (error) {
      toast.error("Failed to mark notification as read");
      console.error(error);
      return;
    }

    setNotifications((current) =>
      current.map((n) => (n.id === notificationId ? { ...n, read_at: now } : n))
    );
  };

  const markAllAsRead = async () => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("user_id", user?.id)
      .is("read_at", null);

    if (error) {
      toast.error("Failed to mark all notifications as read");
      console.error(error);
      return;
    }

    setNotifications((current) => current.map((n) => ({ ...n, read_at: now })));
    toast.success("All notifications marked as read");
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      toast.error("Failed to delete notification");
      console.error(error);
      return;
    }

    setNotifications((current) => current.filter((n) => n.id !== notificationId));
    toast.success("Notification deleted");
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "trade_request":
      case "purchase_request":
        return <ShoppingCart className="h-5 w-5" />;
      case "waste_collection":
      case "compost_request":
        return <Leaf className="h-5 w-5" />;
      case "announcement":
        return <Bell className="h-5 w-5" />;
      default:
        return <MessageCircle className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "trade_request":
      case "purchase_request":
        return "bg-green-500/10 text-green-600";
      case "waste_collection":
        return "bg-blue-500/10 text-blue-600";
      case "compost_request":
        return "bg-amber-500/10 text-amber-600";
      case "announcement":
        return "bg-purple-500/10 text-purple-600";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <>
      <PremiumHero
        title="Notifications"
        sub="Stay updated on your activities, requests, and community interactions."
      />
      <Container className="py-12">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <span className="font-semibold">
              {unreadCount > 0 && `${unreadCount} unread`}
            </span>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="border-primary/40 text-primary hover:bg-primary/10"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card className="p-6 text-center border-2 border-primary/20 bg-secondary/10">
            <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No notifications yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 border-2 bg-gradient-to-br from-white to-secondary/10 transition-all ${
                  !notification.read_at ? "border-primary/40" : "border-primary/20"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-900">{notification.title}</p>
                      {!notification.read_at && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{notification.message}</p>
                    {notification.link ? (
                      <a href={notification.link} className="text-sm text-primary underline">
                        View details
                      </a>
                    ) : null}
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!notification.read_at && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(notification.id)}
                        className="h-8 w-8"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNotification(notification.id)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
