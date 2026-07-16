import { createFileRoute } from "@tanstack/react-router";
import { MarketplaceView } from "@/components/marketplace/MarketplaceView";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — EcoLoop Siargao" },
      { name: "description", content: "Browse Siargao's two marketplaces: fresh local produce and available food waste for compost or animal feed." },
      { property: "og:title", content: "EcoLoop Marketplace" },
      { property: "og:description", content: "Fresh produce and food waste listings from across the island." },
    ],
  }),
  component: MarketplaceView,
});
