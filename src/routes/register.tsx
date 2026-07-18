import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Container, PageHero } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Eye, EyeOff, Upload, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { getSupabaseErrorMessage } from "@/lib/supabase-error";
import logo from "@/assets/finalogo.png";

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

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Account — EcoLoop Siargao" },
      { name: "description", content: "Register for EcoLoop Siargao to join the circular food economy." },
    ],
  }),
  component: RegisterPage,
});

const signupSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
  confirmPassword: z.string().min(8, "Min 8 characters").max(72),
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20),
  barangay: z.string().trim().min(2).max(80),
  address: z.string().trim().max(200).optional().default(""),
  role: z.enum(["farmer", "restaurant", "lgu_admin"]),
  municipality: z.enum(["burgos", "dapa", "general_luna", "pilar", "san_benito", "san_isidro", "santa_monica", "socorro", "del_carmen"]),
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

function RegisterPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (!user.email_confirmed_at) {
        navigate({ to: "/verify-email" as any });
      } else {
        navigate({ to: "/dashboard" });
      }
    }
  }, [user, loading, navigate]);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    phone: "",
    barangay: "",
    address: "",
    role: "farmer" as "farmer" | "restaurant" | "lgu_admin",
    municipality: "general_luna" as "burgos" | "dapa" | "general_luna" | "pilar" | "san_benito" | "san_isidro" | "santa_monica" | "socorro" | "del_carmen",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(() => readStoredAuthCooldown());
  const isCooldownActive = Boolean(cooldownUntil && cooldownUntil > Date.now());

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

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

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setBusy(true);
    try {
      const normalizedEmail = parsed.data.email.toLowerCase();
      
      const { data, error: signupError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
          data: {
            full_name: parsed.data.full_name,
            phone: parsed.data.phone,
            barangay: parsed.data.barangay,
            address: parsed.data.address,
            role: parsed.data.role,
            municipality: parsed.data.municipality,
          },
        },
      });

      if (signupError) {
        const message = signupError.message || String(signupError);
        if (isRateLimitMessage(message)) {
          const until = activateAuthCooldown();
          setCooldownUntil(until);
          toast.error("Too many sign-up attempts. Please wait a few minutes and try again.");
        } else {
          toast.error(getSupabaseErrorMessage(signupError, message));
        }
        return;
      }

      if (data?.user && !data.session) {
        toast.success("Registration successful! Please check your email to verify your account.");
        navigate({ to: "/verify-email" as any });
      } else if (data?.session) {
        toast.success("Account created successfully!");
        navigate({ to: "/dashboard" });
      }
    } catch (error) {
      toast.error(getSupabaseErrorMessage(error, "Sign up failed"));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignUp = async () => {
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
        toast.error(getSupabaseErrorMessage(error, "Google sign up failed"));
      }
    } catch (error) {
      toast.error(getSupabaseErrorMessage(error, "Google sign up failed"));
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Join EcoLoop"
        title="Create Your Account"
        sub="Register to start trading, buying, and contributing to Siargao's circular food economy."
      />
      <Container className="py-12">
        <div className="mx-auto max-w-md">
          <Card className="p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input 
                    id="full_name" 
                    required 
                    value={form.full_name} 
                    onChange={(e) => set("full_name", e.target.value)} 
                    placeholder="Juan Dela Cruz"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input 
                    id="phone" 
                    required 
                    value={form.phone} 
                    onChange={(e) => set("phone", e.target.value)} 
                    placeholder="09123456789"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  value={form.email} 
                  onChange={(e) => set("email", e.target.value)} 
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
                    value={form.password} 
                    onChange={(e) => set("password", e.target.value)} 
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
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"} 
                    required 
                    value={form.confirmPassword} 
                    onChange={(e) => set("confirmPassword", e.target.value)} 
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

              <div className="space-y-1.5">
                <Label htmlFor="barangay">Barangay *</Label>
                <Input 
                  id="barangay" 
                  required 
                  placeholder="e.g., Barangay 1" 
                  value={form.barangay} 
                  onChange={(e) => set("barangay", e.target.value)} 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  value={form.address} 
                  onChange={(e) => set("address", e.target.value)} 
                  placeholder="Street address (optional)"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="municipality">Municipality *</Label>
                <Select value={form.municipality} onValueChange={(v) => set("municipality", v as typeof form.municipality)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="burgos">Burgos</SelectItem>
                    <SelectItem value="dapa">Dapa</SelectItem>
                    <SelectItem value="general_luna">General Luna</SelectItem>
                    <SelectItem value="pilar">Pilar</SelectItem>
                    <SelectItem value="san_benito">San Benito</SelectItem>
                    <SelectItem value="san_isidro">San Isidro</SelectItem>
                    <SelectItem value="santa_monica">Santa Monica</SelectItem>
                    <SelectItem value="socorro">Socorro</SelectItem>
                    <SelectItem value="del_carmen">Del Carmen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role">I am a *</Label>
                <Select value={form.role} onValueChange={(v) => set("role", v as typeof form.role)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farmer">Farmer</SelectItem>
                    <SelectItem value="restaurant">Hotel/Restaurant</SelectItem>
                    <SelectItem value="lgu_admin">LGU Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={busy || isCooldownActive}>
                {busy ? "Creating account..." : isCooldownActive ? "Please wait..." : "Create Account"}
              </Button>

              <div className="my-5 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={googleBusy}
                onClick={handleGoogleSignUp}
              >
                <img src={logo} alt="EcoLoop Siargao" className="mr-2 h-4 w-4 object-contain" style={{ animation: 'bounce 1s ease-in-out infinite' }} />
                {googleBusy ? "Connecting..." : "Continue with Google"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account? <Link to="/login" className="underline font-medium">Sign in</Link>
              </p>
            </form>
          </Card>
        </div>
      </Container>
      <style>{bounceAnimation}</style>
    </>
  );
}
