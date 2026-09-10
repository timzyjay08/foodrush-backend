import { createFileRoute } from "@tanstack/react-router";
import { Bike } from "lucide-react";
import { DashboardLayout, DashboardPlaceholder } from "@/components/DashboardLayout";

export const Route = createFileRoute("/admin/riders")({
  head: () => ({
    meta: [
      { title: "Riders — FoodRush Admin" },
      { name: "description", content: "Rider fleet, documents and dispatch coverage." },
      { property: "og:title", content: "Riders — FoodRush Admin" },
      { property: "og:description", content: "Rider fleet, documents and dispatch coverage." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminRiders,
});

function AdminRiders() {
  return (
    <DashboardLayout
      role="admin"
      title="Riders"
      description="Rider fleet, documents and dispatch coverage."
      icon={<Bike className="size-6" aria-hidden />}
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Riders" }]}
      notificationCount={3}
    >
      <DashboardPlaceholder
        points={["Fleet roster", "Document approvals", "Coverage by area", "Delivery SLAs"]}
      />
    </DashboardLayout>
  );
}
