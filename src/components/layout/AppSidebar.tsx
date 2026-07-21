import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Newspaper, Store, Calendar, ArrowLeftRight, User as UserIcon, LogOut, Home, MessageCircle, Sprout, TreePine, Recycle, Bell, Megaphone, FileText, Package, ShoppingCart, History } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import logo from "@/assets/finalogo.png";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const bounceAnimation = `
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;

const memberItems = [
  { to: "/marketplace", label: "Marketplace", icon: Store },
  { to: "/planning", label: "Planning & Forecast", icon: Calendar },
  { to: "/requests", label: "Transactions", icon: ArrowLeftRight },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
];

const farmerItems: Array<{ to: string; label: string; icon: any }> = [];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { profile, isLguAdmin, signOut, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile, setOpenMobile } = useSidebar();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);

  const isActive = (p: string) => path === p;

  const isFarmer = profile?.primary_role === "farmer";

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Load unread message count
    const loadUnreadMessages = async () => {
      const { data: convData } = await supabase
        .from("conversations")
        .select(`
          messages (
            id,
            sender_id,
            read_at
          )
        `)
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`);

      let unreadCount = 0;
      if (convData) {
        for (const conv of convData) {
          const unreadInConv = conv.messages?.filter((m: any) => 
            m.sender_id !== user.id && !m.read_at
          ).length || 0;
          unreadCount += unreadInConv;
        }
      }
      setUnreadMessages(unreadCount);
    };

    // Load unread announcement count
    const loadUnreadAnnouncements = async () => {
      const { data: announcements } = await supabase
        .from("announcements")
        .select("id, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (!announcements) {
        setUnreadAnnouncements(0);
        return;
      }

      // Get read announcement IDs from localStorage
      const readAnnouncements = JSON.parse(localStorage.getItem(`read_announcements_${user.id}`) || '[]');
      const unreadCount = announcements.filter((a: any) => !readAnnouncements.includes(a.id)).length;
      setUnreadAnnouncements(unreadCount);
    };

    loadUnreadMessages();
    loadUnreadAnnouncements();

    // Set up real-time subscription for messages
    const messagesChannel = supabase
      .channel("messages-sidebar")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          loadUnreadMessages();
        }
      )
      .subscribe();

    // Set up real-time subscription for announcements
    const announcementsChannel = supabase
      .channel("announcements-sidebar")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
        },
        () => {
          loadUnreadAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(announcementsChannel);
    };
  }, [user]);

  // Mark messages as read when visiting messages page
  useEffect(() => {
    if (path === "/messages" && unreadMessages > 0) {
      // The MessagesView component handles marking messages as read
      setUnreadMessages(0);
    }
  }, [path, unreadMessages]);

  // Mark announcements as read when visiting announcements page
  useEffect(() => {
    if (path === "/announcements" && unreadAnnouncements > 0 && user) {
      // Mark all current announcements as read
      const markAnnouncementsAsRead = async () => {
        const { data: announcements } = await supabase
          .from("announcements")
          .select("id")
          .eq("status", "published");

        if (announcements) {
          const announcementIds = announcements.map((a: any) => a.id);
          const readAnnouncements = JSON.parse(localStorage.getItem(`read_announcements_${user.id}`) || '[]');
          const updatedReadAnnouncements = [...new Set([...readAnnouncements, ...announcementIds])];
          localStorage.setItem(`read_announcements_${user.id}`, JSON.stringify(updatedReadAnnouncements));
          setUnreadAnnouncements(0);
        }
      };
      markAnnouncementsAsRead();
    }
  }, [path, unreadAnnouncements, user]);

  return (
    <Sidebar collapsible="icon" className="border-r-2 border-primary/20 bg-gradient-to-b from-primary/10 via-white/90 to-secondary/10 shadow-inner">
      <SidebarHeader className="border-b-2 border-primary/20 bg-white/95 relative overflow-hidden">
        <div className="absolute top-2 right-2 opacity-20 animate-float">
          <TreePine className="h-8 w-8 text-primary" />
        </div>
        <div className="absolute bottom-2 right-8 opacity-15 animate-float-delayed">
          <Sprout className="h-6 w-6 text-primary" />
        </div>
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/" onClick={handleLinkClick} className="flex items-center gap-3 rounded-b-3xl relative z-10">
            <img src={logo} alt="Siargao EcoLoop" className="h-16 w-16 object-contain" style={{ animation: 'bounce 1s ease-in-out infinite' }} />
            <span className="font-display text-xl font-bold tracking-tight text-slate-800 group-data-[collapsible=icon]:hidden">
              Siargao <span className="text-primary">EcoLoop</span>
            </span>
          </Link>
          <NotificationBell />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-green-700 font-semibold tracking-wide">Community</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {memberItems.map((it) => {
                const unreadCount = it.to === "/messages" ? unreadMessages : 
                                   it.to === "/announcements" ? unreadAnnouncements : 0;
                return (
                  <SidebarMenuItem key={it.to}>
                    <SidebarMenuButton asChild isActive={isActive(it.to)}>
                      <Link to={it.to} onClick={handleLinkClick} className="flex items-center gap-3 rounded-full px-3 py-2 text-slate-800 transition hover:bg-green-100 hover:text-green-700">
                        <it.icon className="h-4 w-4" />
                        <span>{it.label}</span>
                        {unreadCount > 0 && (
                          <Badge className="ml-auto bg-slate-500 text-white hover:bg-slate-600 text-xs h-5 min-w-[20px] flex items-center justify-center px-1.5">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isLguAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-green-700 font-semibold">LGU Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                    <Link to="/dashboard" onClick={handleLinkClick} className="flex items-center gap-3 rounded-full px-3 py-2 text-slate-800 transition hover:bg-green-100 hover:text-green-700">
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard-users")}>
                    <Link to="/dashboard-users" onClick={handleLinkClick} className="flex items-center gap-3 rounded-full px-3 py-2 text-slate-800 transition hover:bg-green-100 hover:text-green-700">
                      <UserIcon />
                      <span>Members Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard-reports")}>
                    <Link to="/dashboard-reports" onClick={handleLinkClick} className="flex items-center gap-3 rounded-full px-3 py-2 text-slate-800 transition hover:bg-green-100 hover:text-green-700">
                      <FileText />
                      <span>Reports</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-700 font-semibold">Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/profile")}>
                  <Link to="/profile" search={{ userId: undefined }} className="flex items-center gap-3 rounded-full px-3 py-2 text-slate-800 transition hover:bg-green-100 hover:text-green-700">
                    <UserIcon />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/" className="flex items-center gap-3 rounded-full px-3 py-2 text-slate-800 transition hover:bg-green-100 hover:text-green-700">
                    <Home />
                    <span>Back to site</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t-2 border-primary/15 bg-white/95">
        <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
          {profile && (
            <div className="rounded-3xl bg-gradient-to-r from-primary/15 to-secondary/10 p-3 text-xs border border-primary/20 flex items-center gap-3 shadow-sm shadow-primary/10">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/10 flex-shrink-0 border-2 border-primary/40 shadow-md">
                {profile.profile_picture_url ? (
                  <img src={profile.profile_picture_url} alt={profile.full_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center font-semibold text-primary">
                    {profile.full_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-slate-900">{profile.full_name || "EcoLoop member"}</div>
                <div className="text-slate-500 truncate text-xs">
                  {profile.primary_role === "lgu_admin"
                    ? profile.lgu_approved ? "LGU Admin" : "LGU Admin (pending)"
                    : profile.primary_role.charAt(0).toUpperCase() + profile.primary_role.slice(1)}
                </div>
              </div>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2 text-slate-700 hover:bg-primary/20 hover:text-primary"
          onClick={async () => {
            navigate({ to: "/", replace: true });
            await queryClient.cancelQueries();
            queryClient.clear();
            await signOut();
          }}
        >
          <LogOut className="h-4 w-4" />
          <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
        </Button>
      </SidebarFooter>
      <style>{bounceAnimation}</style>
    </Sidebar>
  );
}
