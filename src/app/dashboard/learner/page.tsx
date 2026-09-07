import { requireDashboardRole } from "@/lib/server-auth";

export default async function LearnerDashboard() {
  const session = await requireDashboardRole("learner");

  return (
    <div>
      <h1 className="text-2xl font-bold">Learner Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Signed in as <span className="font-medium">{session.email}</span>
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card title="My courses" body="Your enrolled courses will appear here." />
        <Card title="Upcoming sessions" body="Mentor sessions and deadlines." />
      </div>

      <p className="mt-6 rounded-lg bg-slate-100 p-4 text-sm text-slate-600">
        Protected by middleware. Only users with the <code>learner</code> role
        can see this page — mentors and admins are redirected to their own dashboards.
      </p>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </div>
  );
}
