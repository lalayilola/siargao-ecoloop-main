import { createFileRoute } from "@tanstack/react-router";
import { OrdersView } from "@/components/OrdersView";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "Orders — EcoLoop Siargao" },
      { name: "description", content: "Manage your produce orders." },
      { property: "og:title", content: "Orders" },
      { property: "og:description", content: "View and manage incoming and outgoing orders." },
    ],
  }),
  component: () => <OrdersView />,
});
