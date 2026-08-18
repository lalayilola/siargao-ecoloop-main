import { createFileRoute } from "@tanstack/react-router";
import { NotificationsView } from "@/components/notifications/NotificationsView";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Farm2Food Cycle" },
      { name: "description", content: "View your notifications." },
      { property: "og:title", content: "Notifications" },
      { property: "og:description", content: "Stay updated on your activities." },
    ],
  }),
  component: NotificationsView,
});
