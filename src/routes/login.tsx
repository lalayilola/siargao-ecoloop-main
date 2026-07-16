import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Container, PageHero } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { getSupabaseErrorMessage } from "@/lib/supabase-error";
import logo from "@/assets/finalogo.png";

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
      <PageHero
        eyebrow="Welcome Back"
        title="Sign In to EcoLoop"
        sub="Access your dashboard to manage your circular food economy activities."
      />
      <Container className="py-12">
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
                <img src={logo} alt="EcoLoop Siargao" className="mr-2 h-4 w-4 object-contain" />
                {googleBusy ? "Connecting..." : "Continue with Google"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account? <Link to="/register" className="underline font-medium">Create account</Link>
              </p>
            </form>
          </Card>
        </div>
      </Container>
    </>
  );
}
