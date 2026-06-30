import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import { getSupabaseErrorMessage } from "@/lib/supabase-error";

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Verify Email — EcoLoop Siargao" },
      { name: "description", content: "Verify your email address to activate your EcoLoop account." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!loading && user && user.email_confirmed_at) {
      setIsVerified(true);
      // Redirect to dashboard after 2 seconds
      const timer = setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate]);

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resending) return;

    setResending(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (error) {
        toast.error(getSupabaseErrorMessage(error, "Failed to resend verification email"));
        return;
      }

      toast.success("Verification email sent! Please check your inbox.");
    } catch (error) {
      toast.error(getSupabaseErrorMessage(error, "Failed to resend verification email"));
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHero
          eyebrow="Email Verification"
          title="Checking Verification Status..."
        />
        <Container className="py-12">
          <div className="mx-auto max-w-md text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        </Container>
      </>
    );
  }

  if (isVerified) {
    return (
      <>
        <PageHero
          eyebrow="Email Verified"
          title="Your Account is Active!"
        />
        <Container className="py-12">
          <div className="mx-auto max-w-md">
            <Card className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Email Verified Successfully</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your account has been activated. Redirecting to your dashboard...
              </p>
            </Card>
          </div>
        </Container>
      </>
    );
  }

  if (user && !user.email_confirmed_at) {
    setEmail(user.email || "");
  }

  return (
    <>
      <PageHero
        eyebrow="Email Verification"
        title="Verify Your Email"
        sub="Please check your inbox and click the verification link to activate your account."
      />
      <Container className="py-12">
        <div className="mx-auto max-w-md">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-blue-100 p-3">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Check Your Inbox</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a verification email to <strong>{user?.email || email}</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click the link in the email to activate your account.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-800">
                    <strong>Important:</strong> You must verify your email before you can sign in and access the dashboard.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <p className="text-sm text-muted-foreground text-center">
                  Didn't receive the email?
                </p>
                <form onSubmit={handleResendVerification}>
                  <div className="space-y-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="juan@example.com"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      variant="outline" 
                      className="w-full"
                      disabled={resending}
                    >
                      {resending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Resend Verification Email
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              <div className="pt-4 border-t">
                <Link to="/login">
                  <Button variant="ghost" className="w-full">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </>
  );
}
