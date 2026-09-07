"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";

type Role = "customer" | "restaurant" | "rider" | "admin";
type User = { id: number; name: string; email: string; role: Role };

type Restaurant = {
  id: number;
  name: string;
  cuisine: string;
  description: string | null;
  deliveryFee: number;
  deliveryTimeMinutes: number;
  rating: number;
  isOpen: boolean;
  address: string;
};

type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  options?: { id: number; name: string; price: number }[];
};

type Order = {
  id: number;
  status: string;
  total: number;
  deliveryAddress: string;
  createdAt: string;
  restaurantId: number;
};

const CUISINE_EMOJI: Record<string, string> = {
  Nigerian: "🍛",
  Italian: "🍕",
  Japanese: "🍣",
  American: "🍔",
  Indian: "🍛",
  Mexican: "🌮",
  Chinese: "🥡",
  Continental: "🥩",
  Grills: "🍢",
  "Fast Food": "🍟",
  Pizza: "🍕",
};

function emojiFor(cuisine: string) {
  return CUISINE_EMOJI[cuisine] ?? "🍽️";
}

const STATUS_COLOR: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-700",
  paid: "bg-lime-100 text-lime-700",
  restaurant_accepted: "bg-sky-100 text-sky-700",
  preparing: "bg-indigo-100 text-indigo-700",
  ready_for_pickup: "bg-fuchsia-100 text-fuchsia-700",
  rider_assigned: "bg-cyan-100 text-cyan-700",
  picked_up: "bg-violet-100 text-violet-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
  refunded: "bg-slate-200 text-slate-700",
};

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pending payment",
  paid: "Paid",
  restaurant_accepted: "Accepted",
  preparing: "Preparing",
  ready_for_pickup: "Ready",
  rider_assigned: "Rider assigned",
  picked_up: "Picked up",
  out_for_delivery: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const ngn = (n: number) => `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

export default function BrowsePage() {
  const [token, setToken] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem("fr_token"),
  );
  const [user, setUser] = useState<User | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState("12 Admiralty Way, Lekki");
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveConnected, setLiveConnected] = useState(false);

  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : undefined), [token]);

  const notify = useCallback((kind: "ok" | "err", text: string) => {
    setMessage({ kind, text });
    window.setTimeout(() => setMessage(null), 4000);
  }, []);

  useEffect(() => {
    fetch("/api/restaurants?limit=50")
      .then((r) => r.json())
      .then((d) => {
        setRestaurants(d?.data?.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (active) setUser(d?.data?.user ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const refreshOrders = useCallback(async () => {
    if (!token) return;
    const res = await fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    setOrders(d?.data?.orders ?? []);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (active) setOrders(d?.data?.orders ?? []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [token]);

  // Real-time order tracking via Server-Sent Events.
  useEffect(() => {
    if (!token) return;
    const es = new EventSource(`/api/orders/events?token=${encodeURIComponent(token)}`);

    es.addEventListener("ready", () => setLiveConnected(true));

    es.addEventListener("orders", (e) => {
      try {
        const list = JSON.parse((e as MessageEvent).data);
        if (Array.isArray(list)) setOrders(list);
      } catch {
        /* ignore malformed frame */
      }
    });

    es.addEventListener("order", (e) => {
      try {
        const order = JSON.parse((e as MessageEvent).data) as Order;
        setOrders((prev) => {
          const idx = prev.findIndex((o) => o.id === order.id);
          if (idx === -1) return [order, ...prev];
          const next = [...prev];
          next[idx] = order;
          return next;
        });
      } catch {
        /* ignore malformed frame */
      }
    });

    es.onerror = () => setLiveConnected(false);

    return () => {
      es.close();
      setLiveConnected(false);
    };
  }, [token]);

  async function openRestaurant(r: Restaurant) {
    setSelected(r);
    setCart({});
    const res = await fetch(`/api/restaurants/${r.id}/menu`);
    const d = await res.json();
    setMenu(d?.data?.items ?? []);
  }

  function addToCart(id: number) {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  }
  function removeFromCart(id: number) {
    setCart((c) => {
      const next = { ...c };
      const q = (next[id] ?? 0) - 1;
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
  }

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartLines = useMemo(
    () => menu.filter((m) => (cart[m.id] ?? 0) > 0).map((m) => ({ ...m, qty: cart[m.id] ?? 0 })),
    [menu, cart],
  );
  const cartSubtotal = cartLines.reduce((a, l) => a + l.price * l.qty, 0);
  const serviceFee = cartSubtotal * 0.05;
  const deliveryFee = selected?.deliveryFee ?? 0;

  async function placeOrder() {
    if (!token) return notify("err", "Please log in before placing an order.");
    if (!selected || cartCount === 0) return notify("err", "Add some items to your cart first.");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        restaurantId: selected.id,
        deliveryAddress,
        deliveryDistanceKm: 3,
        items: Object.entries(cart).map(([id, quantity]) => ({ menuItemId: Number(id), quantity })),
      }),
    });
    const d = await res.json();
    if (!res.ok) return notify("err", d?.message ?? "Failed to place order");
    notify("ok", `Order #${d.data.order.id} placed — now pay to confirm.`);
    setCart({});
    refreshOrders();
  }

  async function payOrder(orderId: number) {
    const init = await fetch("/api/payments/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ orderId }),
    });
    const initData = await init.json();
    if (!init.ok) return notify("err", initData?.message ?? "Payment init failed");
    const reference = initData.data.payment.reference;
    const verify = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ reference }),
    });
    const vData = await verify.json();
    if (!verify.ok) return notify("err", vData?.message ?? "Payment failed");
    notify("ok", "Payment successful! 🎉");
    refreshOrders();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="text-2xl font-bold">
          🍽️ <span className="text-orange-500">Food</span>Rush
        </Link>
        <AuthPanel
          token={token}
          user={user}
          onAuthed={(t) => {
            setToken(t);
            localStorage.setItem("fr_token", t);
          }}
          onLogout={() => {
            setToken(null);
            setUser(null);
            localStorage.removeItem("fr_token");
          }}
        />
      </header>

      {message && (
        <div className={`mt-6 rounded-xl px-4 py-3 text-sm font-medium ${message.kind === "ok" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
          {message.text}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          {!selected ? (
            <>
              <h2 className="text-xl font-bold">Restaurants near you</h2>
              {loading ? (
                <p className="mt-4 text-slate-500">Loading…</p>
              ) : restaurants.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                  No restaurants yet. Run the seed script to load demo data.
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {restaurants.map((r) => (
                    <button key={r.id} onClick={() => openRestaurant(r)} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-start justify-between">
                        <span className="text-3xl">{emojiFor(r.cuisine)}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{r.cuisine}</span>
                      </div>
                      <h3 className="mt-3 font-semibold">{r.name}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{r.description}</p>
                      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                        <span className="text-amber-500">★ {r.rating.toFixed(1)}</span>
                        <span>⏱ {r.deliveryTimeMinutes} min</span>
                        <span>💵 {ngn(r.deliveryFee)}</span>
                        {!r.isOpen && <span className="font-semibold text-rose-500">Closed</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div>
              <button onClick={() => setSelected(null)} className="text-sm font-semibold text-orange-600 hover:underline">← Back to restaurants</button>
              <div className="mt-3 flex items-center gap-4">
                <span className="text-4xl">{emojiFor(selected.cuisine)}</span>
                <div>
                  <h2 className="text-2xl font-bold">{selected.name}</h2>
                  <p className="text-sm text-slate-500">{selected.cuisine} · ⏱ {selected.deliveryTimeMinutes} min · 💵 {ngn(selected.deliveryFee)} delivery</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {menu.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                    <div>
                      <p className="font-semibold">{m.name}</p>
                      <p className="text-sm text-slate-500">{m.description}</p>
                      {m.options && m.options.length > 0 && (
                        <p className="mt-1 text-xs text-slate-400">+ {m.options.map((o) => o.name).join(", ")}</p>
                      )}
                      <p className="mt-1 text-sm font-semibold text-orange-600">{ngn(m.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(cart[m.id] ?? 0) > 0 && (
                        <>
                          <button onClick={() => removeFromCart(m.id)} className="h-8 w-8 rounded-full bg-slate-100 font-bold">−</button>
                          <span className="w-5 text-center font-semibold">{cart[m.id]}</span>
                        </>
                      )}
                      <button onClick={() => addToCart(m.id)} className="h-8 w-8 rounded-full bg-orange-500 font-bold text-white hover:bg-orange-600">+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold">Your cart</h3>
            {cartLines.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Nothing here yet — add items from the menu.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {cartLines.map((l) => (
                  <li key={l.id} className="flex justify-between">
                    <span>{l.qty}× {l.name}</span>
                    <span className="font-medium">{ngn(l.price * l.qty)}</span>
                  </li>
                ))}
                {selected && (
                  <>
                    <li className="flex justify-between border-t pt-2 text-slate-500"><span>Delivery fee</span><span>{ngn(deliveryFee)}</span></li>
                    <li className="flex justify-between text-slate-500"><span>Service fee (5%)</span><span>{ngn(serviceFee)}</span></li>
                    <li className="flex justify-between border-t pt-2 font-bold"><span>Total</span><span>{ngn(cartSubtotal + serviceFee + deliveryFee)}</span></li>
                  </>
                )}
              </ul>
            )}
            <input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Delivery address" />
            <button onClick={placeOrder} disabled={cartCount === 0} className="mt-3 w-full rounded-xl bg-orange-500 py-2.5 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40">
              Place order ({cartCount})
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">My orders</h3>
              {token && (
                <span className={`flex items-center gap-1.5 text-xs font-medium ${liveConnected ? "text-emerald-600" : "text-slate-400"}`}>
                  <span className={`inline-block h-2 w-2 rounded-full ${liveConnected ? "animate-pulse bg-emerald-500" : "bg-slate-300"}`} />
                  {liveConnected ? "Live" : "Connecting…"}
                </span>
              )}
            </div>
            {!token ? (
              <p className="mt-2 text-sm text-slate-500">Log in to see your orders.</p>
            ) : orders.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No orders yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {orders.map((o) => (
                  <li key={o.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Order #{o.id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[o.status] ?? "bg-slate-100 text-slate-600"}`}>{STATUS_LABEL[o.status] ?? o.status}</span>
                    </div>
                    <p className="mt-1 text-slate-500">{ngn(o.total)} · {o.deliveryAddress}</p>
                    {o.status === "pending_payment" && (
                      <button onClick={() => payOrder(o.id)} className="mt-2 w-full rounded-lg bg-lime-500 py-1.5 text-xs font-semibold text-white hover:bg-lime-600">
                        Pay now (simulate Paystack)
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function AuthPanel({ token, user, onAuthed, onLogout }: { token: string | null; user: User | null; onAuthed: (t: string) => void; onLogout: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("customer@delivery.dev");
  const [password, setPassword] = useState("Password123!");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("customer");
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm">
          <span className="font-semibold">{user.name}</span>{" "}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{user.role}</span>
        </span>
        <button onClick={onLogout} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-100">Log out</button>
      </div>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login" ? { email, password } : { email, password, name, role };
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json();
    if (!res.ok) return setError(d?.message ?? "Something went wrong");
    onAuthed(d.data.token);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
        {mode === "register" && (
          <>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
              <option value="customer">Customer</option>
              <option value="restaurant">Restaurant</option>
              <option value="rider">Rider</option>
            </select>
          </>
        )}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
        <button type="submit" className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-700">{mode === "login" ? "Log in" : "Sign up"}</button>
        <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-xs text-slate-500 underline">{mode === "login" ? "Create account" : "Have an account?"}</button>
      </form>
      <GoogleSignInButton onSuccess={onAuthed} onError={setError} />
      {error && <span className="w-full text-xs text-rose-600">{error}</span>}
    </div>
  );
}

function GoogleSignInButton({ onSuccess, onError }: { onSuccess: (t: string) => void; onError: (msg: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !containerRef.current) return;

    const w = window as unknown as { google?: any };
    const render = () => {
      if (!w.google || !containerRef.current) return;
      w.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential: response.credential }),
            });
            const d = await res.json();
            if (!res.ok) {
              onError(d?.message ?? "Google sign-in failed");
              return;
            }
            onSuccess(d.data.token);
          } catch {
            onError("Google sign-in failed. Please try again.");
          }
        },
      });
      w.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: 220,
      });
    };

    const existing = document.getElementById("google-gsi-script") as HTMLScriptElement | null;
    if (w.google) {
      render();
    } else if (!existing) {
      const s = document.createElement("script");
      s.id = "google-gsi-script";
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      existing.addEventListener("load", render);
    }
  }, [clientId, onSuccess, onError]);

  // Not configured — render nothing (no error, just hidden).
  if (!clientId) return null;

  return <div ref={containerRef} className="flex min-h-[40px] items-center" />;
}
