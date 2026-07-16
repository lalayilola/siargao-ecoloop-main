import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Recycle, Sprout, Store, Home, Building2, Users, MapPin, BarChart3, Handshake, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/Section";
import { useLanguage } from "@/hooks/use-language";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import hero from "@/assets/homepage.jpg";
import hero2 from "@/assets/hero2.jpg";
import compost from "@/assets/compost.jpg";
import produce from "@/assets/produce.jpg";
import { getListings } from "@/lib/api/marketplace.functions";
import { ListingCard } from "@/components/marketplace/ListingCard";

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
  const [stats, setStats] = useState({
    wasteCollected: 0,
    divertedPercentage: 0,
    activeMembers: 0,
    municipalities: 0,
  });
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);

  // Mock marketplace listings for demo
  const mockListings = [
    {
      id: "mock-1",
      title: "Fresh Organic Vegetables",
      kind: "produce",
      seller: "Maria Santos",
      role: "farmer",
      barangay: "General Luna",
      kg: 50,
      price: "₱500",
      transaction_type: "sell_and_barter",
      image: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "mock-2",
      title: "Food Waste for Composting",
      kind: "waste",
      seller: "Siargao Resort",
      role: "business",
      barangay: "Daku Island",
      kg: 100,
      price: null,
      transaction_type: "barter_only",
      image: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "mock-3",
      title: "Banana Leaves - Wholesale",
      kind: "produce",
      seller: "Juan Dela Cruz",
      role: "farmer",
      barangay: "Pilar",
      kg: 200,
      price: "₱800",
      transaction_type: "sell_only",
      image: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "mock-4",
      title: "Coconut Husks for Soil",
      kind: "waste",
      seller: "Coconut Farm",
      role: "farmer",
      barangay: "San Isidro",
      kg: 150,
      price: "₱300",
      transaction_type: "sell_and_barter",
      image: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "mock-5",
      title: "Restaurant Kitchen Scraps",
      kind: "waste",
      seller: "Beach Bar Restaurant",
      role: "business",
      barangay: "General Luna",
      kg: 75,
      price: null,
      transaction_type: "barter_only",
      image: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "mock-6",
      title: "Organic Fertilizer",
      kind: "produce",
      seller: "Green Earth Farm",
      role: "farmer",
      barangay: "Santa Monica",
      kg: 30,
      price: "₱450",
      transaction_type: "sell_only",
      image: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "mock-7",
      title: "Mango Seeds for Planting",
      kind: "produce",
      seller: "Tropical Gardens",
      role: "farmer",
      barangay: "Del Carmen",
      kg: 20,
      price: "₱200",
      transaction_type: "sell_and_barter",
      image: null,
      created_at: new Date().toISOString(),
    },
    {
      id: "mock-8",
      title: "Fish Waste for Compost",
      kind: "waste",
      seller: "Local Fish Market",
      role: "business",
      barangay: "General Luna",
      kg: 40,
      price: null,
      transaction_type: "barter_only",
      image: null,
      created_at: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [profilesResult, wasteReportsResult, listingsResult] = await Promise.all([
          supabase.from("profiles").select("id"),
          supabase.from("food_waste_reports").select("quantity_kg, status"),
          getListings(),
        ]);

        const profiles = profilesResult.data || [];
        const wasteReports = (wasteReportsResult.data || []) as Array<{ quantity_kg: number | null; status: string }>;

        const wasteCollected = wasteReports
          .filter((report) => ["collected", "processed"].includes(report.status))
          .reduce((sum, report) => sum + (Number(report.quantity_kg) || 0), 0);

        const totalWaste = wasteReports.reduce((sum, report) => sum + (Number(report.quantity_kg) || 0), 0);
        const divertedPercentage = totalWaste > 0 ? Math.round((wasteCollected / totalWaste) * 100) : 0;

        // Get unique municipalities from profiles
        const { data: municipalityData } = await supabase.from("profiles").select("municipality").not("municipality", "is", null);
        const uniqueMunicipalities = new Set((municipalityData || []).map((p: any) => p.municipality));

        setStats({
          wasteCollected,
          divertedPercentage,
          activeMembers: profiles.length,
          municipalities: uniqueMunicipalities.size,
        });
        
        // Use mock listings if no real listings exist, otherwise use real listings
        setListings(listingsResult && listingsResult.length > 0 ? listingsResult.slice(0, 8) : mockListings);
      } catch (error) {
        console.error("Error loading stats:", error);
        // Set default stats on error so page still renders
        setStats({
          wasteCollected: 0,
          divertedPercentage: 0,
          activeMembers: 0,
          municipalities: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
  }, []);

  const roles = [
    { icon: Sprout, titleKey: "home.roles.farmer", bodyKey: "home.roles.farmerDesc" },
    { icon: Store, titleKey: "home.roles.restaurant", bodyKey: "home.roles.restaurantDesc" },
    { icon: Home, titleKey: "home.roles.resident", bodyKey: "home.roles.residentDesc" },
    { icon: Building2, titleKey: "home.roles.lgu", bodyKey: "home.roles.lguDesc" },
  ];

  const features = [
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
        </div>
        <Container className="relative flex flex-col items-center justify-center gap-10 py-20 sm:py-28 text-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white border border-white/30">
              <Recycle className="h-3.5 w-3.5" /> {t("home.hero.badge")}
            </span>
            <h1 className="mt-4 font-serif text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl leading-none uppercase">
              <div className="bg-gradient-to-r from-green-600 via-white to-green-600 bg-clip-text text-transparent animate-gradient-text">
                Turn food waste into,
              </div>
              <div className="bg-gradient-to-r from-green-600 via-white to-green-600 bg-clip-text text-transparent animate-gradient-text">
                Island harvest.
              </div>
            </h1>
            <p className="mt-5 max-w-xl text-base text-white sm:text-lg mx-auto text-center">
              {t("home.hero.subtitle")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/auth">{t("home.hero.joinLoop")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/how-it-works">{t("home.hero.seeHowItWorks")}</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 mx-auto">
              {[
                { k: loading ? "..." : `${stats.wasteCollected.toLocaleString()} kg`, v: t("home.hero.wasteCollected") },
                { k: loading ? "..." : `${stats.divertedPercentage}%`, v: t("home.hero.divertedFromLandfill") },
                { k: loading ? "..." : stats.activeMembers.toLocaleString(), v: t("home.hero.activeMembers") },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="font-display text-2xl font-semibold text-white">{s.k}</dt>
                  <dd className="text-xs text-white">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      {/* MARKETPLACE CAROUSEL */}
      <Container className="py-20">
        <div className="text-center mb-10">
          <span className="text-xs font-medium uppercase tracking-wider text-primary">Marketplace</span>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            Fresh from the Community
          </h2>
          <p className="mt-4 text-muted-foreground">
            Browse the latest listings from farmers, restaurants, and community members
          </p>
        </div>
        
        <div className="relative overflow-hidden">
          <div className="flex gap-6 animate-scroll">
            {listings.length > 0 ? (
              <>
                {listings.map((listing) => (
                  <div key={listing.id} className="flex-shrink-0 w-80">
                    <ListingCard item={listing} />
                  </div>
                ))}
                {/* Duplicate for seamless loop */}
                {listings.map((listing) => (
                  <div key={`${listing.id}-duplicate`} className="flex-shrink-0 w-80">
                    <ListingCard item={listing} />
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                No listings available yet. Be the first to post!
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Button asChild size="lg" className="rounded-full">
            <Link to="/marketplace">View All Listings <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </Container>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* WHO IT'S FOR */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0">
          <img src={hero2} alt="" width={1600} height={1024} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <Container className="relative">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl text-white">{t("home.roles.title")}</h2>
            <p className="mt-3 text-white/90">
              {t("home.roles.subtitle")}
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((r) => (
              <Card key={r.titleKey} className="p-6 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/20 text-white">
                  <r.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{t(r.titleKey)}</h3>
                <p className="mt-2 text-sm text-white/80">{t(r.bodyKey)}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* FEATURES GRID */}
      <section className="bg-gradient-to-b from-secondary/30 to-background py-20">
        <Container>
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
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.titleKey} className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-transparent hover:border-primary/20">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{t(f.titleKey)}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(f.bodyKey)}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

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
                <Link to="/marketplace">{t("home.cta.browseMarketplace")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
