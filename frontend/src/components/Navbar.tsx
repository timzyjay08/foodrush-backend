import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, LogOut, Menu, Search, ShoppingBag, User as UserIcon, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { initials } from "@/utils/format";

const links = [
  { to: "/", label: "Home" },
  { to: "/restaurants", label: "Restaurants" },
  { to: "/categories", label: "Categories" },
  { to: "/orders", label: "Orders" },
] as const;

export function Navbar() {
  const { count } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    navigate({ to: "/restaurants", search: { q: term || undefined } });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center gap-3 md:h-20 md:gap-6">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="FoodRush home">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-lg text-primary-foreground shadow-glow">
            🍲
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">FoodRush</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === "/" }}
              activeProps={{ className: "bg-primary-soft text-foreground" }}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden max-w-sm flex-1 md:block">
          <label className="sr-only" htmlFor="nav-search">
            Search restaurants or dishes
          </label>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 shadow-soft focus-within:border-primary">
            <Search className="size-4 text-muted-foreground" aria-hidden />
            <input
              id="nav-search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Jollof, suya, shawarma…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link
            to="/favorites"
            aria-label="Favorites"
            className="hidden size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:grid"
          >
            <Heart className="size-5" aria-hidden />
          </Link>
          <Link
            to="/cart"
            aria-label={`Cart, ${count} items`}
            className="relative grid size-10 place-items-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <ShoppingBag className="size-5" aria-hidden />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden items-center gap-2 pl-1 sm:flex">
              <Link
                to="/profile"
                className="grid size-9 place-items-center rounded-full bg-ink text-xs font-bold text-ink-foreground"
                aria-label="Profile"
              >
                {initials(user.fullName)}
              </Link>
              <button
                onClick={signOut}
                aria-label="Sign out"
                className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 pl-2 sm:flex">
              <Link
                to="/login"
                className="rounded-full px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
              >
                Sign up
              </Link>
            </div>
          )}

          <button
            className="grid size-10 place-items-center rounded-full text-foreground hover:bg-muted lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-card lg:hidden">
          <nav className="container-page flex flex-col py-3" aria-label="Mobile">
            {[...links, { to: "/favorites", label: "Favorites" }].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium hover:bg-muted"
              >
                <UserIcon className="size-4" aria-hidden /> {user.fullName}
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-1 rounded-xl bg-primary px-3 py-3 text-center text-sm font-semibold text-primary-foreground"
              >
                Log in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
