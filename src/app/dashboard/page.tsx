import { redirect } from "next/navigation";
import { getSession } from "@/lib/server-auth";
import { homePathForRole } from "@/lib/authz";

/** Landing route for /dashboard — redirects to the role-specific dashboard. */
export default async function DashboardIndex() {
  const session = await getSession();
  redirect(homePathForRole(session?.role));
}
