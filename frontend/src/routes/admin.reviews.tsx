import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { DashboardLayout, DashboardPlaceholder } from "@/components/DashboardLayout";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews — FoodRush Admin" },
      { name: "description", content: "Moderate customer reviews and vendor responses." },
      { property: "og:title", content: "Reviews — FoodRush Admin" },
      { property: "og:description", content: "Moderate customer reviews and vendor responses." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminReviews,
});

function AdminReviews() {
  return (
    <DashboardLayout
      role="admin"
      title="Reviews"
      description="Moderate customer reviews and vendor responses."
      icon={<Star className="size-6" aria-hidden />}
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Reviews" }]}
      notificationCount={3}
    >
      <DashboardPlaceholder
        points={["Review moderation queue", "Flagged content", "Vendor responses", "Rating trends"]}
      />
    </DashboardLayout>
  );
}
