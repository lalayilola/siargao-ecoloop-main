import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";



import { useEffect, useState } from "react";



import { z } from "zod";



import { supabase } from "@/integrations/supabase/client";



import { useAuth } from "@/hooks/use-auth";



import { useLanguage } from "@/hooks/use-language";



import { Container, PageHero } from "@/components/layout/Section";



import { Card } from "@/components/ui/card";



import { Button } from "@/components/ui/button";



import { Input } from "@/components/ui/input";



import { Label } from "@/components/ui/label";



import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";



import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";



import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";



import { toast } from "sonner";



import { Eye, EyeOff, Upload, X, AlertCircle } from "lucide-react";



import { getSupabaseErrorMessage } from "@/lib/supabase-error";



import { LocationPicker } from "@/components/auth/LocationPicker";



import logo from "@/assets/finalogo.png";







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



      <div className="min-h-screen animate-gradient">



        <Container className="py-12">



          <div className="mx-auto max-w-md text-center mb-8">



            <h1 className="font-display text-4xl font-bold text-white">{t("auth.hero.title")}</h1>



          </div>



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



          const { error } = await supabase.auth.signInWithOAuth({



            provider: 'google',



            options: {



              redirectTo: `${window.location.origin}/auth/callback`,



            },



          });



          if (error) toast.error(error.message || t("auth.googleSignInFailed"));



        } catch (error) {



          toast.error(getSupabaseErrorMessage(error, t("auth.googleSignInFailed")));



        } finally {



          setBusy(false);



        }



      }}



    >



      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">



        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>



        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>



        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>



        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>



      </svg>



      {t("auth.continueWithGoogle")}



    </Button>



  );



}







