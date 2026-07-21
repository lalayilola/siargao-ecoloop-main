import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    
    // Check if email is verified
    // Existing users (created before July 21, 2026) can bypass email verification
    const userCreatedAt = data.user.created_at;
    const legacyCutoffDate = new Date('2026-07-21T00:00:00Z');
    const isExistingUser = userCreatedAt && new Date(userCreatedAt) < legacyCutoffDate;
    
    if (!data.user.email_confirmed_at && !isExistingUser) {
      throw redirect({ to: "/verify-email" as any });
    }
    
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-border/60 bg-background/85 px-3 backdrop-blur">
            <SidebarTrigger />
            <span className="text-sm font-medium text-muted-foreground">Members area</span>
          </header>
          <main className="flex-1 overflow-hidden">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
