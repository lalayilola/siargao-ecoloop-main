import { createFileRoute } from "@tanstack/react-router";
import { WasteReportsView } from "@/components/waste/WasteReportsView";

export const Route = createFileRoute("/_authenticated/waste-reports")({
  head: () => ({
    meta: [
      { title: "Waste Reports — EcoLoop Siargao" },
      { name: "description", content: "Submit and track food waste reports for composting collection." },
      { property: "og:title", content: "Waste Reports" },
    ],
  }),
  component: () => <WasteReportsView />,
});
