import type { ReactNode } from "react";
import { AppShell } from "./AppShell";
import { cn } from "@/lib/utils";

/**
 * Thin wrapper around <AppShell /> for customer-facing pages.
 * AppShell still owns the navbar, footer and mobile bottom nav — this only
 * adds the shared page container, optional title block and spacing so every
 * customer screen lines up the same way.
 */
export function CustomerLayout({
  children,
  title,
  description,
  actions,
  footer = true,
  contained = true,
  className,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  footer?: boolean;
  contained?: boolean;
  className?: string;
}) {
  return (
    <AppShell footer={footer}>
      <div className={cn(contained && "container-page py-6 md:py-10", className)}>
        {(title || actions) && (
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              {title && <h1 className="font-display text-2xl font-bold md:text-3xl">{title}</h1>}
              {description && (
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </header>
        )}
        {children}
      </div>
    </AppShell>
  );
}
