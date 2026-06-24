import { createFileRoute } from "@tanstack/react-router";
import { TransactionHistoryPage } from "./trades";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({ meta: [{ title: "My Requests — EcoLoop Siargao" }] }),
  component: TransactionHistoryPage,
});
