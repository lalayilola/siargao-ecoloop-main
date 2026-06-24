import { createFileRoute } from "@tanstack/react-router";
import { EcoPointsView } from "@/components/EcoPointsView";

export const Route = createFileRoute("/_authenticated/eco-points")({
  head: () => ({
    meta: [
      { title: "Eco Points — EcoLoop Siargao" },
      { name: "description", content: "View your eco points and sustainability achievements." },
      { property: "og:title", content: "Eco Points" },
      { property: "og:description", content: "Track your sustainability journey." },
    ],
  }),
  component: EcoPointsView,
});
