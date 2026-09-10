# FoodRush — Customer Frontend (First Build)

A frontend-only food delivery marketplace. No backend will be created: no Lovable Cloud, no Supabase, no database, no server logic. Every screen renders from mock data behind a thin API layer that can later be pointed at your existing Spring Boot REST API.

## Two stack notes before we start

This project runs on Vite + React + TanStack Router (file-based routing), which is fixed on this platform and cannot be swapped for React Router. The routing behaviour you asked for is identical — same URLs, same nested layouts, same route guards — just a different import. Everything else in your stack list (Vite, React, Tailwind, TanStack Query, Axios, Lucide, mobile-first) is exactly as requested.

The template is TypeScript. I'll keep TS (files stay `.tsx`/`.ts`) since the toolchain and existing UI kit are typed; types stay light and unobtrusive so it reads like plain React.

## Design direction

Warm Nigerian-market feel, not SaaS: deep charcoal text on off-white, a hot jollof-orange primary with a fresh green accent for delivery/success states, generous rounded corners (16–24px), big food photography, soft elevation. Bold display headings paired with a clean, highly legible body face. Motion is restrained: card hover lift, sheet slide-ups, skeleton shimmer.

All colours, radii, shadows and gradients become semantic tokens in `src/styles.css` — no hardcoded colour utilities in components.

## Architecture

```text
src/
  api/        client.ts (axios + JWT interceptor), auth, restaurants, menu, cart, orders, payments
  data/       mock restaurants, menus, categories, orders, addresses
  components/ ui primitives + domain components
  hooks/      useAuth, useCart, useDebounce, query hooks
  layouts/    CustomerLayout, DashboardLayout
  routes/     file-based routes
  utils/      currency (₦ formatting), dates, status maps
```

- `src/api/client.ts`: single Axios instance on `import.meta.env.VITE_API_URL` (default `http://localhost:8080/api`), request interceptor attaching `Authorization: Bearer <token>`, response interceptor clearing the token on 401. `.env` gets `VITE_API_URL`.
- API modules expose thin, easily-editable functions (`login`, `getRestaurants`, `getRestaurant`, `placeOrder`, …). No invented endpoint semantics — each is one line to repoint.
- Mock data lives only in `src/data/` and is consumed through TanStack Query hooks, so replacing a hook's `queryFn` with the API call is the whole integration step.
- Auth: `useAuth` context storing token + role in localStorage, plus a `requireRole` route guard used by the dashboard layouts. Guards are simple role checks, nothing elaborate.
- Cart: client-side cart context persisted to localStorage.

## Design system components

Button, Input/Textarea/Select, Card, Badge/StatusBadge, Modal/Sheet, Toast (sonner), Rating, Price, QuantitySelector, EmptyState, ErrorState, LoadingSkeleton set, CategoryChip, SearchBar, FilterBar, RestaurantCard, FoodCard, CartItem, OrderCard, AddressCard, Navbar, MobileBottomNav, DashboardSidebar.

## Screens in this first build (fully designed, mock-populated)

1. Landing/Home — hero with address+search, category chips, "Fastest near you", popular restaurants, how-it-works, footer
2. Login and Register
3. Restaurant discovery/listing — search, category + rating + delivery-time filters, sorting, skeletons, empty state
4. Restaurant details — cover image, rating/delivery info, sticky menu category nav, food cards, item modal with quantity + add to cart
5. Cart — line items, quantity controls, promo field, fee breakdown, empty state
6. Checkout — address selection, delivery/pickup, payment method (mock), order summary, place order
7. Order confirmation

Navbar (desktop: logo, Home, Restaurants, Categories, Orders, Favorites, search, cart badge, profile) and MobileBottomNav (Home, Search, Orders, Favorites, Profile).

## Also scaffolded (routes + layout + placeholder content, deliberately not overbuilt)

- Customer: order tracking, order history, profile, addresses, favorites
- Restaurant: dashboard, orders, menu management, profile
- Rider: dashboard, available deliveries, active delivery, history
- Admin: dashboard, users, restaurants, orders, riders

## Routes

`/`, `/login`, `/register`, `/restaurants`, `/restaurants/:id`, `/categories`, `/cart`, `/checkout`, `/orders`, `/orders/:id`, `/favorites`, `/profile`, `/profile/addresses`, plus `/restaurant/*`, `/rider/*`, `/admin/*` dashboard trees.

## Quality

Semantic HTML, labelled inputs, accessible button names, visible focus rings, status communicated by icon + text as well as colour, keyboard-navigable menus and modals. Per-route SEO metadata. Mobile-first breakpoints with layouts genuinely rethought at tablet/desktop, not scaled down.

Food imagery will be generated so cards look like a real product rather than grey boxes.
