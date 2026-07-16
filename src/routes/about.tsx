import { createFileRoute } from "@tanstack/react-router";
import { Container } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Recycle, Sprout, Users, Leaf } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import restaurantBg from "@/assets/restaurant.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — EcoLoop Siargao" },
      { name: "description", content: "Our mission to build a circular food economy in Siargao through community partnership and sustainable farming." },
      { property: "og:title", content: "About EcoLoop Siargao" },
      { property: "og:description", content: "How we turn island food waste into local harvest." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useLanguage();

  const principles = [
    { icon: Recycle, titleKey: "about.principles.divert", bodyKey: "about.principles.divertDesc" },
    { icon: Sprout, titleKey: "about.principles.regenerate", bodyKey: "about.principles.regenerateDesc" },
    { icon: Users, titleKey: "about.principles.connect", bodyKey: "about.principles.connectDesc" },
    { icon: Leaf, titleKey: "about.principles.sustain", bodyKey: "about.principles.sustainDesc" },
  ];

  const loopSteps = [
    "about.loopSteps.step1",
    "about.loopSteps.step2",
    "about.loopSteps.step3",
    "about.loopSteps.step4",
  ];

  return (
    <>
      {/* Hero Section with Background */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0">
          <img src={restaurantBg} alt="" width={1600} height={1024} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <Container className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-3xl font-semibold sm:text-4xl text-white">{t("about.hero.eyebrow")}</h1>
            <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl text-white">{t("about.hero.title")}</h2>
            <p className="mt-4 text-lg text-white/90">
              {t("about.hero.subtitle")}
            </p>
          </div>
        </Container>
      </section>
      <Container className="grid gap-10 py-16 md:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-semibold">{t("about.mission.title")}</h2>
          <p className="mt-3 text-muted-foreground">
            {t("about.mission.description")}
          </p>
          <h2 className="mt-10 font-display text-2xl font-semibold">{t("about.whyItMatters.title")}</h2>
          <p className="mt-3 text-muted-foreground">
            {t("about.whyItMatters.description")}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {principles.map((p) => (
            <Card key={p.titleKey} className="p-5">
              <p.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{t(p.titleKey)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t(p.bodyKey)}</p>
            </Card>
          ))}
        </div>
      </Container>
      <Container className="pb-16">
        <Card className="p-8">
          <h2 className="font-display text-2xl font-semibold">{t("about.loopSteps.title")}</h2>
          <ol className="mt-4 grid gap-4 text-sm md:grid-cols-4">
            {loopSteps.map((stepKey, i) => (
              <li key={stepKey} className="rounded-xl bg-secondary/60 p-4">
                <span className="font-display text-2xl font-semibold text-primary">0{i + 1}</span>
                <p className="mt-2 text-muted-foreground">{t(stepKey)}</p>
              </li>
            ))}
          </ol>
        </Card>
      </Container>
    </>
  );
}
