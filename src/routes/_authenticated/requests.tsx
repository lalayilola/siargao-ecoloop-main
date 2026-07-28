import { createFileRoute } from "@tanstack/react-router";
import { TransactionHistoryPage } from "@/components/common/TransactionHistoryPage";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({ meta: [{ title: "Transactions — EcoLoop Siargao" }] }),
  component: TransactionHistoryPage,
});
