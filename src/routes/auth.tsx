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
import { Leaf } from "lucide-react";

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
});

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
        const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
        if (r.error) toast.error(r.error.message || t("auth.googleSignInFailed"));
        setBusy(false);
      }}
    >
      <Leaf className="mr-2 h-4 w-4" /> {t("auth.continueWithGoogle")}
    </Button>
  );
}

function LoginForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-3 pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const normalizedEmail = email.trim().toLowerCase();
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        setBusy(false);
        if (error) toast.error(`${error.message}${error.code ? ` (${error.code})` : ""}`);
        else toast.success(t("auth.welcomeBack"));
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="li-email">{t("auth.email")}</Label>
        <Input id="li-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="li-pw">{t("auth.password")}</Label>
        <Input id="li-pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? t("auth.signingIn") : t("auth.signIn")}
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
  });
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      className="space-y-3 pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? t("auth.invalidInput"));
          return;
        }
        setBusy(true);
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
            },
          },
        });

        if (signupError) {
          toast.error(`${signupError.message}${signupError.code ? ` (${signupError.code})` : ""}`);
          setBusy(false);
          return;
        }

        if (data?.session) {
          setBusy(false);
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
            setBusy(false);
            return;
          }

          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: parsed.data.password,
          });
          if (loginError) {
            toast.error(`${loginError.message}${loginError.code ? ` (${loginError.code})` : ""}`);
            setBusy(false);
            return;
          }

          setBusy(false);
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
          toast.error(`${loginError.message}${loginError.code ? ` (${loginError.code})` : ""}`);
          setBusy(false);
          return;
        }

        setBusy(false);
        if (parsed.data.role === "lgu_admin") {
          toast.success(t("auth.lguAccountCreated"));
        } else {
          toast.success(t("auth.accountCreated"));
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
        <Input id="su-pw" type="password" required value={form.password} onChange={(e) => set("password", e.target.value)} />
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
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? t("auth.creatingAccount") : t("auth.createAccount")}
      </Button>
    </form>
  );
}
