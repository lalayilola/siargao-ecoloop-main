import { createFileRoute } from "@tanstack/react-router";
import { MessagesView } from "@/components/messaging/MessagesView";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Farm2Food Cycle" },
      {
        name: "description",
        content: "Your messages and conversations with other Farm2Food Cycle members.",
      },
      { property: "og:title", content: "Messages" },
      {
        property: "og:description",
        content: "Chat with other members of the circular food economy.",
      },
    ],
  }),
  component: MessagesView,
});
