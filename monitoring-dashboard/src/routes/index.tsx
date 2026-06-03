import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/waf/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sentinel.AI — AI WAF Console" },
      {
        name: "description",
        content:
          "Live console for an AI-powered Web Application Firewall. Simulate traffic, monitor inference, and inspect blocked, allowed, and challenged requests in real time.",
      },
      { property: "og:title", content: "Sentinel.AI — AI WAF Console" },
      {
        property: "og:description",
        content: "Real-time AI WAF dashboard with traffic simulation and live request logs.",
      },
    ],
  }),
  component: Dashboard,
});
