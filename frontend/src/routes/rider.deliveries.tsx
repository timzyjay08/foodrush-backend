import { createFileRoute } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { DashboardLayout, DashboardPlaceholder } from "@/components/DashboardLayout";

export const Route = createFileRoute("/rider/deliveries")({
  head: () => ({
    meta: [
      { title: "Deliveries — FoodRush Rider" },
      { name: "description", content: "Pick up, navigate and complete FoodRush deliveries." },
      { property: "og:title", content: "Deliveries — FoodRush Rider" },
      {
        property: "og:description",
        content: "Pick up, navigate and complete FoodRush deliveries.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RiderDeliveries,
});

function RiderDeliveries() {
  return (
    <DashboardLayout
      role="rider"
      title="Deliveries"
      description="Pick up, navigate and complete FoodRush deliveries."
      icon={<Truck className="size-6" aria-hidden />}
      breadcrumbs={[{ label: "Rider", to: "/rider" }, { label: "Deliveries" }]}
      notificationCount={3}
    >
      <DashboardPlaceholder
        points={[
          "Assigned deliveries",
          "Pickup confirmation",
          "Navigation handoff",
          "Proof of delivery",
        ]}
      />
    </DashboardLayout>
  );
}
