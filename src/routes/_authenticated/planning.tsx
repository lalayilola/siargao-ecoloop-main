import { createFileRoute } from "@tanstack/react-router";
import { PlanningForecastDashboard } from "@/components/planning/PlanningForecastDashboard";

export const Route = createFileRoute("/_authenticated/planning")({
  component: PlanningForecastDashboard,
});
