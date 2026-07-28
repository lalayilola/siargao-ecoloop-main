import { createFileRoute } from "@tanstack/react-router";
import { MarketplaceView } from "@/components/marketplace/MarketplaceView";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — Siargao Loops" },
      { name: "description", content: "Browse Siargao's two marketplaces: fresh local produce and available food waste for compost or animal feed." },
      { property: "og:title", content: "Siargao Loops Marketplace" },
      { property: "og:description", content: "Fresh produce and food waste listings from across the island." },
    ],
  }),
  component: MarketplaceView,
});
