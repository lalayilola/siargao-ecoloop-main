import { createFileRoute } from "@tanstack/react-router";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Recycle, Store, Calendar, Handshake, Search, MapPin, BarChart3, Users, ShieldCheck, Sprout } from "lucide-react";

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
  { icon: Recycle, title: "EcoFeed", body: "A community dashboard of crops, scraps and promotions from farmers, residents and restaurants — with photos, weight, price, location and dates." },
  { icon: Users, title: "User Registration", body: "Join as a Farmer, Restaurant Owner, or Resident. LGUs verify accounts to keep the network trusted." },
  { icon: ShieldCheck, title: "Rich Profiles", body: "Role-tailored profiles: farm plot + crop calendar, restaurant hours + collection schedule, household waste availability." },
  { icon: Store, title: "Food Waste Marketplace", body: "Post available waste with quantity, pickup location, images and schedule. Farmers request collection in one tap." },
  { icon: Sprout, title: "Produce Marketplace", body: "Fruits, vegetables, herbs and organic products with photos, weight, price, available quantity and harvest date." },
  { icon: Handshake, title: "Barter & Trades", body: "Cashless trade requests with approval, status tracking and a full trade history." },
  { icon: Search, title: "Smart Search", body: "Filter by crop, user, barangay, address, restaurant or waste type." },
  { icon: MapPin, title: "Maps & Locations", body: "See user locations, pickup points, nearby food waste sources and nearby farms." },
  { icon: BarChart3, title: "LGU Admin Dashboard", body: "Monitor waste collected, diversion rates, active users, successful trades and crop output — with monthly reports." },
];

function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="Nine tools that close the loop."
        sub="EcoLoop bundles a social feed, two marketplaces, a trade engine and an LGU monitoring layer — all designed for Siargao life."
      />
      <Container className="py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Card key={f.title} className="p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <span className="text-xs text-muted-foreground">0{i + 1 < 10 ? i + 1 : i + 1}</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}
