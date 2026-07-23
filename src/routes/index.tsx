import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Recycle, Sprout, Store, Home, Building2, Users, MapPin, BarChart3, Handshake, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/layout/Section";
import { useLanguage } from "@/hooks/use-language";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import hero from "@/assets/homepage.jpg";
import heroAnimation from "@/assets/homepagevid.mp4";
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
      transaction_type: "sell_only",
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
      transaction_type: "sell_only",
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
      price: null,
      transaction_type: "sell_only",
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
      transaction_type: "sell_only",
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
      transaction_type: "sell_only",
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
      transaction_type: "sell_only",
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


  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden min-h-[600px] flex items-center">
        <div className="absolute inset-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="h-full w-full object-cover"
          >
            <source src={heroAnimation} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
        </div>
        <Container className="relative flex flex-col items-center justify-center gap-12 py-24 sm:py-32 text-center">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-4 py-2 text-xs font-semibold tracking-wider uppercase text-white border border-white/20 shadow-lg">
              <Recycle className="h-4 w-4" /> {t("home.hero.badge")}
            </span>
            <h1 className="mt-8 font-serif text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-tight uppercase text-white drop-shadow-2xl">
              <div className="bg-gradient-to-r from-emerald-600 via-white to-emerald-600 bg-clip-text text-transparent animate-gradient-text bg-[length:200%_auto]">
                Turn food waste into,
              </div>
              <div className="bg-gradient-to-r from-emerald-700 via-white to-emerald-700 bg-clip-text text-transparent animate-gradient-text bg-[length:200%_auto]" style={{ animationDelay: '0.5s' }}>
                Island harvest.
              </div>
            </h1>
            <p className="mt-6 max-w-2xl text-lg sm:text-xl text-white/90 font-light leading-relaxed mx-auto text-center">
              {t("home.hero.subtitle")}
            </p>
            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/30 px-8 py-6 text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <Link to="/auth">{t("home.hero.joinLoop")} <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 px-8 py-6 text-base font-semibold transition-all duration-300 hover:scale-105">
                <Link to="/how-it-works">{t("home.hero.seeHowItWorks")}</Link>
              </Button>
            </div>
            <dl className="mt-16 grid max-w-2xl grid-cols-3 gap-8 mx-auto">
              {[
                { k: loading ? "..." : `${stats.wasteCollected.toLocaleString()} kg`, v: t("home.hero.wasteCollected") },
                { k: loading ? "..." : `${stats.divertedPercentage}%`, v: t("home.hero.divertedFromLandfill") },
                { k: loading ? "..." : stats.activeMembers.toLocaleString(), v: t("home.hero.activeMembers") },
              ].map((s) => (
                <div key={s.v} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
                  <dt className="font-display text-3xl font-bold text-white">{s.k}</dt>
                  <dd className="text-xs uppercase tracking-wider text-white/80 mt-2">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      {/* MARKETPLACE CAROUSEL */}
      <section className="relative py-24 bg-gradient-to-b from-emerald-50/50 to-white">
        <Container>
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-600 mb-4">Marketplace</span>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Fresh from the Community
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-gray-600 font-light leading-relaxed">
              Browse the latest listings from farmers, restaurants, and community members
            </p>
          </div>
          
          <div className="relative overflow-hidden">
            <div className="flex gap-8 animate-scroll px-4">
              {listings.length > 0 ? (
                <>
                  {listings.map((listing) => (
                    <div key={listing.id} className="flex-shrink-0 w-96">
                      <ListingCard item={listing} />
                    </div>
                  ))}
                  {/* Duplicate for seamless loop */}
                  {listings.map((listing) => (
                    <div key={`${listing.id}-duplicate`} className="flex-shrink-0 w-96">
                      <ListingCard item={listing} />
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center text-gray-500 py-10">
                  No listings available yet. Be the first to post!
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Button asChild size="lg" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/30 px-8 py-6 text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <Link to="/marketplace">View All Listings <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </Container>
      </section>

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
      <section className="relative overflow-hidden py-24 bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-400 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-400 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        <Container className="relative">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-300 mb-4">Built For Everyone</span>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-6">
              {t("home.roles.title")}
            </h2>
            <p className="text-lg text-emerald-100/80 font-light leading-relaxed">
              {t("home.roles.subtitle")}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((r) => (
              <Card key={r.titleKey} className="p-8 bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20 rounded-3xl">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-500/30">
                  <r.icon className="h-7 w-7" />
                </span>
                <h3 className="mt-6 font-serif text-xl font-semibold">{t(r.titleKey)}</h3>
                <p className="mt-3 text-sm text-emerald-100/70 leading-relaxed">{t(r.bodyKey)}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* FEATURES GRID */}
      <section className="relative py-24 bg-gradient-to-b from-white to-emerald-50/30">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-20 w-64 h-64 bg-emerald-200 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-green-200 rounded-full blur-3xl" />
        </div>
        <Container className="relative">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-600 mb-4">Features</span>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                {t("home.features.title")}
              </h2>
              <p className="text-lg text-gray-600 font-light leading-relaxed">
                {t("home.features.subtitle")}
              </p>
            </div>
            <Button asChild variant="ghost" className="hidden md:inline-flex text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-semibold transition-all duration-300">
              <Link to="/features">{t("home.features.allFeatures")} <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.titleKey} className="p-8 bg-white/80 backdrop-blur-sm border border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-2xl hover:shadow-emerald-200/50 transition-all duration-300 hover:-translate-y-2 rounded-3xl group">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                  <f.icon className="h-8 w-8" />
                </div>
                <h3 className="mt-6 font-serif text-xl font-semibold text-gray-900">{t(f.titleKey)}</h3>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{t(f.bodyKey)}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="relative py-24">
        <Container>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 p-12 sm:p-16 text-white shadow-2xl shadow-emerald-600/30">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-400 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
            </div>
            <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-6">
                  {t("home.cta.title")}
                </h2>
                <p className="text-lg text-emerald-100 font-light leading-relaxed max-w-2xl">
                  {t("home.cta.subtitle")}
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" variant="secondary" className="rounded-full bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-6 text-base font-semibold shadow-xl shadow-white/20 transition-all duration-300 hover:scale-105">
                  <Link to="/auth">{t("home.cta.getStarted")}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-2 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:border-white/60 px-8 py-6 text-base font-semibold backdrop-blur-sm transition-all duration-300 hover:scale-105">
                  <Link to="/marketplace">{t("home.cta.browseMarketplace")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
