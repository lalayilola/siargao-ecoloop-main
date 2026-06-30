import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle2, ArrowLeft, Lock } from "lucide-react";
import { getSupabaseErrorMessage } from "@/lib/supabase-error";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — EcoLoop Siargao" }] }),
  component: ResetPage,
});

function ResetPage() {
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setRecoveryMode(true);
    }
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(getSupabaseErrorMessage(error, "Failed to update password"));
        return;
      }

      setPasswordUpdated(true);
      toast.success("Password updated successfully!");
    } catch (error) {
      toast.error(getSupabaseErrorMessage(error, "Failed to update password"));
    } finally {
      setBusy(false);
    }
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(getSupabaseErrorMessage(error, "Failed to send reset email"));
        return;
      }

      toast.success("Password reset link sent! Check your inbox.");
    } catch (error) {
      toast.error(getSupabaseErrorMessage(error, "Failed to send reset email"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHero 
        title={recoveryMode ? "Set New Password" : "Reset Your Password"} 
        sub={recoveryMode ? "Enter your new password to secure your account." : "Enter your email to receive a password reset link."}
      />
      <Container className="py-12">
        <div className="mx-auto max-w-md">
          <Card className="p-6">
            {passwordUpdated ? (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-3">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Password Updated</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your password has been successfully updated. You can now sign in with your new password.
                  </p>
                </div>
                <Link to="/login">
                  <Button className="w-full">
                    Go to Sign In
                  </Button>
                </Link>
              </div>
            ) : recoveryMode ? (
              <form className="space-y-4" onSubmit={handlePasswordReset}>
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Create a strong password with at least 8 characters
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-password">New Password *</Label>
                  <div className="relative">
                    <Input 
                      id="new-password" 
                      type={showPassword ? "text" : "password"} 
                      minLength={8} 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="pr-10"
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm Password *</Label>
                  <div className="relative">
                    <Input 
                      id="confirm-password" 
                      type={showConfirmPassword ? "text" : "password"} 
                      minLength={8} 
                      required 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      className="pr-10"
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Updating..." : "Update Password"}
                </Button>

                <div className="flex items-center justify-center text-sm">
                  <Link to="/login" className="flex items-center text-muted-foreground hover:underline">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Sign In
                  </Link>
                </div>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleSendResetLink}>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="juan@example.com"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Sending..." : "Send Reset Link"}
                </Button>

                <div className="flex items-center justify-center text-sm">
                  <Link to="/login" className="flex items-center text-muted-foreground hover:underline">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </Card>
        </div>
      </Container>
    </>
  );
}
