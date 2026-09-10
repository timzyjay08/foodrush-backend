import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Plus, X } from "lucide-react";
import { useState } from "react";
import { AddressCard } from "@/components/AddressCard";
import { CustomerLayout } from "@/components/CustomerLayout";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { useAddresses, type AddressInput } from "@/hooks/useAddresses";
import { feedback } from "@/lib/feedback";
import type { Address } from "@/data/types";

export const Route = createFileRoute("/addresses")({
  head: () => ({
    meta: [
      { title: "Delivery addresses — FoodRush" },
      {
        name: "description",
        content: "Manage the Lagos addresses FoodRush riders deliver your orders to.",
      },
      { property: "og:title", content: "Delivery addresses — FoodRush" },
      {
        property: "og:description",
        content: "Save home, work and other drop-off spots for faster FoodRush checkout.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddressesPage,
});

const EMPTY_FORM: AddressInput = {
  label: "",
  street: "",
  area: "",
  city: "Lagos",
  instructions: "",
};

function AddressesPage() {
  const book = useAddresses();
  const [editing, setEditing] = useState<Address | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AddressInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    const address = book.addresses.find((item) => item.id === id);
    if (!address) return;
    setEditing(address);
    setForm({
      label: address.label,
      street: address.street,
      area: address.area,
      city: address.city,
      instructions: address.instructions ?? "",
    });
    setErrors({});
    setFormOpen(true);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const nextErrors: Record<string, string> = {};
    if (!form.label.trim()) nextErrors["label"] = "Give this address a label";
    if (!form.street.trim()) nextErrors["street"] = "Enter the street address";
    if (!form.area.trim()) nextErrors["area"] = "Enter the area";
    if (!form.city.trim()) nextErrors["city"] = "Enter the city";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      feedback.error("Please complete the highlighted fields.");
      return;
    }

    setSaving(true);
    const payload: AddressInput = {
      label: form.label.trim(),
      street: form.street.trim(),
      area: form.area.trim(),
      city: form.city.trim(),
      instructions: form.instructions?.trim() ?? "",
    };
    window.setTimeout(() => {
      if (editing) book.update(editing.id, payload);
      else book.add(payload);
      setSaving(false);
      setFormOpen(false);
      setEditing(null);
      feedback.saved(`${payload.label} address`);
    }, 400);
  };

  return (
    <CustomerLayout
      title="Delivery addresses"
      description="Pick a default drop-off spot so checkout stays a two-tap job."
      actions={
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
        >
          <Plus className="size-4" aria-hidden /> New address
        </button>
      }
    >
      {formOpen && (
        <form
          onSubmit={submit}
          className="mb-6 rounded-3xl border border-border bg-card p-5 shadow-soft"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg font-bold">
              {editing ? `Edit ${editing.label}` : "New address"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditing(null);
              }}
              aria-label="Close address form"
              className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Label"
              placeholder="Home, Work…"
              value={form.label}
              onChange={(value) => setForm((prev) => ({ ...prev, label: value }))}
              error={errors["label"]}
            />
            <Field
              label="Area"
              placeholder="Lekki Phase 1"
              value={form.area}
              onChange={(value) => setForm((prev) => ({ ...prev, area: value }))}
              error={errors["area"]}
            />
            <div className="sm:col-span-2">
              <Field
                label="Street address"
                placeholder="12 Admiralty Way"
                value={form.street}
                onChange={(value) => setForm((prev) => ({ ...prev, street: value }))}
                error={errors["street"]}
              />
            </div>
            <Field
              label="City"
              value={form.city}
              onChange={(value) => setForm((prev) => ({ ...prev, city: value }))}
              error={errors["city"]}
            />
            <Field
              label="Rider instructions (optional)"
              placeholder="Call on arrival, gate 3"
              value={form.instructions ?? ""}
              onChange={(value) => setForm((prev) => ({ ...prev, instructions: value }))}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-glow disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving && (
              <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
            )}
            {saving ? "Saving…" : editing ? "Update address" : "Save address"}
          </button>
        </form>
      )}

      {book.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-start gap-3">
                <Skeleton className="size-10 shrink-0 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : book.addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Add a delivery address and it will show up here for every future order."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={openNew}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow"
              >
                <Plus className="size-4" aria-hidden /> Add address
              </button>
              <Link
                to="/restaurants"
                className="inline-flex items-center justify-center rounded-full border border-border px-5 py-3 text-sm font-semibold hover:bg-muted"
              >
                Browse restaurants
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {book.addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              selectable={!address.isDefault}
              selected={Boolean(address.isDefault)}
              onSelect={() => {
                book.setDefault(address.id);
                feedback.saved(`${address.label} set as default`);
              }}
              onEdit={openEdit}
              onDelete={() => {
                book.remove(address.id);
                feedback.deleted(`${address.label} address`);
              }}
            />
          ))}
        </div>
      )}
    </CustomerLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className={`mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary ${
          error ? "border-destructive" : "border-border"
        }`}
      />
      {error && <span className="mt-1 block text-xs font-semibold text-destructive">{error}</span>}
    </label>
  );
}
