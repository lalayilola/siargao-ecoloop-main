import { createFileRoute } from "@tanstack/react-router";
import { OrderHistoryView } from "@/components/OrderHistoryView";

export const Route = createFileRoute("/_authenticated/order-history")({
  head: () => ({
    meta: [
      { title: "Order History — EcoLoop Siargao" },
      { name: "description", content: "View your past transactions and trade history." },
      { property: "og:title", content: "Order History" },
      { property: "og:description", content: "Track your completed and cancelled orders." },
    ],
  }),
  component: () => <OrderHistoryView />,
});
