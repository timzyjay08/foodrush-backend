import { createFileRoute } from "@tanstack/react-router";
import { Ticket } from "lucide-react";
import { DashboardLayout, DashboardPlaceholder } from "@/components/DashboardLayout";

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({
    meta: [
      { title: "Coupons — FoodRush Admin" },
      { name: "description", content: "Promo codes, campaigns and redemption limits." },
      { property: "og:title", content: "Coupons — FoodRush Admin" },
      { property: "og:description", content: "Promo codes, campaigns and redemption limits." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCoupons,
});

function AdminCoupons() {
  return (
    <DashboardLayout
      role="admin"
      title="Coupons"
      description="Promo codes, campaigns and redemption limits."
      icon={<Ticket className="size-6" aria-hidden />}
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Coupons" }]}
      notificationCount={3}
    >
      <DashboardPlaceholder
        points={[
          "Create promo codes",
          "Usage limits",
          "Campaign scheduling",
          "Redemption analytics",
        ]}
      />
    </DashboardLayout>
  );
}
