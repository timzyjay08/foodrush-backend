import type { ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

type Props = {
  title?: string;
  description?: string;
  /** Retry handler — wire to a TanStack Query refetch. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Optional secondary action, e.g. a link back to a safe page. */
  back?: ReactNode;
};

/**
 * Standard FoodRush failure state. Never surface raw API errors here — pass a
 * friendly description and keep the technical detail in the console.
 */
export function ErrorState({
  title = "We couldn't load this",
  description = "Something went wrong on our end. Please try again in a moment.",
  onRetry,
  retryLabel = "Try again",
  back,
}: Props) {
  return (
    <div
      role="alert"
      className="rounded-3xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center"
    >
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/12 text-destructive">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <h2 className="mt-5 font-display text-xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {(onRetry || back) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
            >
              <RotateCcw className="size-4" aria-hidden />
              {retryLabel}
            </button>
          )}
          {back}
        </div>
      )}
    </div>
  );
}
