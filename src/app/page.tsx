import Link from "next/link";

const endpoints: { method: string; path: string; desc: string; roles: string }[] = [
  { method: "POST", path: "/api/auth/register", desc: "Create an account (customer/restaurant/rider)", roles: "public" },
  { method: "POST", path: "/api/auth/login", desc: "Login and receive a JWT", roles: "public" },
  { method: "GET", path: "/api/auth/me", desc: "Current authenticated user", roles: "any" },
  { method: "GET", path: "/api/restaurants", desc: "List / search / filter restaurants", roles: "public" },
  { method: "GET", path: "/api/restaurants/:id", desc: "Restaurant detail + menu + options", roles: "public" },
  { method: "POST", path: "/api/restaurants", desc: "Create a restaurant", roles: "restaurant, admin" },
  { method: "GET", path: "/api/restaurants/:id/menu", desc: "List menu items with options", roles: "public" },
  { method: "GET", path: "/api/categories", desc: "List food categories with counts", roles: "public" },
  { method: "GET", path: "/api/cart", desc: "View my cart", roles: "any" },
  { method: "POST", path: "/api/cart/items", desc: "Add item to cart", roles: "any" },
  { method: "PATCH", path: "/api/cart/items/:id", desc: "Update cart item quantity", roles: "any" },
  { method: "DELETE", path: "/api/cart/items/:id", desc: "Remove cart item", roles: "any" },
  { method: "POST", path: "/api/orders", desc: "Place an order (server-priced)", roles: "customer, admin" },
  { method: "GET", path: "/api/orders", desc: "List orders (role-scoped)", roles: "any" },
  { method: "GET", path: "/api/orders/:id", desc: "Order detail + items", roles: "participant" },
  { method: "PATCH", path: "/api/orders/:id/status", desc: "Advance order state machine", roles: "role-scoped" },
  { method: "PATCH", path: "/api/orders/:id/cancel", desc: "Cancel an eligible order", roles: "owner, admin" },
  { method: "POST", path: "/api/orders/:id/assign", desc: "Assign a rider", roles: "owner, admin" },
  { method: "POST", path: "/api/payments/initialize", desc: "Initialize a payment (Paystack)", roles: "customer" },
  { method: "POST", path: "/api/payments/verify", desc: "Verify a payment", roles: "customer" },
  { method: "POST", path: "/api/payments/webhook", desc: "Paystack webhook (server-side)", roles: "provider" },
  { method: "GET", path: "/api/deliveries", desc: "List deliveries / available requests", roles: "rider, admin" },
  { method: "POST", path: "/api/deliveries", desc: "Accept a delivery request", roles: "rider" },
  { method: "PATCH", path: "/api/deliveries/:id/status", desc: "Update delivery status", roles: "rider, admin" },
  { method: "GET/PATCH", path: "/api/riders/me", desc: "Rider profile / online status", roles: "rider" },
  { method: "GET", path: "/api/reviews", desc: "List reviews (restaurant / rider)", roles: "public" },
  { method: "POST", path: "/api/reviews", desc: "Leave a review", roles: "customer, admin" },
  { method: "GET/POST", path: "/api/favorites", desc: "Manage favorite restaurants", roles: "any" },
  { method: "GET/POST", path: "/api/coupons", desc: "Manage coupons", roles: "admin" },
  { method: "GET", path: "/api/notifications", desc: "List my notifications", roles: "any" },
  { method: "GET", path: "/api/admin/analytics", desc: "Platform analytics", roles: "admin" },
  { method: "GET", path: "/api/metrics", desc: "Prometheus metrics", roles: "monitoring" },
];

const accounts = [
  { email: "admin@delivery.dev", role: "admin", color: "bg-purple-100 text-purple-700" },
  { email: "owner@delivery.dev", role: "restaurant", color: "bg-amber-100 text-amber-700" },
  { email: "rider@delivery.dev", role: "rider", color: "bg-sky-100 text-sky-700" },
  { email: "customer@delivery.dev", role: "customer", color: "bg-emerald-100 text-emerald-700" },
];

