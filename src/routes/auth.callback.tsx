import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          toast.error("Authentication failed. Please try again.");
          navigate({ to: "/login" });
          return;
        }

        if (data.session) {
          // Refresh auth context to get user data
          await refresh();
          
          // Check if this is a new user by checking if they have a profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.session.user.id)
            .single();
          
          const isNewUser = !profileData;
          
          // Check if email is verified
          // Existing users (created before July 21, 2026) can bypass email verification
          const userCreatedAt = data.session.user.created_at;
          const legacyCutoffDate = new Date('2026-07-21T00:00:00Z');
          const isExistingUser = userCreatedAt && new Date(userCreatedAt) < legacyCutoffDate;
          
          // New users must verify email before accessing dashboard
          if (isNewUser || (!data.session.user.email_confirmed_at && !isExistingUser)) {
            // Sign out the user
            await supabase.auth.signOut();
            
            // Send verification email
            const userEmail = data.session.user.email;
            if (userEmail) {
              await supabase.auth.resend({
                type: 'signup',
                email: userEmail,
                options: {
                  emailRedirectTo: `${window.location.origin}/verify-email`,
                },
              });
              toast.success("Please verify your email to continue. A verification email has been sent to your Google account.");
            }
            navigate({ to: "/verify-email" as any });
            return;
          }

          toast.success("Successfully signed in with Google");
          navigate({ to: "/dashboard" });
        } else {
          navigate({ to: "/login" });
        }
      } catch (error) {
        toast.error("Authentication failed. Please try again.");
        navigate({ to: "/login" });
      }
    };

    handleAuthCallback();
  }, [navigate, refresh]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
