import { createFileRoute } from "@tanstack/react-router";
import { FarmerDashboard } from "@/components/FarmerDashboard";

export const Route = createFileRoute("/_authenticated/dashboard/farmer")({
  head: () => ({
    meta: [
      { title: "Farmer Dashboard — EcoLoop Siargao" },
      { name: "description", content: "Manage your produce, orders, and compost requests." },
      { property: "og:title", content: "Farmer Dashboard" },
      { property: "og:description", content: "Your central hub for managing farm operations." },
    ],
  }),
  component: () => <FarmerDashboard />,
});
