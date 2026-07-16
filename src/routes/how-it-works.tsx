import { createFileRoute, Link } from "@tanstack/react-router";
import { Container, PageHero } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ClipboardList, Handshake, Truck, BarChart3 } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import hero from "@/assets/homepage1.jpg";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — EcoLoop Siargao" },
      { name: "description", content: "Four simple steps: post, match, exchange, and track. See how EcoLoop connects farmers, restaurants, and LGUs in a circular economy." },
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
      {/* Hero Section with Background */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0">
          <img src={hero} alt="" width={1600} height={1024} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <Container className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-3xl font-semibold sm:text-4xl text-white">{t("howItWorks.hero.eyebrow")}</h1>
            <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl text-white">{t("howItWorks.hero.title")}</h2>
            <p className="mt-4 text-lg text-white/90">
              {t("howItWorks.hero.subtitle")}
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-16">
        {/* Steps Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, index) => (
            <Card key={s.titleKey} className="p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-primary/20">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  <s.icon className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-primary mb-1">0{index + 1}</div>
                  <h3 className="font-display text-xl font-semibold">{t(s.titleKey)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(s.bodyKey)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Example Section */}
        <Card className="mt-16 p-10 bg-gradient-to-br from-secondary/30 to-background">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-semibold">{t("howItWorks.example.title")}</h2>
            <div className="mt-4 h-1 w-24 bg-gradient-to-r from-primary to-transparent mx-auto rounded-full" />
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="relative">
              <div className="absolute -left-4 top-0 text-6xl font-bold text-primary/10 font-display">M</div>
              <div className="relative">
                <div className="text-sm font-bold uppercase tracking-wider text-primary mb-3">{t("howItWorks.example.monday")}</div>
                <p className="text-muted-foreground leading-relaxed">
                  {t("howItWorks.example.mondayDesc")}
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -left-4 top-0 text-6xl font-bold text-primary/10 font-display">T</div>
              <div className="relative">
                <div className="text-sm font-bold uppercase tracking-wider text-primary mb-3">{t("howItWorks.example.tuesday")}</div>
                <p className="text-muted-foreground leading-relaxed">
                  {t("howItWorks.example.tuesdayDesc")}
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -left-4 top-0 text-6xl font-bold text-primary/10 font-display">F</div>
              <div className="relative">
                <div className="text-sm font-bold uppercase tracking-wider text-primary mb-3">{t("howItWorks.example.friday")}</div>
                <p className="text-muted-foreground leading-relaxed">
                  {t("howItWorks.example.fridayDesc")}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3 text-sm font-medium text-primary mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Ready to start?
          </div>
          <h3 className="font-display text-2xl font-semibold mb-4">Join the loop today</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Connect with farmers, restaurants, and your community to turn waste into harvest.
          </p>
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/auth">{t("howItWorks.example.startPost")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </Container>
    </>
  );
}
