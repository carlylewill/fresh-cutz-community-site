import type { ReactNode } from "react";

export function BookingShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-16 text-foreground">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center">
        {children}
      </div>
    </div>
  );
}

export function BookingHeading({ children }: { children: ReactNode }) {
  return <h1 className="font-display text-3xl font-semibold sm:text-4xl">{children}</h1>;
}

export function BookingBackLink() {
  return (
    <a
      href="/"
      className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-full border border-brass/50 px-5 py-2 text-sm font-medium text-brass hover:bg-brass hover:text-charcoal"
    >
      Back to site
    </a>
  );
}
