import { createFileRoute } from "@tanstack/react-router";
import { MarketplaceView } from "@/components/marketplace/MarketplaceView";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — Farm2Food Cycle" },
      {
        name: "description",
        content:
          "Browse the two marketplaces: fresh local produce and available food waste for compost or animal feed.",
      },
      { property: "og:title", content: "Farm2Food Cycle Marketplace" },
      {
        property: "og:description",
        content: "Fresh produce and food waste listings from across the community.",
      },
    ],
  }),
  component: MarketplaceView,
});
