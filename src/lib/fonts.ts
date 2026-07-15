import { Oswald, Bebas_Neue, Work_Sans, IBM_Plex_Mono } from "next/font/google";

// Oswald and Work Sans are variable fonts — omitting `weight` gives the full
// axis in one file. Bebas Neue and IBM Plex Mono are static, so `weight` is
// required or next/font throws at build time.

export const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

export const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});

export const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
  // Eyebrows and labels only — not above-the-fold critical.
  preload: false,
});

export const fontVariables = [
  oswald.variable,
  bebas.variable,
  workSans.variable,
  plexMono.variable,
].join(" ");
