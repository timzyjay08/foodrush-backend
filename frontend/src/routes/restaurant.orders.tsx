import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { DashboardLayout, DashboardPlaceholder } from "@/components/DashboardLayout";

export const Route = createFileRoute("/restaurant/orders")({
  head: () => ({
    meta: [
      { title: "Orders — FoodRush Restaurant" },
      { name: "description", content: "Accept, prepare and hand off customer orders to riders." },
      { property: "og:title", content: "Orders — FoodRush Restaurant" },
      {
        property: "og:description",
        content: "Accept, prepare and hand off customer orders to riders.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RestaurantOrders,
});

function RestaurantOrders() {
  return (
    <DashboardLayout
      role="restaurant"
      title="Orders"
      description="Accept, prepare and hand off customer orders to riders."
      icon={<ClipboardList className="size-6" aria-hidden />}
      breadcrumbs={[{ label: "Restaurant", to: "/restaurant" }, { label: "Orders" }]}
      notificationCount={3}
    >
      <DashboardPlaceholder
        points={[
          "Incoming order alerts",
          "Accept / reject flow",
          "Preparation timers",
          "Rider handover confirmation",
        ]}
      />
    </DashboardLayout>
  );
}
