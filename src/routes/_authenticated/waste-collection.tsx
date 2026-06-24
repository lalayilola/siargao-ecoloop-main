import { createFileRoute } from "@tanstack/react-router";
import { WasteCollectionView } from "@/components/WasteCollectionView";

export const Route = createFileRoute("/_authenticated/waste-collection")({
  head: () => ({
    meta: [
      { title: "Collection Requests — EcoLoop Siargao" },
      { name: "description", content: "Schedule and manage waste collection pickups." },
      { property: "og:title", content: "Collection Requests" },
    ],
  }),
  component: () => <WasteCollectionView />,
});
