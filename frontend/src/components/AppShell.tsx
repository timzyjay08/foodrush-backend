import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { Navbar } from "./Navbar";

export function AppShell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 pb-24 md:pb-0">{children}</main>
      {footer && <Footer />}
      <MobileBottomNav />
    </div>
  );
}
