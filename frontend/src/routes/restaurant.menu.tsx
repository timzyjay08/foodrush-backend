import { createFileRoute } from "@tanstack/react-router";
import { Utensils } from "lucide-react";
import { DashboardLayout, DashboardPlaceholder } from "@/components/DashboardLayout";

export const Route = createFileRoute("/restaurant/menu")({
  head: () => ({
    meta: [
      { title: "Menu — FoodRush Restaurant" },
      { name: "description", content: "Manage dishes, sections, pricing and availability." },
      { property: "og:title", content: "Menu — FoodRush Restaurant" },
      { property: "og:description", content: "Manage dishes, sections, pricing and availability." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RestaurantMenu,
});

function RestaurantMenu() {
  return (
    <DashboardLayout
      role="restaurant"
      title="Menu"
      description="Manage dishes, sections, pricing and availability."
      icon={<Utensils className="size-6" aria-hidden />}
      breadcrumbs={[{ label: "Restaurant", to: "/restaurant" }, { label: "Menu" }]}
      notificationCount={3}
    >
      <DashboardPlaceholder
        points={["Menu sections", "Dish availability toggles", "Price editing", "Photo uploads"]}
      />
    </DashboardLayout>
  );
}
