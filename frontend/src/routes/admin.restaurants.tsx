import { createFileRoute } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { DashboardLayout, DashboardPlaceholder } from "@/components/DashboardLayout";

export const Route = createFileRoute("/admin/restaurants")({
  head: () => ({
    meta: [
      { title: "Restaurants — FoodRush Admin" },
      { name: "description", content: "Onboarding, verification and vendor performance." },
      { property: "og:title", content: "Restaurants — FoodRush Admin" },
      { property: "og:description", content: "Onboarding, verification and vendor performance." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminRestaurants,
});

function AdminRestaurants() {
  return (
    <DashboardLayout
      role="admin"
      title="Restaurants"
      description="Onboarding, verification and vendor performance."
      icon={<Store className="size-6" aria-hidden />}
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Restaurants" }]}
      notificationCount={3}
    >
      <DashboardPlaceholder
        points={[
          "Onboarding queue",
          "Verification checks",
          "Commission settings",
          "Performance ratings",
        ]}
      />
    </DashboardLayout>
  );
}
