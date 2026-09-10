import { createFileRoute } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { DashboardLayout, DashboardPlaceholder } from "@/components/DashboardLayout";

export const Route = createFileRoute("/restaurant/profile")({
  head: () => ({
    meta: [
      { title: "Restaurant profile — FoodRush Restaurant" },
      { name: "description", content: "Opening hours, delivery zones, payouts and branding." },
      { property: "og:title", content: "Restaurant profile — FoodRush Restaurant" },
      {
        property: "og:description",
        content: "Opening hours, delivery zones, payouts and branding.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RestaurantProfile,
});

function RestaurantProfile() {
  return (
    <DashboardLayout
      role="restaurant"
      title="Restaurant profile"
      description="Opening hours, delivery zones, payouts and branding."
      icon={<Store className="size-6" aria-hidden />}
      breadcrumbs={[{ label: "Restaurant", to: "/restaurant" }, { label: "Profile" }]}
      notificationCount={3}
    >
      <DashboardPlaceholder
        points={["Opening hours", "Delivery zones", "Payout details", "Brand assets"]}
      />
    </DashboardLayout>
  );
}
