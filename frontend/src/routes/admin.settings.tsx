import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { DashboardLayout, DashboardPlaceholder } from "@/components/DashboardLayout";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FoodRush Admin" },
      { name: "description", content: "Platform fees, zones and staff permissions." },
      { property: "og:title", content: "Settings — FoodRush Admin" },
      { property: "og:description", content: "Platform fees, zones and staff permissions." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSettings,
});

function AdminSettings() {
  return (
    <DashboardLayout
      role="admin"
      title="Settings"
      description="Platform fees, zones and staff permissions."
      icon={<Settings className="size-6" aria-hidden />}
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Settings" }]}
      notificationCount={3}
    >
      <DashboardPlaceholder
        points={[
          "Service and delivery fees",
          "Delivery zones",
          "Staff permissions",
          "Notification templates",
        ]}
      />
    </DashboardLayout>
  );
}
