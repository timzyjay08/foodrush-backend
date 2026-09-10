import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { DashboardLayout, DashboardPlaceholder } from "@/components/DashboardLayout";

export const Route = createFileRoute("/rider/")({
  head: () => ({
    meta: [
      { title: "Overview — FoodRush Rider" },
      {
        name: "description",
        content: "Your shift at a glance — assignments, distance and payouts.",
      },
      { property: "og:title", content: "Overview — FoodRush Rider" },
      {
        property: "og:description",
        content: "Your shift at a glance — assignments, distance and payouts.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RiderOverview,
});

function RiderOverview() {
  return (
    <DashboardLayout
      role="rider"
      title="Overview"
      description="Your shift at a glance — assignments, distance and payouts."
      icon={<LayoutDashboard className="size-6" aria-hidden />}
      breadcrumbs={[{ label: "Rider" }, { label: "Overview" }]}
      notificationCount={3}
    >
      <DashboardPlaceholder
        points={[
          "Go online / offline",
          "Active assignment card",
          "Distance covered today",
          "Payout summary",
        ]}
      />
    </DashboardLayout>
  );
}
