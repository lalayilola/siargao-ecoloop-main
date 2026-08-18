import { createFileRoute } from "@tanstack/react-router";
import { TransactionHistoryPage } from "@/components/common/TransactionHistoryPage";

export const Route = createFileRoute("/_authenticated/trades")({
  head: () => ({ meta: [{ title: "Transaction History — Farm2Food Cycle" }] }),
  component: TransactionHistoryPage,
});