async function signInOrCreateAccount(email: string, password: string) {



  const normalizedEmail = email.trim().toLowerCase();







  const signInResult = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });



  if (!signInResult.error) {



    // Check if email is verified



    if (!signInResult.data.user?.email_confirmed_at) {



      // Sign out the user since email is not verified



      await supabase.auth.signOut();



      return { ok: false, createdAccount: false, error: new Error("Email not verified"), reason: "email_not_verified" as const };



    }



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



  const { user, profile } = useAuth();



  const navigate = useNavigate();



  const [email, setEmail] = useState("");



  const [password, setPassword] = useState("");



  const [showPassword, setShowPassword] = useState(false);



  const [busy, setBusy] = useState(false);



  const [cooldownUntil, setCooldownUntil] = useState<number | null>(() => readStoredAuthCooldown());



  const [showIdUploadModal, setShowIdUploadModal] = useState(false);



  const [governmentIdFile, setGovernmentIdFile] = useState<File | null>(null);



  const [uploadingId, setUploadingId] = useState(false);



  const [showTermsModal, setShowTermsModal] = useState(false);



  const [acceptedTerms, setAcceptedTerms] = useState(false);



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







  // Check if user needs to upload government ID



  useEffect(() => {



    if (user && profile && !profile.government_id_url) {



      setShowIdUploadModal(true);



    }



  }, [user, profile]);







  // Check if user has accepted terms



  useEffect(() => {



    if (typeof window !== "undefined") {



      const termsAccepted = window.localStorage.getItem("ecoloop.terms.accepted");



      setAcceptedTerms(termsAccepted === "true");



    }



  }, []);







  const handleIdUpload = async () => {



    if (!governmentIdFile || !user || !user.email) return;



    setUploadingId(true);



    try {



      const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "uploads";



      const fileExt = governmentIdFile.name.split('.').pop();



      const fileName = `${user.email.replace(/[@.]/g, '_')}_gov_id_${Date.now()}.${fileExt}`;



      const filePath = `valid-ids/${fileName}`;







      const { error: uploadError } = await supabase.storage



        .from(STORAGE_BUCKET)



        .upload(filePath, governmentIdFile);







      if (uploadError) {



        toast.error(`Failed to upload government ID: ${uploadError.message}`);



        return;



      }







      const { data: { publicUrl } } = supabase.storage



        .from(STORAGE_BUCKET)



        .getPublicUrl(filePath);







      const { error: updateError } = await (supabase.from("profiles") as any)



        .update({ government_id_url: publicUrl })



        .eq("id", user.id);







      if (updateError) {



        toast.error(`Failed to update profile: ${updateError.message}`);



        return;



      }







      toast.success("Government ID uploaded successfully");



      setShowIdUploadModal(false);



      setGovernmentIdFile(null);



      window.location.reload();



    } catch (error: any) {



      toast.error(`Failed to upload ID: ${error.message}`);



    } finally {



      setUploadingId(false);



    }



  };







  const handleAcceptTerms = () => {



    if (typeof window !== "undefined") {



      window.localStorage.setItem("ecoloop.terms.accepted", "true");



      setAcceptedTerms(true);



      setShowTermsModal(false);



    }



  };







  return (



    <>



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



          if (!acceptedTerms) {



            setShowTermsModal(true);



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



              } else if (result.reason === "email_not_verified") {



                toast.error("Please verify your email before signing in.");



                navigate({ to: "/verify-email" });



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







      <Dialog open={showIdUploadModal} onOpenChange={setShowIdUploadModal}>



        <DialogContent className="max-w-md">



          <DialogHeader>



            <DialogTitle className="flex items-center gap-2">



              <AlertCircle className="h-5 w-5 text-yellow-600" />



              Government ID Required



            </DialogTitle>



            <DialogDescription>



              To participate in marketplace activities, you must upload a valid government-issued ID for LGU verification.



            </DialogDescription>



          </DialogHeader>



          <div className="space-y-4 py-4">



            <div className="space-y-2">



              <Label htmlFor="gov-id-upload">Upload Government ID</Label>



              <Input



                id="gov-id-upload"



                type="file"



                accept="image/*,.pdf"



                onChange={(e) => {



                  const file = e.target.files?.[0];



                  if (file) {



                    setGovernmentIdFile(file);



                  }



                }}



              />



              {governmentIdFile && (



                <p className="text-xs text-muted-foreground">Selected: {governmentIdFile.name}</p>



              )}



            </div>



            <div className="flex gap-3">



              <Button



                onClick={handleIdUpload}



                disabled={!governmentIdFile || uploadingId}



                className="flex-1"



              >



                {uploadingId ? "Uploading..." : "Upload ID"}



              </Button>



              <Button



                variant="outline"



                onClick={() => setShowIdUploadModal(false)}



                disabled={uploadingId}



              >



                Skip for now



              </Button>



            </div>



            <p className="text-xs text-muted-foreground">



              Note: You will not be able to create listings, buy products, or participate in marketplace transactions until your ID is verified by the LGU.



            </p>



          </div>



        </DialogContent>



      </Dialog>







      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>



        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">



          <DialogHeader>



            <DialogTitle>Terms and Conditions</DialogTitle>



            <DialogDescription>



              Please	read and accept our terms and conditions to continue.



            </DialogDescription>



          </DialogHeader>



          <div className="space-y-4 py-4 text-sm">



            <div className="space-y-2">



              <h4 className="font-semibold">1. Acceptance of Terms</h4>



              <p className="text-muted-foreground">



                By accessing and using EcoLoop Siargao, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform.



              </p>



            </div>



            <div className="space-y-2">



              <h4 className="font-semibold">2. User Responsibilities</h4>



              <p className="text-muted-foreground">



                Users must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.



              </p>



            </div>



            <div className="space-y-2">



              <h4 className="font-semibold">3. Marketplace Activities</h4>



              <p className="text-muted-foreground">



                Farmers, restaurants, and residents must comply with all local regulations regarding food safety and waste management. All listings must be accurate and truthful.



              </p>



            </div>



            <div className="space-y-2">



              <h4 className="font-semibold">4. Prohibited Activities</h4>



              <p className="text-muted-foreground">



                Users may not engage in fraudulent activities, misrepresent products, or violate any applicable laws. The platform reserves the right to suspend or terminate accounts that violate these terms.



              </p>



            </div>



            <div className="space-y-2">



              <h4 className="font-semibold">5. Privacy and Data</h4>



              <p className="text-muted-foreground">



                Your personal information will be processed in accordance with our Privacy Policy. By using EcoLoop, you consent to the collection and use of your data as described.



              </p>



            </div>



            <div className="space-y-2">



              <h4 className="font-semibold">6. LGU Verification</h4>



              <p className="text-muted-foreground">



                Certain activities may require verification by your Local Government Unit. You agree to provide valid government-issued identification when requested.



              </p>



            </div>



            <div className="space-y-2">



              <h4 className="font-semibold">7. Modifications</h4>



              <p className="text-muted-foreground">



                EcoLoop reserves the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the modified terms.



              </p>



            </div>



          </div>



          <div className="flex gap-3">



            <Button



              onClick={handleAcceptTerms}



              className="flex-1"



            >



              I Accept



            </Button>



            <Button



              variant="outline"



              onClick={() => setShowTermsModal(false)}



              className="flex-1"



            >



              Decline



            </Button>



          </div>



        </DialogContent>



      </Dialog>



    </>



  );



}







function SignupForm() {



  const { t } = useLanguage();



  const navigate = useNavigate();



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



  const [showTermsModal, setShowTermsModal] = useState(false);



  const [acceptedTerms, setAcceptedTerms] = useState(false);



  const isCooldownActive = Boolean(cooldownUntil && cooldownUntil > Date.now());







  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));







  const handleAcceptTerms = () => {



    if (typeof window !== "undefined") {



      window.localStorage.setItem("ecoloop.terms.accepted", "true");



      setAcceptedTerms(true);



      setShowTermsModal(false);



    }



  };







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



    <>



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







        if (!acceptedTerms) {



          setShowTermsModal(true);



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



          console.log("Attempting signup for:", normalizedEmail);



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



              emailRedirectTo: `${window.location.origin}/verify-email`,



            },



          });







          console.log("Signup result:", { data, error: signupError });







          if (signupError) {



            const message = signupError.message || String(signupError);



            console.error("Signup error:", message);



            if (isRateLimitMessage(message)) {



              const until = activateAuthCooldown();



              setCooldownUntil(until);



              toast.error("Too many sign-up attempts. Please wait a few minutes and try again.");



            } else {



              toast.error(getSupabaseErrorMessage(signupError, message));



            }



            return;



          }







          // Email verification required - redirect to verification page



          if (data?.user && !data.session) {



            console.log("User created, email verification required");



            toast.success("Account created! Please check your email to verify your account.");



            navigate({ to: "/verify-email" });



            return;



          }







          // If session exists (auto-sign-in), still require verification



          if (data?.session) {



            console.log("Session created, but email verification required");



            toast.success("Account created! Please check your email to verify your account.");



            navigate({ to: "/verify-email" });



            return;



          }







          console.error("Unexpected signup state");



          toast.error("Unable to create account. Please try again.");



        } catch (error) {



          console.error("Signup exception:", error);



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







    <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>



      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">



        <DialogHeader>



          <DialogTitle>Terms and Conditions</DialogTitle>



          <DialogDescription>



            Please read and accept our terms and conditions to continue.



          </DialogDescription>



        </DialogHeader>



        <div className="space-y-4 py-4 text-sm">



          <div className="space-y-2">



            <h4 className="font-semibold">1. Acceptance of Terms</h4>



            <p className="text-muted-foreground">



              By accessing and using EcoLoop Siargao, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform.



            </p>



          </div>



          <div className="space-y-2">



            <h4 className="font-semibold">2. User Responsibilities</h4>



            <p className="text-muted-foreground">



              Users must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.



            </p>



          </div>



          <div className="space-y-2">



            <h4 className="font-semibold">3. Marketplace Activities</h4>



            <p className="text-muted-foreground">



              Farmers, restaurants, and residents must comply with all local regulations regarding food safety and waste management. All listings must be accurate and truthful.



            </p>



          </div>



          <div className="space-y-2">



            <h4 className="font-semibold">4. Prohibited Activities</h4>



            <p className="text-muted-foreground">



              Users may not engage in fraudulent activities, misrepresent products, or violate any applicable laws. The platform reserves the right to suspend or terminate accounts that violate these terms.



            </p>



          </div>



          <div className="space-y-2">



            <h4 className="font-semibold">5. Privacy and Data</h4>



            <p className="text-muted-foreground">



              Your personal information will be processed in accordance with our Privacy Policy. By using EcoLoop, you consent to the collection and use of your data as described.



            </p>



          </div>



          <div className="space-y-2">



            <h4 className="font-semibold">6. LGU Verification</h4>



            <p className="text-muted-foreground">



              Certain activities may require verification by your Local Government Unit. You agree to provide valid government-issued identification when requested.



            </p>



          </div>



          <div className="space-y-2">



            <h4 className="font-semibold">7. Modifications</h4>



            <p className="text-muted-foreground">



              EcoLoop reserves the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the modified terms.



            </p>



          </div>



        </div>



        <div className="flex gap-3">



          <Button



            onClick={handleAcceptTerms}



            className="flex-1"



          >



            I Accept



          </Button>



          <Button



            variant="outline"



            onClick={() => setShowTermsModal(false)}



            className="flex-1"



          >



            Decline



          </Button>



        </div>



      </DialogContent>



    </Dialog>



    </>



  );



}



