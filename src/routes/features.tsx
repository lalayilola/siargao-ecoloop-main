import { createFileRoute } from "@tanstack/react-router";
import { Container } from "@/components/layout/Section";
import { Card } from "@/components/ui/card";
import { Store, Calendar, Handshake, Search, MapPin, BarChart3, Users, ShieldCheck, Sprout, TrendingUp, Package } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import featuresBg from "@/assets/features.jpeg";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — EcoLoop Siargao" },
      { name: "description", content: "Marketplaces, barter trades, planning & forecast, smart search, maps, and the LGU dashboard — every feature explained." },
      { property: "og:title", content: "EcoLoop Siargao features" },
      { property: "og:description", content: "Features that power Siargao's circular food economy." },
    ],
  }),
  component: FeaturesPage,
});

const features = [
  { icon: Users, titleKey: "features.userRegistration", bodyKey: "features.userRegistrationDesc" },
  { icon: ShieldCheck, titleKey: "features.richProfiles", bodyKey: "features.richProfilesDesc" },
  { icon: Store, titleKey: "features.foodWasteMarketplace", bodyKey: "features.foodWasteMarketplaceDesc" },
  { icon: Sprout, titleKey: "features.produceMarketplace", bodyKey: "features.produceMarketplaceDesc" },
  { icon: Handshake, titleKey: "features.barterTrades", bodyKey: "features.barterTradesDesc" },
  { icon: TrendingUp, titleKey: "features.planningForecast", bodyKey: "features.planningForecastDesc" },
  { icon: Search, titleKey: "features.smartSearch", bodyKey: "features.smartSearchDesc" },
  { icon: MapPin, titleKey: "features.mapsLocations", bodyKey: "features.mapsLocationsDesc" },
  { icon: BarChart3, titleKey: "features.lguDashboard", bodyKey: "features.lguDashboardDesc" },
];

function FeaturesPage() {
  const { t } = useLanguage();

  return (
    <>
      {/* Hero Section with Background */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0">
          <img src={featuresBg} alt="" width={1600} height={1024} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <Container className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-3xl font-semibold sm:text-4xl text-white">{t("features.hero.eyebrow")}</h1>
            <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl text-white">{t("features.hero.title")}</h2>
            <p className="mt-4 text-lg text-white/90">
              {t("features.hero.subtitle")}
            </p>
          </div>
        </Container>
      </section>
      <Container className="py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Card key={f.titleKey} className="p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <span className="text-xs text-muted-foreground">0{i + 1 < 10 ? i + 1 : i + 1}</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{t(f.titleKey)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(f.bodyKey)}</p>
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}
