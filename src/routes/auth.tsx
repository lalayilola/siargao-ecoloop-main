import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { confirmUserEmail } from "@/lib/api/auth.functions";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Leaf, Eye, EyeOff } from "lucide-react";
import { getSupabaseErrorMessage } from "@/lib/supabase-error";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or join — EcoLoop Siargao" },
      { name: "description", content: "Create your EcoLoop account or sign in to post, trade and track your barangay's circular food economy." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20),
  barangay: z.string().trim().min(2).max(80),
  address: z.string().trim().max(200).optional().default(""),
  role: z.enum(["farmer", "restaurant", "resident", "lgu_admin"]),
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

function AuthPage() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/profile", search: { userId: undefined } });
  }, [user, loading, navigate]);

  return (
    <>
      <PageHero
        eyebrow={t("auth.hero.eyebrow")}
        title={t("auth.hero.title")}
        sub={t("auth.hero.subtitle")}
      />
      <Container className="py-12">
        <div className="mx-auto max-w-md">
          <Card className="p-6">
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t("auth.signIn")}</TabsTrigger>
                <TabsTrigger value="signup">{t("auth.createAccount")}</TabsTrigger>
              </TabsList>
              <TabsContent value="login"><LoginForm /></TabsContent>
              <TabsContent value="signup"><SignupForm /></TabsContent>
            </Tabs>
            <div className="my-5 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
            </div>
            <GoogleButton />
          </Card>
        </div>
      </Container>
    </>
  );
}

function GoogleButton() {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
          if (r.error) toast.error(r.error.message || t("auth.googleSignInFailed"));
        } catch (error) {
          toast.error(getSupabaseErrorMessage(error, t("auth.googleSignInFailed")));
        } finally {
          setBusy(false);
        }
      }}
    >
      <Leaf className="mr-2 h-4 w-4" /> {t("auth.continueWithGoogle")}
    </Button>
  );
}

async function signInOrCreateAccount(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const signInResult = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
  if (!signInResult.error) {
    return { ok: true, createdAccount: false, error: null as null, reason: "signed_in" as const };
  }

  const message = signInResult.error.message || "";
  const isInvalidCredentials = /invalid login credentials|invalid_credentials|invalid_grant|auth\/invalid-credentials/i.test(message);
  const isRateLimit = isRateLimitMessage(message);

  if (!isInvalidCredentials) {
    return { ok: false, createdAccount: false, error: signInResult.error, reason: "auth_error" as const };
  }

  if (isRateLimit) {
    return { ok: false, createdAccount: false, error: signInResult.error, reason: "rate_limit" as const };
  }

  return { ok: false, createdAccount: false, error: signInResult.error, reason: "invalid_credentials" as const };
}

function LoginForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
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

  return (
    <form
      className="space-y-3 pt-4"
      onSubmit={async (e) => {
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
          const result = await signInOrCreateAccount(normalizedEmail, password);
          if (!result.ok) {
            if (result.reason === "rate_limit") {
              const until = activateAuthCooldown();
              setCooldownUntil(until);
              toast.error("Too many sign-in attempts. Please wait a few minutes and try again.");
            } else if (result.reason === "invalid_credentials") {
              toast.error("Incorrect email or password. If you do not have an account yet, please use Create account.");
            } else {
              toast.error(getSupabaseErrorMessage(result.error, t("auth.signInFailed")));
            }
          } else {
            toast.success(t("auth.welcomeBack"));
          }
        } catch (error) {
          toast.error(getSupabaseErrorMessage(error, t("auth.signInFailed")));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="li-email">{t("auth.email")}</Label>
        <Input id="li-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="li-pw">{t("auth.password")}</Label>
        <div className="relative">
          <Input id="li-pw" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
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
        {busy ? t("auth.signingIn") : isCooldownActive ? "Please wait…" : t("auth.signIn")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        <Link to="/reset-password" className="underline">{t("auth.forgotPassword")}</Link>
      </p>
    </form>
  );
}

function SignupForm() {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    barangay: "",
    address: "",
    role: "resident" as "farmer" | "restaurant" | "resident" | "lgu_admin",
    municipality: "general_luna" as "burgos" | "dapa" | "general_luna" | "pilar" | "san_benito" | "san_isidro" | "santa_monica" | "socorro" | "del_carmen",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
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

  return (
    <form
      className="space-y-3 pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy || isCooldownActive) {
          if (isCooldownActive) {
            toast.error("Too many requests. Please wait a few minutes and try again.");
          }
          return;
        }

        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? t("auth.invalidInput"));
          return;
        }

        setBusy(true);
        try {
          const normalizedEmail = parsed.data.email.toLowerCase();
          const { data, error: signupError } = await supabase.auth.signUp({
            email: normalizedEmail,
            password: parsed.data.password,
            options: {
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

          if (data?.session) {
            if (parsed.data.role === "lgu_admin") {
              toast.success(t("auth.lguAccountCreated"));
            } else {
              toast.success(t("auth.accountCreated"));
            }
            return;
          }

          if (data?.user) {
            try {
              await confirmUserEmail({ data: { userId: data.user.id } });
            } catch (err) {
              toast.error(`${t("auth.unableToConfirmEmail")}: ${err instanceof Error ? err.message : "Unknown error"}`);
              return;
            }

            const { error: loginError } = await supabase.auth.signInWithPassword({
              email: normalizedEmail,
              password: parsed.data.password,
            });
            if (loginError) {
              const message = loginError.message || "";
              if (isRateLimitMessage(message)) {
                const until = activateAuthCooldown();
                setCooldownUntil(until);
                toast.error("Too many requests. Please wait a few minutes and try again.");
              } else {
                toast.error(getSupabaseErrorMessage(loginError, `${message}${loginError.code ? ` (${loginError.code})` : ""}`));
              }
              return;
            }

            if (parsed.data.role === "lgu_admin") {
              toast.success(t("auth.lguAccountCreated"));
            } else {
              toast.success(t("auth.accountCreated"));
            }
            return;
          }

          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: parsed.data.password,
          });
          if (loginError) {
            const message = loginError.message || "";
            if (isRateLimitMessage(message)) {
              const until = activateAuthCooldown();
              setCooldownUntil(until);
              toast.error("Too many requests. Please wait a few minutes and try again.");
            } else {
              toast.error(getSupabaseErrorMessage(loginError, `${message}${loginError.code ? ` (${loginError.code})` : ""}`));
            }
            return;
          }

          if (parsed.data.role === "lgu_admin") {
            toast.success(t("auth.lguAccountCreated"));
          } else {
            toast.success(t("auth.accountCreated"));
          }
        } catch (error) {
          toast.error(getSupabaseErrorMessage(error, t("auth.signUpFailed")));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="su-name">{t("auth.fullName")}</Label>
          <Input id="su-name" required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="su-phone">{t("auth.phone")}</Label>
          <Input id="su-phone" required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-email">{t("auth.email")}</Label>
        <Input id="su-email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-pw">{t("auth.password")}</Label>
        <div className="relative">
          <Input id="su-pw" type={showPassword ? "text" : "password"} required value={form.password} onChange={(e) => set("password", e.target.value)} className="pr-10" />
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
        <Label htmlFor="su-brgy">{t("auth.barangay")}</Label>
        <Input id="su-brgy" required placeholder={t("auth.barangayPlaceholder")} value={form.barangay} onChange={(e) => set("barangay", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-addr">{t("auth.address")}</Label>
        <Input id="su-addr" value={form.address} onChange={(e) => set("address", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="su-municipality">Municipality</Label>
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
        <Label>{t("auth.iAmA")}</Label>
        <Select value={form.role} onValueChange={(v) => set("role", v as typeof form.role)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="farmer">{t("auth.farmer")}</SelectItem>
            <SelectItem value="restaurant">{t("auth.restaurant")}</SelectItem>
            <SelectItem value="resident">{t("auth.resident")}</SelectItem>
            <SelectItem value="lgu_admin">{t("auth.lguAdmin")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={busy || isCooldownActive}>
        {busy ? t("auth.creatingAccount") : isCooldownActive ? "Please wait…" : t("auth.createAccount")}
      </Button>
    </form>
  );
}
