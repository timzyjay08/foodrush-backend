import type { ReactNode } from "react";
import Link from "next/link";
import { getSession } from "@/lib/server-auth";
import LogoutButton from "./LogoutButton";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="text-lg font-bold">
            🍽️ <span className="text-orange-500">Food</span>Rush
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {session && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {session.role}
              </span>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
