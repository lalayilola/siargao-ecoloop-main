import { createFileRoute } from "@tanstack/react-router";
import { ProduceInventoryView } from "@/components/waste/ProduceInventoryView";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({
    meta: [
      { title: "Produce Inventory — EcoLoop Siargao" },
      { name: "description", content: "Manage your agricultural produce inventory." },
      { property: "og:title", content: "Produce Inventory" },
      { property: "og:description", content: "Track and manage your produce listings." },
    ],
  }),
  component: () => <ProduceInventoryView />,
});
