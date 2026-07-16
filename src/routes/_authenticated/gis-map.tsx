import { createFileRoute } from "@tanstack/react-router";
import { GISMapView } from "@/components/planning/GISMapView";

export const Route = createFileRoute("/_authenticated/gis-map")({
  head: () => ({
    meta: [
      { title: "GIS Map — EcoLoop Siargao" },
      { name: "description", content: "GIS map monitoring for waste management." },
      { property: "og:title", content: "GIS Map" },
      { property: "og:description", content: "Monitor waste collection and compost sites." },
    ],
  }),
  component: GISMapView,
});
