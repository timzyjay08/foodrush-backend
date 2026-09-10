import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { DashboardLayout, DashboardPlaceholder } from "@/components/DashboardLayout";

export const Route = createFileRoute("/rider/earnings")({
  head: () => ({
    meta: [
      { title: "Earnings — FoodRush Rider" },
      { name: "description", content: "Daily and weekly earnings, tips and cash reconciliation." },
      { property: "og:title", content: "Earnings — FoodRush Rider" },
      {
        property: "og:description",
        content: "Daily and weekly earnings, tips and cash reconciliation.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RiderEarnings,
});

function RiderEarnings() {
  return (
    <DashboardLayout
      role="rider"
      title="Earnings"
      description="Daily and weekly earnings, tips and cash reconciliation."
      icon={<Wallet className="size-6" aria-hidden />}
      breadcrumbs={[{ label: "Rider", to: "/rider" }, { label: "Earnings" }]}
      notificationCount={3}
    >
      <DashboardPlaceholder
        points={[
          "Daily earnings",
          "Weekly payout cycle",
          "Tips breakdown",
          "Cash collected reconciliation",
        ]}
      />
    </DashboardLayout>
  );
}
