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
} from "@/components/ui/sidebar";
import { Leaf, LayoutDashboard, Newspaper, Store, Calendar, ArrowLeftRight, User as UserIcon, LogOut, Home, MessageCircle, Sprout, TreePine, Recycle, Bell, Megaphone, FileText, Package, ShoppingCart, History } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";

const memberItems = [
  { to: "/marketplace", label: "Marketplace", icon: Store },
  { to: "/requests", label: "My Requests", icon: ArrowLeftRight },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
];

const farmerItems = [
  { to: "/orders", label: "Orders", icon: ShoppingCart },
];

const hotelItems = [
  { to: "/dashboard/hotel", label: "Dashboard", icon: LayoutDashboard },
  { to: "/marketplace", label: "Produce Marketplace", icon: Store },
  { to: "/waste-reports", label: "Waste Reports", icon: Recycle },
  { to: "/waste-collections", label: "Collections", icon: Calendar },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/feed", label: "News Feed", icon: Newspaper },
];

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { profile, isLguAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isActive = (p: string) => path === p;

  const isFarmer = profile?.primary_role === "farmer";
  const isHotel = profile?.primary_role === "hotel_restaurant";

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
          <Link to="/" className="flex items-center gap-3 rounded-b-3xl relative z-10">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-green-600 text-white shadow-lg animate-pulse">
              <Leaf className="h-6 w-6" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-slate-800 group-data-[collapsible=icon]:hidden animate-bounce">
              EcoLoop <span className="text-primary">Siargao</span>
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
              {memberItems.map((it) => (
                <SidebarMenuItem key={it.to}>
                  <SidebarMenuButton asChild isActive={isActive(it.to)}>
                    <Link to={it.to} className="flex items-center gap-3 rounded-full px-3 py-2 text-slate-800 transition hover:bg-green-100 hover:text-green-700">
                      <it.icon className="h-4 w-4" />
                      <span>{it.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
                    <Link to="/dashboard" className="flex items-center gap-3 rounded-full px-3 py-2 text-slate-800 transition hover:bg-green-100 hover:text-green-700">
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard-diversion")}>
                    <Link to="/dashboard-diversion" className="flex items-center gap-3 rounded-full px-3 py-2 text-slate-800 transition hover:bg-green-100 hover:text-green-700">
                      <Recycle />
                      <span>Transactions Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard-users")}>
                    <Link to="/dashboard-users" className="flex items-center gap-3 rounded-full px-3 py-2 text-slate-800 transition hover:bg-green-100 hover:text-green-700">
                      <UserIcon />
                      <span>Members Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard-announcements")}>
                    <Link to="/dashboard-announcements" className="flex items-center gap-3 rounded-full px-3 py-2 text-slate-800 transition hover:bg-green-100 hover:text-green-700">
                      <Megaphone />
                      <span>Announcements</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard-reports")}>
                    <Link to="/dashboard-reports" className="flex items-center gap-3 rounded-full px-3 py-2 text-slate-800 transition hover:bg-green-100 hover:text-green-700">
                      <FileText />
                      <span>Reports</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isFarmer && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-green-700 font-semibold">Farmer Portal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {farmerItems.map((it) => (
                  <SidebarMenuItem key={it.to}>
                    <SidebarMenuButton asChild isActive={isActive(it.to)}>
                      <Link to={it.to} className="flex items-center gap-3 rounded-full px-3 py-2 text-slate-800 transition hover:bg-green-100 hover:text-green-700">
                        <it.icon className="h-4 w-4" />
                        <span>{it.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isHotel && hotelItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-green-700 font-semibold">Hotel Portal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {hotelItems.map((it) => (
                  <SidebarMenuItem key={it.to}>
                    <SidebarMenuButton asChild isActive={isActive(it.to)}>
                      <Link to={it.to} className="flex items-center gap-3 rounded-full px-3 py-2 text-slate-800 transition hover:bg-green-100 hover:text-green-700">
                        <it.icon className="h-4 w-4" />
                        <span>{it.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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
    </Sidebar>
  );
}
