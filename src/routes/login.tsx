import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Container } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { getSupabaseErrorMessage } from "@/lib/supabase-error";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — EcoLoop Siargao" },
      { name: "description", content: "Sign in to your EcoLoop account to access your dashboard." },
    ],
  }),
  component: LoginPage,
});

const AUTH_RATE_LIMIT_COOLDOWN_MS = 3 * 60 * 1000;
const AUTH_RATE_LIMIT_STORAGE_KEY = "ecoloop.auth.rate-limit-until";

function readStoredAuthCooldown() {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(AUTH_RATE_LIMIT_STORAGE_KEY);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed > Date.now() ? parsed : null;
}

function activateAuthCooldown() {
  const until = Date.now() + AUTH_RATE_LIMIT_COOLDOWN_MS;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_RATE_LIMIT_STORAGE_KEY, String(until));
  }
  return until;
}

function isRateLimitMessage(message: string) {
  return /rate limit|too many requests|email rate limit|rate limit exceeded|429/i.test(message);
}

function LoginPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (!user.email_confirmed_at) {
        navigate({ to: "/verify-email" as any });
      } else if (profile) {
        // Role-based redirect
        const role = profile.primary_role;
        if (role === "farmer") {
          navigate({ to: "/dashboard/farmer" });
        } else if (role === "restaurant") {
          navigate({ to: "/dashboard/restaurant" });
        } else if (role === "lgu_admin") {
          navigate({ to: "/dashboard" });
        } else {
          navigate({ to: "/dashboard" });
        }
      }
    }
  }, [user, profile, loading, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(() => readStoredAuthCooldown());
  const isCooldownActive = Boolean(cooldownUntil && cooldownUntil > Date.now());

  useEffect(() => {
    if (!cooldownUntil) return;
    if (cooldownUntil <= Date.now()) {
      if (typeof window !== "undefined") window.localStorage.removeItem(AUTH_RATE_LIMIT_STORAGE_KEY);
      setCooldownUntil(null);
      return;
    }
    const timeout = window.setTimeout(() => {
      if (typeof window !== "undefined") window.localStorage.removeItem(AUTH_RATE_LIMIT_STORAGE_KEY);
      setCooldownUntil(null);
    }, cooldownUntil - Date.now());
    return () => window.clearTimeout(timeout);
  }, [cooldownUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || isCooldownActive) {
      if (isCooldownActive) {
        toast.error("Too many requests. Please wait a few minutes and try again.");
      }
      return;
    }

    setBusy(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        const message = error.message || "";
        if (isRateLimitMessage(message)) {
          const until = activateAuthCooldown();
          setCooldownUntil(until);
          toast.error("Too many sign-in attempts. Please wait a few minutes and try again.");
        } else if (/email not confirmed|email verification/i.test(message)) {
          toast.error("Please verify your email before signing in. Check your inbox for the verification link.");
          navigate({ to: "/verify-email" as any });
        } else if (/invalid login credentials|invalid_credentials/i.test(message)) {
          toast.error("Incorrect email or password");
        } else {
          toast.error(getSupabaseErrorMessage(error, "Sign in failed"));
        }
        return;
      }

      if (data.user) {
        if (!data.user.email_confirmed_at) {
          toast.error("Please verify your email before signing in");
          navigate({ to: "/verify-email", search: { email: normalizedEmail } });
        } else {
          toast.success("Welcome back!");
        }
      }
    } catch (error) {
      toast.error(getSupabaseErrorMessage(error, "Sign in failed"));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (googleBusy) return;
    setGoogleBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(getSupabaseErrorMessage(error, "Google sign in failed"));
      }
    } catch (error) {
      toast.error(getSupabaseErrorMessage(error, "Google sign in failed"));
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <>
      <div className="min-h-screen animate-gradient">
        <Container className="py-12">
          <div className="mx-auto max-w-md text-center mb-8">
            <h1 className="font-display text-4xl font-bold text-white">Sign In to EcoLoop</h1>
            <p className="text-white/80 mt-2">Access your dashboard to manage your circular food economy activities.</p>
          </div>
        <div className="mx-auto max-w-md">
          <Card className="p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
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

              <div className="space-y-1.5">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="pr-10"
                    placeholder="Enter your password"
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

              <Button type="submit" className="w-full" disabled={busy || isCooldownActive}>
                {busy ? "Signing in..." : isCooldownActive ? "Please wait..." : "Sign In"}
              </Button>

              <div className="flex justify-between text-sm">
                <Link to="/forgot-password" className="text-muted-foreground hover:underline">
                  Forgot password?
                </Link>
              </div>

              <div className="my-5 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={googleBusy}
                onClick={handleGoogleSignIn}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {googleBusy ? "Connecting..." : "Continue with Google"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account? <Link to="/register" className="underline font-medium">Create account</Link>
              </p>
            </form>
          </Card>
        </div>
      </Container>
      </div>
      <style>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          background: linear-gradient(-45deg, #16A34A, #22C55E, #4ADE80, #86EFAC, #10B981, #16A34A);
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
        }
      `}</style>
    </>
  );
}
