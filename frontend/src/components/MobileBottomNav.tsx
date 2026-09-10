import { Link } from "@tanstack/react-router";
import { Heart, Home, Receipt, Search, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", Icon: Home, exact: true },
  { to: "/restaurants", label: "Search", Icon: Search, exact: false },
  { to: "/orders", label: "Orders", Icon: Receipt, exact: false },
  { to: "/favorites", label: "Saved", Icon: Heart, exact: false },
  { to: "/profile", label: "Profile", Icon: User, exact: false },
] as const;

export function MobileBottomNav() {
  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, Icon, exact }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact }}
              activeProps={{ className: "text-primary" }}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
