import { requireDashboardRole } from "@/lib/server-auth";

export default async function MentorDashboard() {
  const session = await requireDashboardRole("mentor");

  return (
    <div>
      <h1 className="text-2xl font-bold">Mentor Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Signed in as <span className="font-medium">{session.email}</span>
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card title="My learners" body="Learners assigned to you." />
        <Card title="Session requests" body="Pending mentorship requests." />
      </div>

      <p className="mt-6 rounded-lg bg-slate-100 p-4 text-sm text-slate-600">
        Protected by middleware. Only users with the <code>mentor</code> role
        can see this page.
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
