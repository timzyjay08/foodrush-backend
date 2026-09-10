import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { DashboardLayout, DashboardPlaceholder } from "@/components/DashboardLayout";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({
    meta: [
      { title: "Payments — FoodRush Admin" },
      { name: "description", content: "Settlements, payouts and transaction reconciliation." },
      { property: "og:title", content: "Payments — FoodRush Admin" },
      {
        property: "og:description",
        content: "Settlements, payouts and transaction reconciliation.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPayments,
});

function AdminPayments() {
  return (
    <DashboardLayout
      role="admin"
      title="Payments"
      description="Settlements, payouts and transaction reconciliation."
      icon={<CreditCard className="size-6" aria-hidden />}
      breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Payments" }]}
      notificationCount={3}
    >
      <DashboardPlaceholder
        points={[
          "Transaction ledger",
          "Restaurant payouts",
          "Rider payouts",
          "Failed payment retries",
        ]}
      />
    </DashboardLayout>
  );
}
