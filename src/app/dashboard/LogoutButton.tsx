"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("fr_token");
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <button
      onClick={logout}
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
    >
      Log out
    </button>
  );
}
