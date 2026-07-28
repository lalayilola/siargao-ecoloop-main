import { createFileRoute } from "@tanstack/react-router";
import { MessagesView } from "@/components/messaging/MessagesView";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Siargao Loops" },
      { name: "description", content: "Your messages and conversations with other Siargao Loops members." },
      { property: "og:title", content: "Messages" },
      { property: "og:description", content: "Chat with other members of the Siargao circular food economy." },
    ],
  }),
  component: MessagesView,
});
