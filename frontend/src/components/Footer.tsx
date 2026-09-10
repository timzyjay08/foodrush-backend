import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Clock3,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
} from "lucide-react";

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com/foodrushng", icon: Instagram },
  { label: "Facebook", href: "https://facebook.com/foodrushng", icon: Facebook },
  { label: "X / Twitter", href: "https://x.com/foodrushng", icon: Twitter },
  { label: "YouTube", href: "https://youtube.com/@foodrushng", icon: Youtube },
] as const;

export function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-border bg-ink text-ink-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-warning to-accent" />
      <div className="container-page py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-3" aria-label="FoodRush home">
              <span className="grid size-10 place-items-center rounded-2xl bg-primary text-lg text-primary-foreground shadow-glow">
                🍲
              </span>
              <span className="font-display text-2xl font-extrabold tracking-tight">FoodRush</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-ink-foreground/70">
              Lagos food, found fast. Discover neighborhood favorites, order in a few taps, and
              follow your meal all the way home.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink-foreground/15 bg-ink-foreground/5 px-3 py-2 text-xs font-semibold text-ink-foreground/80">
              <MapPin className="size-3.5 text-primary" aria-hidden /> Serving Lagos and growing
            </div>
            <div className="mt-7 flex items-center gap-2" aria-label="FoodRush social media">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid size-10 place-items-center rounded-full border border-ink-foreground/15 bg-ink-foreground/5 text-ink-foreground/70 transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon className="size-4" aria-hidden />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-ink-foreground/45">
              Explore
            </h2>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link
                  to="/restaurants"
                  className="text-ink-foreground/75 transition-colors hover:text-primary"
                >
                  Restaurants
                </Link>
              </li>
              <li>
                <Link
                  to="/categories"
                  className="text-ink-foreground/75 transition-colors hover:text-primary"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  to="/favorites"
                  className="text-ink-foreground/75 transition-colors hover:text-primary"
                >
                  Saved kitchens
                </Link>
              </li>
              <li>
                <Link
                  to="/orders"
                  className="text-ink-foreground/75 transition-colors hover:text-primary"
                >
                  Track an order
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-ink-foreground/45">
              Work with us
            </h2>
            <ul className="mt-5 space-y-3 text-sm text-ink-foreground/75">
              <li>
                <Link to="/register" className="inline-flex items-center gap-1 hover:text-primary">
                  List your restaurant <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </li>
              <li>
                <Link to="/register" className="inline-flex items-center gap-1 hover:text-primary">
                  Become a rider <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </li>
              <li>Business orders</li>
              <li>Careers</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-ink-foreground/45">
              Need a hand?
            </h2>
            <ul className="mt-5 space-y-3 text-sm text-ink-foreground/75">
              <li>
                <a
                  href="mailto:help@foodrush.ng"
                  className="inline-flex items-center gap-2 hover:text-primary"
                >
                  <Mail className="size-4" aria-hidden /> help@foodrush.ng
                </a>
              </li>
              <li>
                <a
                  href="tel:+2348003663787"
                  className="inline-flex items-center gap-2 hover:text-primary"
                >
                  <Phone className="size-4" aria-hidden /> +234 800 FOODRUSH
                </a>
              </li>
              <li className="inline-flex items-center gap-2">
                <Clock3 className="size-4" aria-hidden /> Mon-Sun, 8am-11pm
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-ink-foreground/10 pt-6 text-xs text-ink-foreground/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} FoodRush. All rights reserved.</p>
          <p>Made for better meals in Lagos.</p>
        </div>
      </div>
    </footer>
  );
}
