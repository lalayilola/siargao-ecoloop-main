import { createFileRoute } from "@tanstack/react-router";
import { RestaurantDashboard } from "@/components/dashboard/RestaurantDashboard";

export const Route = createFileRoute("/_authenticated/dashboard/restaurant")({
  head: () => ({
    meta: [
      { title: "Restaurant Dashboard — EcoLoop Siargao" },
      { name: "description", content: "Manage your produce orders, waste reports, and collection requests." },
      { property: "og:title", content: "Restaurant Dashboard" },
      { property: "og:description", content: "Your central hub for managing restaurant operations." },
    ],
  }),
  component: () => <RestaurantDashboard />,
});
