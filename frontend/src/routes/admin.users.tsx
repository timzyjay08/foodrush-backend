import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { DashboardLayout, DashboardPlaceholder } from "@/components/DashboardLayout";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — FoodRush Admin" },
      { name: "description", content: "Customer accounts, roles and account actions." },
      { property: "og:title", content: "Users — FoodRush Admin" },
      { property: "og:description", content: "Customer accounts, roles and account actions." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminUsers,
});

function AdminUsers() {
  return (
    <DashboardLayout
      role="admin"
      title="Users"
      description="Customer accounts, roles and account actions."
      icon={<Users className="size-6" aria-hidden />}
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Users" }]}
      notificationCount={3}
    >
      <DashboardPlaceholder
        points={[
          "Account search",
          "Role assignment",
          "Suspend / reinstate",
          "Order history lookup",
        ]}
      />
    </DashboardLayout>
  );
}
