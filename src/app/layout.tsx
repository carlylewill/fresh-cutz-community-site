import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { fontVariables } from "@/lib/fonts";
import { SmoothScrollProvider } from "@/components/motion/smooth-scroll-provider";
import { LoaderGate } from "@/components/motion/loader-gate";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://freshcutzbarber.co"),
  authors: [{ name: "Fresh Cutz Barbers" }],
  openGraph: {
    type: "website",
    siteName: "Fresh Cutz Barbers",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
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
