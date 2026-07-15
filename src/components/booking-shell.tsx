import type { ReactNode } from "react";

// The chrome for the owner/customer token pages — what Baggio sees when he
// approves a booking from his email. v1 tokens (background/card/border/charcoal)
// no longer exist in the v2 theme, so Tailwind was silently dropping those
// classes and rendering these pages unstyled.

export function BookingShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-ink text-paper flex min-h-screen items-center justify-center px-5 py-16">
      <div className="border-line bg-ink-soft w-full max-w-lg rounded-lg border p-8 text-center">
        {children}
      </div>
    </div>
  );
}

export function BookingHeading({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-display text-3xl font-bold tracking-wide uppercase sm:text-4xl">
      {children}
    </h1>
  );
}

export function BookingBackLink() {
  return (
    <a
      href="/"
      className="border-line text-brass hover:bg-brass hover:text-ink font-display mt-8 inline-flex min-h-[44px] items-center justify-center rounded-xs border px-5 py-2 text-xs font-semibold tracking-[0.22em] uppercase transition-colors"
    >
      Back to site
    </a>
  );
}
