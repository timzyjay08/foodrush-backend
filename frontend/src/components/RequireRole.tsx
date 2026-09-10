import { Link } from "@tanstack/react-router";
import { Lock, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/data/types";

/**
 * Client-side role gate built on the existing mock/local auth state.
 * This is NOT a second auth system — it only reads useAuth().
 * Real enforcement happens on the Spring Boot API later.
 */
export type RoleName = Role | Uppercase<Role>;

const normalize = (role: RoleName) => role.toLowerCase() as Role;

export function RequireRole({
  role,
  children,
}: {
  role: RoleName | RoleName[];
  children: ReactNode;
}) {
  const { isReady, isAuthenticated, role: currentRole } = useAuth();
  const allowed = (Array.isArray(role) ? role : [role]).map(normalize);

  if (!isReady) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <GateMessage
        icon={<Lock className="size-7" aria-hidden />}
        title="Sign in to continue"
        description="This area is only available to signed-in FoodRush accounts."
        to="/login"
        cta="Go to sign in"
      />
    );
  }

  if (!currentRole || !allowed.includes(currentRole)) {
    return (
      <GateMessage
        icon={<ShieldAlert className="size-7" aria-hidden />}
        title="You don't have access"
        description={`This dashboard is for ${allowed.join(" / ")} accounts. Your account is signed in as ${currentRole ?? "unknown"}.`}
        to="/"
        cta="Back to FoodRush"
      />
    );
  }

  return <>{children}</>;
}

function GateMessage({
  icon,
  title,
  description,
  to,
  cta,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  to: "/login" | "/";
  cta: string;
}) {
  return (
    <div
      role="alert"
      className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 text-center"
    >
      <div>
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          {icon}
        </div>
        <h1 className="mt-5 font-display text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <Link
          to={to}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}
