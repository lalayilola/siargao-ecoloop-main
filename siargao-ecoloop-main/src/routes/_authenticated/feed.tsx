import { createFileRoute } from "@tanstack/react-router";
import { FeedView } from "@/components/FeedView";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({
    meta: [
      { title: "EcoFeed — EcoLoop Siargao" },
      { name: "description", content: "The community feed: available crops, food waste, harvest schedules and promotions across Siargao." },
      { property: "og:title", content: "EcoFeed" },
      { property: "og:description", content: "A social feed for Siargao's circular food economy." },
    ],
  }),
  component: FeedView,
});
