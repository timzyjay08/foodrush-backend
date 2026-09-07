import { requireDashboardRole } from "@/lib/server-auth";

export default async function AdminDashboard() {
  const session = await requireDashboardRole("admin");

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Signed in as <span className="font-medium">{session.email}</span>
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Users" value="—" />
        <Stat label="Restaurants" value="—" />
        <Stat label="Orders" value="—" />
      </div>

      <p className="mt-6 rounded-lg bg-slate-100 p-4 text-sm text-slate-600">
        This route is protected by middleware and re-verified server-side. Only
        users with the <code>admin</code> role can see this page.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
