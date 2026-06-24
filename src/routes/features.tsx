import { createFileRoute } from "@tanstack/react-router";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Recycle, Store, Calendar, Handshake, Search, MapPin, BarChart3, Users, ShieldCheck, Sprout } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — EcoLoop Siargao" },
      { name: "description", content: "EcoFeed, marketplaces, barter trades, smart search, maps, and the LGU dashboard — every feature explained." },
      { property: "og:title", content: "EcoLoop Siargao features" },
      { property: "og:description", content: "Features that power Siargao's circular food economy." },
    ],
  }),
  component: FeaturesPage,
});

const features = [
  { icon: Recycle, titleKey: "features.ecoFeed", bodyKey: "features.ecoFeedDesc" },
  { icon: Users, titleKey: "features.userRegistration", bodyKey: "features.userRegistrationDesc" },
  { icon: ShieldCheck, titleKey: "features.richProfiles", bodyKey: "features.richProfilesDesc" },
  { icon: Store, titleKey: "features.foodWasteMarketplace", bodyKey: "features.foodWasteMarketplaceDesc" },
  { icon: Sprout, titleKey: "features.produceMarketplace", bodyKey: "features.produceMarketplaceDesc" },
  { icon: Handshake, titleKey: "features.barterTrades", bodyKey: "features.barterTradesDesc" },
  { icon: Search, titleKey: "features.smartSearch", bodyKey: "features.smartSearchDesc" },
  { icon: MapPin, titleKey: "features.mapsLocations", bodyKey: "features.mapsLocationsDesc" },
  { icon: BarChart3, titleKey: "features.lguDashboard", bodyKey: "features.lguDashboardDesc" },
];

function FeaturesPage() {
  const { t } = useLanguage();

  return (
    <>
      <PageHero
        eyebrow={t("features.hero.eyebrow")}
        title={t("features.hero.title")}
        sub={t("features.hero.subtitle")}
      />
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
