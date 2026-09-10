import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { DashboardLayout, DashboardPlaceholder } from "@/components/DashboardLayout";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — FoodRush Admin" },
      { name: "description", content: "Growth, retention and operational reporting." },
      { property: "og:title", content: "Analytics — FoodRush Admin" },
      { property: "og:description", content: "Growth, retention and operational reporting." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAnalytics,
});

function AdminAnalytics() {
  return (
    <DashboardLayout
      role="admin"
      title="Analytics"
      description="Growth, retention and operational reporting."
      icon={<BarChart3 className="size-6" aria-hidden />}
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Analytics" }]}
      notificationCount={3}
    >
      <DashboardPlaceholder
        points={["Revenue trends", "Cohort retention", "Delivery time analytics", "Area heatmaps"]}
      />
    </DashboardLayout>
  );
}
