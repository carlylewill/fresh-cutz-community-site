import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { fontVariables } from "@/lib/fonts";
import { SmoothScrollProvider } from "@/components/motion/smooth-scroll-provider";
import { LoaderGate } from "@/components/motion/loader-gate";
import { ScissorCursor } from "@/components/cursor/scissor-cursor";
import { TicketSnip } from "@/components/flourish/ticket-snip";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://freshcutzbarber.co"),
  authors: [{ name: "Fresh Cutz Barbers" }],
  openGraph: {
    type: "website",
    siteName: "Fresh Cutz Barbers",
    locale: "en_GB",
    // metadataBase resolves this to an absolute URL — Facebook and WhatsApp's
    // scrapers reject relative ones outright, which is the classic reason a
    // shared link renders with no image at all.
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Fresh Cutz Barbers — every hair type, one chair, cut with care. Wealdstone, Harrow. 4.8 from 106 Google reviews.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.jpg"],
  },
  icons: {
    // SVG first so capable browsers get the vector; the PNGs are the fallback
    // and favicon.ico is last for legacy. All of them are generated from
    // logo.svg — the old set drifted out of sync with the site (the logo read
    // "EST. 2014" against a site that said 2015), which is what happens when
    // the marks are separate artefacts rather than one source.
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // v2 ink, replacing the old warm-brown #1c1a17 of the Fraunces design.
  themeColor: "#14171C",
};

// Runs before first paint so the preloader is suppressed at paint time rather
// than at React time. Reading sessionStorage during render would be a
// hydration mismatch; a useEffect would let the loader flash in after hydration.
const LOADER_GATE = `(function(){try{
var skip = sessionStorage.getItem('fc:loader') === 'seen'
  || matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.dataset.loader = skip ? 'skip' : 'play';
}catch(e){ document.documentElement.dataset.loader = 'play'; }})();`;

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Font variables must sit on <html>: globals.css resolves --font-display
    // from them at :root. See the comment in globals.css.
    <html lang="en" className={fontVariables}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOADER_GATE }} />
      </head>
      <body>
        <ScissorCursor />
        <TicketSnip />
        <SmoothScrollProvider>
          <LoaderGate>{children}</LoaderGate>
        </SmoothScrollProvider>
        {/* Renders nothing unless a real measurement ID is configured, so the
            old G-XXXXXXXXXX placeholder can never ship again. */}
        {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
      </body>
    </html>
  );
}
