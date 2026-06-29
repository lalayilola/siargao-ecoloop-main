import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/use-language";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — EcoLoop Siargao" }] }),
  component: ResetPage,
});

function ResetPage() {
  const { t } = useLanguage();
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setRecoveryMode(true);
    }
  }, []);

  return (
    <>
      <PageHero title={recoveryMode ? t("resetPassword.setNewPassword") : t("resetPassword.resetYourPassword")} />
      <Container className="py-10">
        <Card className="mx-auto max-w-md p-6">
          {recoveryMode ? (
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const { error } = await supabase.auth.updateUser({ password: pw });
                if (error) toast.error(error.message);
                else toast.success(t("resetPassword.passwordUpdated"));
              }}
            >
              <Label htmlFor="np">{t("resetPassword.newPassword")}</Label>
              <div className="relative">
                <Input id="np" type={showPassword ? "text" : "password"} minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} className="pr-10" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button type="submit" className="w-full">{t("resetPassword.updatePassword")}</Button>
            </form>
          ) : (
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                if (error) toast.error(error.message);
                else toast.success(t("resetPassword.checkInbox"));
              }}
            >
              <Label htmlFor="re">{t("resetPassword.email")}</Label>
              <Input id="re" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button type="submit" className="w-full">{t("resetPassword.sendResetLink")}</Button>
            </form>
          )}
        </Card>
      </Container>
    </>
  );
}
