import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, LogOut, MapPin, ReceiptText, User as UserIcon } from "lucide-react";
import { CustomerLayout } from "@/components/CustomerLayout";
import { EmptyState } from "@/components/EmptyState";
import { ProfileSkeleton } from "@/components/skeletons";
import { useAuth } from "@/hooks/useAuth";
import { feedback } from "@/lib/feedback";
import { initials } from "@/utils/format";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — FoodRush" },
      {
        name: "description",
        content:
          "Manage your FoodRush account details, delivery addresses, favourites and order history.",
      },
      { property: "og:title", content: "Your profile — FoodRush" },
      {
        property: "og:description",
        content: "Update your name, email and phone number for faster FoodRush checkout.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, isReady, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) setForm({ fullName: user.fullName, email: user.email, phone: user.phone });
  }, [user]);

  if (!isReady) {
    return (
      <CustomerLayout title="Your profile">
        <ProfileSkeleton />
      </CustomerLayout>
    );
  }

  if (!user) {
    return (
      <CustomerLayout title="Your profile">
        <EmptyState
          icon={UserIcon}
          title="You're not signed in"
          description="Sign in to manage your details, addresses and order history."
          action={
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow"
            >
              Sign in
            </Link>
          }
        />
      </CustomerLayout>
    );
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const nextErrors: Record<string, string> = {};
    if (!form.fullName.trim()) nextErrors["fullName"] = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors["email"] = "Enter a valid email";
    if (form.phone.trim().length < 7) nextErrors["phone"] = "Enter a valid phone number";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      feedback.error("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      signIn({
        ...user,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      setSaving(false);
      feedback.saved("Profile");
    }, 450);
  };

  return (
    <CustomerLayout
      title="Your profile"
      description="Keep your contact details up to date so riders can always reach you."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form
          onSubmit={submit}
          className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6"
        >
          <div className="flex items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary-soft font-display text-xl font-bold text-primary">
              {initials(user.fullName)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg font-bold">{user.fullName}</h2>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field
              label="Full name"
              value={form.fullName}
              onChange={(value) => setForm((prev) => ({ ...prev, fullName: value }))}
              error={errors["fullName"]}
            />
            <Field
              label="Phone number"
              type="tel"
              value={form.phone}
              onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
              error={errors["phone"]}
            />
            <div className="sm:col-span-2">
              <Field
                label="Email address"
                type="email"
                value={form.email}
                onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
                error={errors["email"]}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving && (
              <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
            )}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>

        <aside className="space-y-3">
          <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Shortcuts
            </h2>
            <nav className="mt-3 space-y-1.5">
              <ShortcutLink to="/orders" icon={ReceiptText} label="Order history" />
              <ShortcutLink to="/addresses" icon={MapPin} label="Delivery addresses" />
              <ShortcutLink to="/favorites" icon={Heart} label="Favourites" />
            </nav>
          </div>

          <button
            type="button"
            onClick={() => {
              signOut();
              feedback.info("Signed out", "See you soon on FoodRush.");
              navigate({ to: "/" });
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted hover:text-destructive"
          >
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </aside>
      </div>
    </CustomerLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
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

function ShortcutLink({
  to,
  icon: Icon,
  label,
}: {
  to: "/orders" | "/addresses" | "/favorites";
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
    >
      <Icon className="size-4 text-primary" />
      {label}
    </Link>
  );
}
