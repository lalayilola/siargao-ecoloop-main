import { createFileRoute } from "@tanstack/react-router";
import { HotelDashboard } from "@/components/HotelDashboard";

export const Route = createFileRoute("/_authenticated/dashboard/hotel")({
  head: () => ({
    meta: [
      { title: "Hotel Dashboard — EcoLoop Siargao" },
      { name: "description", content: "Manage your produce orders and waste collection." },
      { property: "og:title", content: "Hotel Dashboard" },
      { property: "og:description", content: "Hotel/Restaurant dashboard for EcoLoop Siargao." },
    ],
  }),
  component: () => <HotelDashboard />,
});
