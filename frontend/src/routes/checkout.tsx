import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, Banknote, CreditCard, Landmark, Loader2, MapPin, Plus } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { QuantitySelector } from "@/components/QuantitySelector";
import { submitOrder } from "@/api/orders";
import type { OrderDraft } from "@/api/orders.local";
import type { PaymentMethod } from "@/data/types";
import { addressesQuery, restaurantQuery } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { formatDeliveryWindow, formatNaira } from "@/utils/format";

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  hint: string;
  icon: typeof CreditCard;
}[] = [
  {
    id: "card",
    label: "Card",
    hint: "Pay securely with Visa, Mastercard or Verve",
    icon: CreditCard,
  },
  { id: "transfer", label: "Bank transfer", hint: "Get a one-time account number", icon: Landmark },
  {
    id: "cash",
    label: "Cash on delivery",
    hint: "Pay the rider when your food arrives",
    icon: Banknote,
  },
];

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — FoodRush" },
      {
        name: "description",
        content:
          "Confirm your delivery address, choose how to pay and place your FoodRush order in Lagos.",
      },
      { property: "og:title", content: "Checkout — FoodRush" },
      {
        property: "og:description",
        content: "Confirm delivery details and place your FoodRush order.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const addresses = useQuery(addressesQuery());
  const restaurant = useQuery({
    ...restaurantQuery(cart.restaurantId ?? ""),
    enabled: Boolean(cart.restaurantId),
  });

  const [addressId, setAddressId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
    label: "",
    street: "",
    area: "",
    instructions: "",
  });
  const [useNew, setUseNew] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod | null>("card");
  const [formError, setFormError] = useState<string | null>(null);

  const placeOrderMutation = useMutation({
    mutationFn: (draft: OrderDraft) => submitOrder(draft),
    onSuccess: (order) => {
      cart.clear();
      navigate({ to: "/order-confirmation" });
      void order;
    },
  });

  const submitting = placeOrderMutation.isPending;
  const list = addresses.data ?? [];
  const selectedId = addressId ?? list.find((item) => item.isDefault)?.id ?? list[0]?.id ?? null;
  const deliveryFee = restaurant.data?.deliveryFee ?? 800;
  const total = cart.subtotal + cart.serviceFee + deliveryFee;

  if (cart.lines.length === 0) {
    return (
      <AppShell>
        <section className="container-page py-12 md:py-16">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Checkout</h1>
          <div className="mt-8">
            <EmptyState
              emoji="🧾"
              title="Nothing to check out"
              description="Your cart is empty — pick a kitchen and add a few dishes first."
              action={
                <Link
                  to="/restaurants"
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
                >
                  Browse restaurants
                </Link>
              }
            />
          </div>
        </section>
      </AppShell>
    );
  }

  function placeOrder(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return; // prevent duplicate submissions

    if (cart.lines.length === 0) {
      setFormError("Your cart is empty — add a few dishes before placing an order.");
      return;
    }

    let address: string | null = null;
    if (useNew) {
      if (!newAddress.street.trim() || !newAddress.area.trim()) {
        setFormError("Add a street address and area for your new delivery address.");
        return;
      }
      address = `${newAddress.street.trim()}, ${newAddress.area.trim()}, Lagos`;
    } else {
      const found = list.find((item) => item.id === selectedId);
      if (!found) {
        setFormError("Select a delivery address to continue.");
        return;
      }
      address = `${found.street}, ${found.area}, ${found.city}`;
    }

    if (!payment) {
      setFormError("Choose how you'd like to pay.");
      return;
    }

    setFormError(null);
    placeOrderMutation.mutate({
      restaurantId: cart.restaurantId ?? "",
      restaurantName: restaurant.data?.name ?? "FoodRush kitchen",
      restaurantImage: restaurant.data?.imageUrl ?? "",
      items: cart.lines.map((line) => ({
        menuItemId: line.menuItemId,
        name: line.name,
        quantity: line.quantity,
        price: line.price,
      })),
      subtotal: cart.subtotal,
      deliveryFee,
      serviceFee: cart.serviceFee,
      total,
      address,
      paymentMethod: payment,
      etaMinutes: restaurant.data?.deliveryMinutes[1] ?? 35,
    });
  }

  return (
    <AppShell>
      <form
        onSubmit={placeOrder}
        className="container-page grid gap-8 py-10 md:py-14 lg:grid-cols-[1fr_360px]"
      >
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Checkout</h1>
            <p className="mt-2 text-muted-foreground">
              {user ? `Delivering for ${user.fullName}` : "Confirm your delivery details and pay."}
            </p>
          </div>

          <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <MapPin className="size-4 text-primary" aria-hidden /> Delivery address
            </h2>
            <div className="mt-4 space-y-3">
              {list.map((address) => (
                <label
                  key={address.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                    !useNew && selectedId === address.id
                      ? "border-primary bg-primary-soft"
                      : "border-border hover:bg-muted/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    className="mt-1 accent-current"
                    checked={!useNew && selectedId === address.id}
                    onChange={() => {
                      setUseNew(false);
                      setAddressId(address.id);
                    }}
                  />
                  <span className="text-sm">
                    <span className="font-semibold">{address.label}</span>
                    <span className="block text-muted-foreground">
                      {address.street}, {address.area}, {address.city}
                    </span>
                    {address.instructions && (
                      <span className="block text-xs text-muted-foreground">
                        {address.instructions}
                      </span>
                    )}
                  </span>
                </label>
              ))}

              <button
                type="button"
                onClick={() => setUseNew((value) => !value)}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
              >
                <Plus className="size-4" aria-hidden /> Use a new address
              </button>

              {useNew && (
                <div className="grid gap-3 rounded-2xl border border-primary bg-primary-soft/50 p-4 sm:grid-cols-2">
                  <Field
                    label="Label"
                    value={newAddress.label}
                    onChange={(value) => setNewAddress((prev) => ({ ...prev, label: value }))}
                    placeholder="Home"
                  />
                  <Field
                    label="Area"
                    value={newAddress.area}
                    required
                    onChange={(value) => setNewAddress((prev) => ({ ...prev, area: value }))}
                    placeholder="Lekki Phase 1"
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Street address"
                      value={newAddress.street}
                      required
                      onChange={(value) => setNewAddress((prev) => ({ ...prev, street: value }))}
                      placeholder="12 Admiralty Way"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Field
                      label="Rider instructions"
                      value={newAddress.instructions}
                      onChange={(value) =>
                        setNewAddress((prev) => ({ ...prev, instructions: value }))
                      }
                      placeholder="Call on arrival, black gate"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg font-bold">Payment method</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.id}
                  className={`cursor-pointer rounded-2xl border p-4 transition-colors ${
                    payment === method.id
                      ? "border-primary bg-primary-soft"
                      : "border-border hover:bg-muted/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="sr-only"
                    checked={payment === method.id}
                    onChange={() => setPayment(method.id)}
                  />
                  <method.icon className="size-5 text-primary" aria-hidden />
                  <span className="mt-2 block text-sm font-semibold">{method.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{method.hint}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside>
          <div className="sticky top-24 rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg font-bold">Order summary</h2>
            {restaurant.data && (
              <p className="mt-1 text-sm text-muted-foreground">
                {restaurant.data.name} · {formatDeliveryWindow(restaurant.data.deliveryMinutes)}
              </p>
            )}
            <ul className="mt-4 space-y-3 text-sm">
              {cart.lines.map((line) => (
                <li key={line.menuItemId} className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{line.name}</span>
                    <span className="mt-1.5 block">
                      <QuantitySelector
                        value={line.quantity}
                        min={0}
                        onChange={(value) => cart.setQuantity(line.menuItemId, value)}
                      />
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold">
                    {formatNaira(line.price * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <Row label="Subtotal" value={formatNaira(cart.subtotal)} />
              <Row label="Delivery fee" value={formatNaira(deliveryFee)} />
              <Row label="Service fee" value={formatNaira(cart.serviceFee)} />
              <Row label="Total" value={formatNaira(total)} strong />
            </dl>
            {(formError || placeOrderMutation.isError) && (
              <p
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-2xl bg-destructive/10 px-3.5 py-3 text-sm font-medium text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  {formError ??
                    "We couldn't place your order. Your cart is safe — please try again."}
                </span>
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden /> Placing order…
                </>
              ) : (
                `Place order · ${formatNaira(total)}`
              )}
            </button>
          </div>
        </aside>
      </form>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">{label}</span>
      <input
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "text-base font-bold" : ""}`}>
      <dt className={strong ? "" : "text-muted-foreground"}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
