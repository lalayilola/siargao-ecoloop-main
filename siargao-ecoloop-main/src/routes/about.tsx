import { createFileRoute } from "@tanstack/react-router";
import { Container, PageHero } from "@/components/Section";
import { Card } from "@/components/ui/card";
import { Recycle, Sprout, Users, Leaf } from "lucide-react";

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
  return (
    <>
      <PageHero
        eyebrow="About"
        title="A circular economy, designed for Siargao."
        sub="EcoLoop Siargao is a community platform that links the people who produce food waste with the people who can turn it into something useful — closing the loop on island sustainability."
      />
      <Container className="grid gap-10 py-16 md:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-semibold">Our mission</h2>
          <p className="mt-3 text-muted-foreground">
            Siargao's beauty depends on what happens behind the scenes — how households manage scraps,
            how restaurants handle trimmings, how farmers fertilize their fields, and how LGUs steward
            collective resources. EcoLoop makes each of those decisions easier and more rewarding by
            connecting them in a single circular system.
          </p>
          <h2 className="mt-10 font-display text-2xl font-semibold">Why it matters</h2>
          <p className="mt-3 text-muted-foreground">
            Diverting organic waste from landfills reduces methane emissions, cuts pollution in our
            waterways, and creates inputs for local food production — strengthening island food security
            and lowering costs for farmers.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: Recycle, title: "Divert", body: "Reroute organic waste away from landfills." },
            { icon: Sprout, title: "Regenerate", body: "Build soil and grow more food, locally." },
            { icon: Users, title: "Connect", body: "Make the community the platform." },
            { icon: Leaf, title: "Sustain", body: "Protect Siargao for the next generation." },
          ].map((p) => (
            <Card key={p.title} className="p-5">
              <p.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
            </Card>
          ))}
        </div>
      </Container>
      <Container className="pb-16">
        <Card className="p-8">
          <h2 className="font-display text-2xl font-semibold">The loop, in plain words</h2>
          <ol className="mt-4 grid gap-4 text-sm md:grid-cols-4">
            {[
              "Restaurants and homes post available food waste.",
              "Farmers request pickups for compost or animal feed.",
              "Farmers offer harvests as sale, trade, or barter.",
              "LGUs verify members and track island-wide impact.",
            ].map((step, i) => (
              <li key={step} className="rounded-xl bg-secondary/60 p-4">
                <span className="font-display text-2xl font-semibold text-primary">0{i + 1}</span>
                <p className="mt-2 text-muted-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </Card>
      </Container>
    </>
  );
}
