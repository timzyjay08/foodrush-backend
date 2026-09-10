import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { DashboardLayout, DashboardPlaceholder } from "@/components/DashboardLayout";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Overview — FoodRush Admin" },
      {
        name: "description",
        content: "Marketplace health across customers, restaurants and riders.",
      },
      { property: "og:title", content: "Overview — FoodRush Admin" },
      {
        property: "og:description",
        content: "Marketplace health across customers, restaurants and riders.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOverview,
});

function AdminOverview() {
  return (
    <DashboardLayout
      role="admin"
      title="Overview"
      description="Marketplace health across customers, restaurants and riders."
      icon={<LayoutDashboard className="size-6" aria-hidden />}
      breadcrumbs={[{ label: "Admin" }, { label: "Overview" }]}
      notificationCount={3}
    >
      <DashboardPlaceholder
        points={[
          "GMV and order volume",
          "Active restaurants",
          "Rider utilisation",
          "Support escalations",
        ]}
      />
    </DashboardLayout>
  );
}
