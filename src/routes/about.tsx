import { createFileRoute } from "@tanstack/react-router";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Recycle, Sprout, Users, Leaf } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

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
      <PageHero
        eyebrow={t("about.hero.eyebrow")}
        title={t("about.hero.title")}
        sub={t("about.hero.subtitle")}
      />
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
