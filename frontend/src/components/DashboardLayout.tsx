import { Link, type LinkProps } from "@tanstack/react-router";
import {
  Bell,
  BarChart3,
  Bike,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Home,
  LayoutDashboard,
  Menu as MenuIcon,
  Settings,
  Star,
  Store,
  Tag,
  Ticket,
  Truck,
  User,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import { RequireRole } from "./RequireRole";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type NavItem = { to: LinkProps["to"]; label: string; Icon: ComponentType<{ className?: string }> };

export type DashboardRole = "restaurant" | "rider" | "admin";

const NAV: Record<DashboardRole, { title: string; home: LinkProps["to"]; items: NavItem[] }> = {
  restaurant: {
    title: "Restaurant",
    home: "/restaurant",
    items: [
      { to: "/restaurant", label: "Overview", Icon: LayoutDashboard },
      { to: "/restaurant/orders", label: "Orders", Icon: ClipboardList },
      { to: "/restaurant/menu", label: "Menu", Icon: Utensils },
      { to: "/restaurant/profile", label: "Profile", Icon: Store },
    ],
  },
  rider: {
    title: "Rider",
    home: "/rider",
    items: [
      { to: "/rider", label: "Overview", Icon: LayoutDashboard },
      { to: "/rider/deliveries", label: "Deliveries", Icon: Truck },
      { to: "/rider/earnings", label: "Earnings", Icon: Wallet },
      { to: "/rider/profile", label: "Profile", Icon: Bike },
    ],
  },
  admin: {
    title: "Admin",
    home: "/admin",
    items: [
      { to: "/admin", label: "Overview", Icon: LayoutDashboard },
      { to: "/admin/users", label: "Users", Icon: Users },
      { to: "/admin/restaurants", label: "Restaurants", Icon: Store },
      { to: "/admin/riders", label: "Riders", Icon: Bike },
      { to: "/admin/orders", label: "Orders", Icon: ClipboardList },
      { to: "/admin/payments", label: "Payments", Icon: CreditCard },
      { to: "/admin/coupons", label: "Coupons", Icon: Ticket },
      { to: "/admin/reviews", label: "Reviews", Icon: Star },
      { to: "/admin/analytics", label: "Analytics", Icon: BarChart3 },
      { to: "/admin/settings", label: "Settings", Icon: Settings },
    ],
  },
};

export function DashboardLayout({
  role,
  title,
  description,
  icon,
  breadcrumbs,
  actions,
  notificationCount = 0,
  children,
}: {
  role: DashboardRole;
  title: string;
  description?: string;
  icon?: ReactNode;
  breadcrumbs?: { label: string; to?: LinkProps["to"] }[];
  actions?: ReactNode;
  notificationCount?: number;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const config = NAV[role];

  const sidebar = (onNavigate?: () => void) => (
    <nav aria-label={`${config.title} navigation`} className="flex flex-col gap-1">
      {config.items.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === config.home }}
          activeProps={{ className: "bg-primary-soft text-primary" }}
          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Icon className="size-4" aria-hidden />
          <span className="truncate">{label}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <RequireRole role={role}>
      <div className="min-h-screen bg-background">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card px-4 py-6 lg:flex">
          <Link to="/" className="flex items-center gap-2 px-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-lg text-primary-foreground">
              🍲
            </span>
            <span className="font-display text-lg font-bold">
              FoodRush
              <span className="ml-1 text-xs font-semibold text-muted-foreground">
                {config.title}
              </span>
            </span>
          </Link>
          <div className="mt-6 flex-1 overflow-y-auto hide-scrollbar">{sidebar()}</div>
          <Link
            to="/"
            className="mt-4 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Home className="size-4" aria-hidden /> Back to storefront
          </Link>
        </aside>

        <div className="lg:pl-64">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-4 py-3 md:px-6">
              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                aria-expanded={mobileOpen}
                aria-label="Toggle dashboard navigation"
                className="grid size-10 place-items-center rounded-xl border border-border lg:hidden"
              >
                <MenuIcon className="size-5" aria-hidden />
              </button>

              <div className="min-w-0 flex-1">
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <ol className="flex flex-wrap items-center gap-1 text-[11px] font-medium text-muted-foreground">
                    {breadcrumbs.map((crumb, index) => (
                      <li key={crumb.label} className="flex items-center gap-1">
                        {index > 0 && <ChevronRight className="size-3" aria-hidden />}
                        {crumb.to ? (
                          <Link to={crumb.to} className="hover:text-foreground">
                            {crumb.label}
                          </Link>
                        ) : (
                          <span aria-current="page">{crumb.label}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
                <h1 className="truncate font-display text-lg font-bold md:text-xl">{title}</h1>
              </div>

              <div className="flex items-center gap-2">
                {actions}
                <button
                  type="button"
                  aria-label={`Notifications${notificationCount ? `, ${notificationCount} unread` : ""}`}
                  className="relative grid size-10 place-items-center rounded-xl border border-border text-muted-foreground hover:text-foreground"
                >
                  <Bell className="size-5" aria-hidden />
                  {notificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {notificationCount}
                    </span>
                  )}
                </button>
                <div className="flex items-center gap-2 rounded-xl border border-border px-2 py-1.5">
                  <span className="grid size-7 place-items-center rounded-lg bg-primary-soft text-primary">
                    <User className="size-4" aria-hidden />
                  </span>
                  <span className="hidden text-xs font-semibold sm:block">
                    {user?.fullName ?? "Guest"}
                    <span className="block text-[10px] font-medium text-muted-foreground">
                      {config.title}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile navigation */}
            {mobileOpen && (
              <div className="border-t border-border bg-card px-4 py-3 lg:hidden">
                {sidebar(() => setMobileOpen(false))}
              </div>
            )}
          </header>

          <main className="px-4 py-6 md:px-6 md:py-8">
            <div className="mx-auto w-full max-w-6xl">
              {(icon || description) && (
                <div className="mb-6 flex items-start gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
                  {icon && (
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                      {icon}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-display text-base font-bold">{title}</h2>
                    {description && (
                      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                    )}
                  </div>
                </div>
              )}
              {children}
            </div>
          </main>
        </div>
      </div>
    </RequireRole>
  );
}

export function DashboardPlaceholder({ points }: { points: string[] }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
      <div className="flex flex-col gap-2 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Workspace overview
          </p>
          <h3 className="mt-2 font-display text-2xl font-bold">
            Everything you need, in one place
          </h3>
        </div>
        <span className="w-fit rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent">
          Live workspace
        </span>
      </div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {points.map((point) => (
          <li
            key={point}
            className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4 text-sm transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
              <Tag className="size-3.5" aria-hidden />
            </span>
            <span>
              <strong className="block font-semibold">{point}</strong>
              <span className="mt-1 block text-xs text-muted-foreground">
                Ready for your next action
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
