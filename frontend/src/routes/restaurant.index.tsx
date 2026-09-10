import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { DashboardLayout, DashboardPlaceholder } from "@/components/DashboardLayout";

export const Route = createFileRoute("/restaurant/")({
  head: () => ({
    meta: [
      { title: "Overview — FoodRush Restaurant" },
      {
        name: "description",
        content: "Track today's orders, revenue and kitchen status at a glance.",
      },
      { property: "og:title", content: "Overview — FoodRush Restaurant" },
      {
        property: "og:description",
        content: "Track today's orders, revenue and kitchen status at a glance.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RestaurantOverview,
});

function RestaurantOverview() {
  return (
    <DashboardLayout
      role="restaurant"
      title="Overview"
      description="Track today's orders, revenue and kitchen status at a glance."
      icon={<LayoutDashboard className="size-6" aria-hidden />}
      breadcrumbs={[{ label: "Restaurant" }, { label: "Overview" }]}
      notificationCount={3}
    >
      <DashboardPlaceholder
        points={[
          "Live order queue",
          "Today's revenue snapshot",
          "Kitchen open/closed toggle",
          "Top selling dishes",
        ]}
      />
    </DashboardLayout>
  );
}
