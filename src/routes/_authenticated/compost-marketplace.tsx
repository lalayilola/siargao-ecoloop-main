import { createFileRoute } from "@tanstack/react-router";
import { CompostMarketplaceView } from "@/components/CompostMarketplaceView";

export const Route = createFileRoute("/_authenticated/compost-marketplace")({
  head: () => ({
    meta: [
      { title: "Compost Marketplace — EcoLoop Siargao" },
      { name: "description", content: "Request compost and organic fertilizer from LGU." },
      { property: "og:title", content: "Compost Marketplace" },
      { property: "og:description", content: "Browse and request available compost." },
    ],
  }),
  component: () => <CompostMarketplaceView />,
});
