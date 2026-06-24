import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Recycle, Sprout, Store, Home, Building2, Users, MapPin, BarChart3, Handshake, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/Section";
import { useLanguage } from "@/hooks/use-language";
import hero from "@/assets/hero.jpg";
import compost from "@/assets/compost.jpg";
import produce from "@/assets/produce.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EcoLoop Siargao — Turn food waste into harvest" },
      { name: "description", content: "Connect Siargao's farmers, restaurants, residents and LGUs in a circular economy that diverts food waste into compost, feed and fresh produce." },
      { property: "og:title", content: "EcoLoop Siargao — Turn food waste into harvest" },
      { property: "og:description", content: "A community-powered food waste exchange and sustainable farming platform for Siargao Island." },
      { property: "og:image", content: hero },
      { name: "twitter:image", content: hero },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useLanguage();

  const roles = [
    { icon: Sprout, titleKey: "home.roles.farmer", bodyKey: "home.roles.farmerDesc" },
    { icon: Store, titleKey: "home.roles.restaurant", bodyKey: "home.roles.restaurantDesc" },
    { icon: Home, titleKey: "home.roles.resident", bodyKey: "home.roles.residentDesc" },
    { icon: Building2, titleKey: "home.roles.lgu", bodyKey: "home.roles.lguDesc" },
  ];

  const features = [
    { icon: Recycle, titleKey: "home.features.ecoFeed", bodyKey: "home.features.ecoFeedDesc" },
    { icon: Store, titleKey: "home.features.marketplaces", bodyKey: "home.features.marketplacesDesc" },
    { icon: Handshake, titleKey: "home.features.barter", bodyKey: "home.features.barterDesc" },
    { icon: Search, titleKey: "home.features.smartSearch", bodyKey: "home.features.smartSearchDesc" },
    { icon: MapPin, titleKey: "home.features.maps", bodyKey: "home.features.mapsDesc" },
    { icon: BarChart3, titleKey: "home.features.dashboard", bodyKey: "home.features.dashboardDesc" },
    { icon: Users, titleKey: "home.features.verified", bodyKey: "home.features.verifiedDesc" },
  ];

  const problemPoints = [
    "home.problem.point1",
    "home.problem.point2",
    "home.problem.point3",
    "home.problem.point4",
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={hero} alt="" width={1600} height={1024} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/30" />
        </div>
        <Container className="relative grid gap-10 py-20 sm:py-28 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Recycle className="h-3.5 w-3.5" /> {t("home.hero.badge")}
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
              {t("home.hero.title")}
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              {t("home.hero.subtitle")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/auth">{t("home.hero.joinLoop")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/how-it-works">{t("home.hero.seeHowItWorks")}</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
              {[
                { k: "4,820 kg", v: t("home.hero.wasteCollected") },
                { k: "82%", v: t("home.hero.divertedFromLandfill") },
                { k: "612", v: t("home.hero.activeMembers") },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="font-display text-2xl font-semibold text-primary">{s.k}</dt>
                  <dd className="text-xs text-muted-foreground">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      {/* THE LOOP */}
      <Container className="py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-primary">{t("home.problem.label")}</span>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              {t("home.problem.title")}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {t("home.problem.description")}
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {problemPoints.map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src={compost} alt="" loading="lazy" className="h-64 w-full rounded-2xl object-cover" />
            <img src={produce} alt="" loading="lazy" className="mt-8 h-64 w-full rounded-2xl object-cover" />
          </div>
        </div>
      </Container>

      {/* WHO IT'S FOR */}
      <section className="bg-secondary/40 py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t("home.roles.title")}</h2>
            <p className="mt-3 text-muted-foreground">
              {t("home.roles.subtitle")}
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((r) => (
              <Card key={r.titleKey} className="p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <r.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{t(r.titleKey)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(r.bodyKey)}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* FEATURES GRID */}
      <Container className="py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">{t("home.features.title")}</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              {t("home.features.subtitle")}
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden md:inline-flex">
            <Link to="/features">{t("home.features.allFeatures")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.titleKey} className="p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{t(f.titleKey)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t(f.bodyKey)}</p>
            </Card>
          ))}
        </div>
      </Container>

      {/* CTA */}
      <Container className="pb-20">
        <div className="overflow-hidden rounded-3xl bg-primary p-10 text-primary-foreground sm:p-14">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">
                {t("home.cta.title")}
              </h2>
              <p className="mt-3 max-w-xl text-primary-foreground/85">
                {t("home.cta.subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary" className="rounded-full">
                <Link to="/auth">{t("home.cta.getStarted")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/feed">{t("home.cta.browseEcoFeed")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
