import { createFileRoute, Link } from "@tanstack/react-router";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ClipboardList, Handshake, Truck, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — EcoLoop Siargao" },
      { name: "description", content: "Four simple steps: post, match, exchange, and track. See how EcoLoop turns waste into harvest." },
      { property: "og:title", content: "How EcoLoop Siargao works" },
      { property: "og:description", content: "Post, match, exchange, track — the circular loop in four steps." },
    ],
  }),
  component: HowItWorks,
});

const steps = [
  { icon: ClipboardList, title: "01 · Post", body: "Share what you have or what you need — food waste, fresh harvest, or future supply." },
  { icon: Handshake, title: "02 · Match", body: "Browse the EcoFeed or use Smart Search to find a partner nearby." },
  { icon: Truck, title: "03 · Exchange", body: "Coordinate pickup, barter or sale through the trade request flow." },
  { icon: BarChart3, title: "04 · Track", body: "Every completed trade rolls up to the LGU dashboard as community impact." },
];

function HowItWorks() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="A four-step loop the whole island can use."
        sub="EcoLoop is designed to feel as natural as a barangay tiangge — simple to join, fast to use, fair for everyone."
      />
      <Container className="py-16">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <Card key={s.title} className="p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-12 p-8">
          <h2 className="font-display text-2xl font-semibold">Example: a week in the loop</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-primary">Monday</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Kawayan Kitchen posts 20kg of vegetable trimmings available daily after lunch.
              </p>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-primary">Tuesday</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Mang Tonyo's Farm sends a trade request: 20kg scraps for 10kg of fresh tomatoes.
              </p>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-primary">Friday</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Trade completed. LGU dashboard updates: +20kg diverted, +1 successful trade.
              </p>
            </div>
          </div>
        </Card>

        <div className="mt-10 flex justify-center">
          <Button asChild size="lg" className="rounded-full">
            <Link to="/auth">Start your first post <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </Container>
    </>
  );
}
