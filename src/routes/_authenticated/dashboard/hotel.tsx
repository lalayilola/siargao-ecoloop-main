import { createFileRoute } from "@tanstack/react-router";
import { HotelDashboard } from "@/components/dashboard/HotelDashboard";

export const Route = createFileRoute("/_authenticated/dashboard/hotel")({
  head: () => ({
    meta: [
      { title: "Hotel Dashboard — Farm2Food Cycle" },
      { name: "description", content: "Manage your produce orders and waste collection." },
      { property: "og:title", content: "Hotel Dashboard" },
      { property: "og:description", content: "Hotel/Restaurant dashboard for Farm2Food Cycle." },
    ],
  }),
  component: () => <HotelDashboard />,
});
