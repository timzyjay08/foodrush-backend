import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { register } from "@/api/auth";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — FoodRush" },
      { name: "description", content: "Register on FoodRush, Lagos food delivery." },
      { property: "og:title", content: "Register — FoodRush" },
      { property: "og:description", content: "Register on FoodRush, Lagos food delivery." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await register({ ...form, role: "customer" });
      signIn(result.user, result.token);
      navigate({ to: "/" });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <section className="container-page max-w-lg py-16">
        <h1 className="font-display text-3xl font-bold">Create your account</h1>
        <p className="mt-2 text-muted-foreground">Join FoodRush and order from your favorite kitchens.</p>
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
          {(["fullName", "email", "phone", "password"] as const).map((field) => (
            <label key={field} className="block text-sm font-semibold">
              {field === "fullName" ? "Full name" : field[0]!.toUpperCase() + field.slice(1)}
              <input required type={field === "password" ? "password" : field === "email" ? "email" : "text"} value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3" />
            </label>
          ))}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">{loading ? "Creating account..." : "Create account"}</button>
          <p className="text-center text-sm text-muted-foreground">Already registered? <Link to="/login" className="font-semibold text-primary">Sign in</Link></p>
        </form>
      </section>
    </AppShell>
  );
}
