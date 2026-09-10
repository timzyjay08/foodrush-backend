import { createFileRoute } from "@tanstack/react-router";
import { Bike } from "lucide-react";
import { DashboardLayout, DashboardPlaceholder } from "@/components/DashboardLayout";

export const Route = createFileRoute("/rider/profile")({
  head: () => ({
    meta: [
      { title: "Rider profile — FoodRush Rider" },
      { name: "description", content: "Vehicle, documents and availability settings." },
      { property: "og:title", content: "Rider profile — FoodRush Rider" },
      { property: "og:description", content: "Vehicle, documents and availability settings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RiderProfile,
});

function RiderProfile() {
  return (
    <DashboardLayout
      role="rider"
      title="Rider profile"
      description="Vehicle, documents and availability settings."
      icon={<Bike className="size-6" aria-hidden />}
      breadcrumbs={[{ label: "Rider", to: "/rider" }, { label: "Profile" }]}
      notificationCount={3}
    >
      <DashboardPlaceholder
        points={[
          "Vehicle details",
          "Document verification",
          "Availability schedule",
          "Bank details",
        ]}
      />
    </DashboardLayout>
  );
}
