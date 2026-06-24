import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Recycle, Sprout, Store, Home, Building2, Users, MapPin, BarChart3, Handshake, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/Section";
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

const roles = [
  { icon: Sprout, title: "Local Farmers", body: "Post crops, schedule harvests, request food waste for compost or feed." },
  { icon: Store, title: "Restaurants", body: "Offer daily food waste, promote menu items, barter meals for produce." },
  { icon: Home, title: "Residents", body: "Drop household scraps, join barter trades, buy local produce." },
  { icon: Building2, title: "LGU Admins", body: "Monitor diversion, verify users, publish announcements, generate reports." },
];

const features = [
  { icon: Recycle, title: "EcoFeed", body: "A social feed of available crops, waste and trades from your barangay." },
  { icon: Store, title: "Marketplaces", body: "Two markets — food waste and fresh produce — with photos, weight, price and location." },
  { icon: Handshake, title: "Barter & Trades", body: "Swap waste, produce and meals without cash. Track every trade end-to-end." },
  { icon: Search, title: "Smart Search", body: "Find by crop, user, barangay, restaurant or waste type — instantly." },
  { icon: MapPin, title: "Maps & Locations", body: "See pickup points, nearby farms and food waste sources at a glance." },
  { icon: BarChart3, title: "LGU Dashboard", body: "Track waste collected, diverted, active users and trade volume." },
  { icon: Users, title: "Verified Community", body: "LGU-verified accounts keep the loop safe and trustworthy." },
];

function Index() {
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
              <Recycle className="h-3.5 w-3.5" /> A circular economy for Siargao
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
              Turn food waste into <span className="text-primary">island harvest</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              EcoLoop Siargao connects farmers, restaurants, residents and LGUs so kitchen scraps
              become compost, feed and fresh produce — keeping the island green and the loop closed.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/auth">Join the loop <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/how-it-works">See how it works</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
              {[
                { k: "4,820 kg", v: "Waste collected" },
                { k: "82%", v: "Diverted from landfill" },
                { k: "612", v: "Active members" },
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
            <span className="text-xs font-medium uppercase tracking-wider text-primary">The problem</span>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              Siargao's food waste belongs in the soil — not the landfill.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Tons of edible scraps and organic matter leave restaurants, resorts and homes every week.
              Meanwhile, local farmers spend on inputs they could grow themselves through composting.
              EcoLoop bridges the two ends — and rewards everyone in between.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Reduce environmental pollution and methane from landfills",
                "Support local food production with low-cost compost",
                "Strengthen barangay-level cooperation and barter culture",
                "Plan ahead with future-supply and future-need announcements",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{t}</span>
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
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Built for the whole community</h2>
            <p className="mt-3 text-muted-foreground">
              Four roles, one shared loop. Pick how you want to participate.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((r) => (
              <Card key={r.title} className="p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <r.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{r.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* FEATURES GRID */}
      <Container className="py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Everything the loop needs</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              From posting scraps to tracking island-wide impact, EcoLoop bundles every tool the community needs in one place.
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden md:inline-flex">
            <Link to="/features">All features <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
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
                Ready to close the loop on your block?
              </h2>
              <p className="mt-3 max-w-xl text-primary-foreground/85">
                Register your farm, kitchen or household and start trading today — no cash, just community.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary" className="rounded-full">
                <Link to="/auth">Get started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/feed">Browse the EcoFeed</Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
