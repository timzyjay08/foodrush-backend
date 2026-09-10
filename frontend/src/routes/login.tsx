import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { login } from "@/api/auth";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — FoodRush" },
      { name: "description", content: "Login on FoodRush, Lagos food delivery." },
      { property: "og:title", content: "Login — FoodRush" },
      { property: "og:description", content: "Login on FoodRush, Lagos food delivery." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login({ email, password });
      signIn(result.user, result.token);
      navigate({ to: "/" });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <section className="container-page max-w-lg py-16">
        <h1 className="font-display text-3xl font-bold">Login</h1>
        <p className="mt-2 text-muted-foreground">Sign in to order, track deliveries and manage your account.</p>
        <form onSubmit={submit} className="mt-8 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <label className="block text-sm font-semibold">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3" /></label>
          <label className="block text-sm font-semibold">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3" /></label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">{loading ? "Signing in..." : "Sign in"}</button>
          <p className="text-center text-sm text-muted-foreground">New to FoodRush? <Link to="/register" className="font-semibold text-primary">Create an account</Link></p>
        </form>
      </section>
    </AppShell>
  );
}
