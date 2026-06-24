import { createFileRoute, Link } from "@tanstack/react-router";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ClipboardList, Handshake, Truck, BarChart3 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — EcoLoop Siargao" },
      { name: "description", content: "Four simple steps: post, match, exchange, and track. See how EcoLoop turns waste into harvest." },
      { property: "og:title", content: "How EcoLoop Siargao works" },
      { property: "og:description", content: "Post, match, exchange, track — the circular loop in four steps." },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  { icon: ClipboardList, titleKey: "howItWorks.steps.post", bodyKey: "howItWorks.steps.postDesc" },
  { icon: Handshake, titleKey: "howItWorks.steps.match", bodyKey: "howItWorks.steps.matchDesc" },
  { icon: Truck, titleKey: "howItWorks.steps.exchange", bodyKey: "howItWorks.steps.exchangeDesc" },
  { icon: BarChart3, titleKey: "howItWorks.steps.track", bodyKey: "howItWorks.steps.trackDesc" },
];

function HowItWorks() {
  const { t } = useLanguage();

  return (
    <>
      <PageHero
        eyebrow={t("howItWorks.hero.eyebrow")}
        title={t("howItWorks.hero.title")}
        sub={t("howItWorks.hero.subtitle")}
      />
      <Container className="py-16">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <Card key={s.titleKey} className="p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{t(s.titleKey)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(s.bodyKey)}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-12 p-8">
          <h2 className="font-display text-2xl font-semibold">{t("howItWorks.example.title")}</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-primary">{t("howItWorks.example.monday")}</div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("howItWorks.example.mondayDesc")}
              </p>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-primary">{t("howItWorks.example.tuesday")}</div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("howItWorks.example.tuesdayDesc")}
              </p>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-primary">{t("howItWorks.example.friday")}</div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("howItWorks.example.fridayDesc")}
              </p>
            </div>
          </div>
        </Card>

        <div className="mt-10 flex justify-center">
          <Button asChild size="lg" className="rounded-full">
            <Link to="/auth">{t("howItWorks.example.startPost")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </Container>
    </>
  );
}
