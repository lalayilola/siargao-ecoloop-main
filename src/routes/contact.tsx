import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Container, PageHero } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — EcoLoop Siargao" },
      { name: "description", content: "Get in touch with the EcoLoop Siargao team — LGU partnerships, community rollouts, media and general questions." },
      { property: "og:title", content: "Contact EcoLoop Siargao" },
      { property: "og:description", content: "We'd love to hear from you. Reach the EcoLoop team here." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);
  return (
    <>
      <PageHero
        eyebrow={t("contact.hero.eyebrow")}
        title={t("contact.hero.title")}
        sub={t("contact.hero.subtitle")}
      />
      <Container className="grid gap-8 py-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">{t("contact.email")}</div>
                <div className="text-sm text-muted-foreground">hello@ecoloopsiargao.ph</div>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">{t("contact.phone")}</div>
                <div className="text-sm text-muted-foreground">+63 917 555 0123</div>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold">{t("contact.office")}</div>
                <div className="text-sm text-muted-foreground">Tourism Road, General Luna, Siargao Island</div>
              </div>
            </div>
          </Card>
        </div>
        <Card className="p-8">
          {sent ? (
            <div className="grid place-items-center py-10 text-center">
              <CheckCircle2 className="h-10 w-10 text-primary" />
              <h3 className="mt-3 font-display text-xl font-semibold">{t("contact.messageSent")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("contact.messageSentDesc")}</p>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <h2 className="font-display text-xl font-semibold">{t("contact.sendUsMessage")}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">{t("contact.name")}</Label>
                  <Input id="name" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t("contact.email")}</Label>
                  <Input id="email" type="email" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject">{t("contact.subject")}</Label>
                <Input id="subject" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="msg">{t("contact.message")}</Label>
                <Textarea id="msg" rows={5} required />
              </div>
              <Button type="submit" className="rounded-full" size="lg">{t("contact.sendMessage")}</Button>
              <p className="text-xs text-muted-foreground">{t("contact.demoForm")}</p>
            </form>
          )}
        </Card>
      </Container>
    </>
  );
}
