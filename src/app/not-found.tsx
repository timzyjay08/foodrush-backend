import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <section className="w-full max-w-xl rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-500">FoodRush</p>
        <h1 className="mt-4 text-5xl font-bold text-slate-900">Page not found</h1>
        <p className="mx-auto mt-4 max-w-md text-slate-600">
          The address is unavailable or may have moved. Choose a valid FoodRush page below.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-rose-500 px-5 py-3 font-semibold text-white transition hover:bg-rose-600"
          >
            Home
          </Link>
          <Link
            href="/browse"
            className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Browse restaurants
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