const statuses = [
  "PENDING_PAYMENT", "PAID", "RESTAURANT_ACCEPTED", "PREPARING", "READY_FOR_PICKUP",
  "RIDER_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED",
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <div className="rounded-3xl bg-gradient-to-br from-orange-500 via-rose-500 to-red-500 p-10 text-white shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-orange-100">FoodRush · Smart Food Delivery Marketplace</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">Food Delivery Backend</h1>
        <p className="mt-4 max-w-2xl text-lg text-orange-50">
          A Nigeria-focused food delivery platform backend with JWT auth, 4 roles
          (customer / restaurant / rider / admin), an 11-state order machine, Paystack
          payments, and delivery tracking — layered like a Spring Boot service.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/browse" className="rounded-full bg-white px-6 py-3 font-semibold text-rose-600 shadow hover:bg-orange-50">🍔 Open the demo app</Link>
          <a href="/api/metrics" className="rounded-full border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10">Prometheus metrics</a>
        </div>
      </div>

      <section className="mt-10 rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold">Demo accounts</h2>
        <p className="mt-1 text-sm text-slate-500">All accounts share the password <code className="rounded bg-slate-100 px-1.5 py-0.5">Password123!</code></p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {accounts.map((a) => (
            <div key={a.email} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <span className="font-mono text-sm">{a.email}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${a.color}`}>{a.role}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500">Coupons: <code className="rounded bg-slate-100 px-1.5 py-0.5">WELCOME10</code> (10%), <code className="rounded bg-slate-100 px-1.5 py-0.5">JUMBO500</code> (₦500 off).</p>
      </section>

      <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold">Order status system (single source of truth)</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {statuses.map((s, i) => (
            <span key={s} className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {s}{i < statuses.length - 1 && <span className="text-slate-400">→</span>}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-500">The backend enforces valid transitions — the frontend only reflects backend state.</p>
      </section>

      <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold">API reference</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4">Method</th>
                <th className="py-2 pr-4">Endpoint</th>
                <th className="py-2 pr-4">Description</th>
                <th className="py-2">Access</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((e) => (
                <tr key={`${e.method}-${e.path}`} className="border-b border-slate-100">
                  <td className="py-2 pr-4"><span className={`rounded px-2 py-0.5 text-xs font-bold ${methodColor(e.method)}`}>{e.method}</span></td>
                  <td className="py-2 pr-4 font-mono text-xs">{e.path}</td>
                  <td className="py-2 pr-4 text-slate-600">{e.desc}</td>
                  <td className="py-2 text-xs text-slate-500">{e.roles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-3xl bg-slate-900 p-8 text-slate-100 shadow-sm">
        <h2 className="text-xl font-bold">Golden path (quick start)</h2>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-black/40 p-4 text-xs leading-relaxed">
{`# login (customer)
curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"customer@delivery.dev","password":"Password123!"}'

# store token
TOKEN=<paste token>

# browse restaurants
curl http://localhost:3000/api/restaurants?cuisine=Nigerian

# place an order (server calculates fees in ₦)
curl -X POST http://localhost:3000/api/orders \\
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \\
  -d '{"restaurantId":1,"deliveryAddress":"12 Admiralty Way, Lekki","deliveryDistanceKm":3,"items":[{"menuItemId":1,"quantity":2}]}'

# pay (initialize -> verify, Paystack simulated)
curl -X POST http://localhost:3000/api/payments/initialize -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" -d '{"orderId":1}'`}
        </pre>
      </section>

      <footer className="mt-10 text-center text-xs text-slate-400">
        FoodRush backend — Next.js + Drizzle ORM + PostgreSQL, layered like a Spring Boot service.
      </footer>
    </main>
  );
}

function methodColor(method: string): string {
  switch (method) {
    case "GET": return "bg-emerald-100 text-emerald-700";
    case "POST": return "bg-sky-100 text-sky-700";
    case "PATCH": return "bg-amber-100 text-amber-700";
    case "DELETE": return "bg-rose-100 text-rose-700";
    default: return "bg-slate-100 text-slate-700";
  }
}
