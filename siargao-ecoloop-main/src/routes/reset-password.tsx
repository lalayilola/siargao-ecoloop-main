import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — EcoLoop Siargao" }] }),
  component: ResetPage,
});

function ResetPage() {
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setRecoveryMode(true);
    }
  }, []);

  return (
    <>
      <PageHero title={recoveryMode ? "Set a new password" : "Reset your password"} />
      <Container className="py-10">
        <Card className="mx-auto max-w-md p-6">
          {recoveryMode ? (
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const { error } = await supabase.auth.updateUser({ password: pw });
                if (error) toast.error(error.message);
                else toast.success("Password updated. You can now sign in.");
              }}
            >
              <Label htmlFor="np">New password</Label>
              <Input id="np" type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} />
              <Button type="submit" className="w-full">Update password</Button>
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
                else toast.success("Check your inbox for the reset link.");
              }}
            >
              <Label htmlFor="re">Email</Label>
              <Input id="re" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button type="submit" className="w-full">Send reset link</Button>
            </form>
          )}
        </Card>
      </Container>
    </>
  );
}
