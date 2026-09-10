import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { DashboardLayout, DashboardPlaceholder } from "@/components/DashboardLayout";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "Orders — FoodRush Admin" },
      { name: "description", content: "Every order across the marketplace with dispute tooling." },
      { property: "og:title", content: "Orders — FoodRush Admin" },
      {
        property: "og:description",
        content: "Every order across the marketplace with dispute tooling.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOrders,
});

function AdminOrders() {
  return (
    <DashboardLayout
      role="admin"
      title="Orders"
      description="Every order across the marketplace with dispute tooling."
      icon={<ClipboardList className="size-6" aria-hidden />}
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Orders" }]}
      notificationCount={3}
    >
      <DashboardPlaceholder
        points={["Global order search", "Status timeline", "Refund actions", "Dispute notes"]}
      />
    </DashboardLayout>
  );
}
