import { createFileRoute } from "@tanstack/react-router";
import { CompostHistoryView } from "@/components/CompostHistoryView";

export const Route = createFileRoute("/_authenticated/compost-history")({
  head: () => ({
    meta: [
      { title: "Compost History — EcoLoop Siargao" },
      { name: "description", content: "View your compost purchase history." },
      { property: "og:title", content: "Compost History" },
      { property: "og:description", content: "Track your compost requests and purchases." },
    ],
  }),
  component: () => <CompostHistoryView />,
});
