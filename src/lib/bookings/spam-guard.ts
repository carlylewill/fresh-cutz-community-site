// Cheap, dependency-free guard for the public booking entry points.
// Honeypot + minimum fill time + Origin allowlist + per-IP in-memory limit.
// Per-instance memory only (serverless): it blunts bursts, it is not a WAF.

export const HONEYPOT_FIELD = "website";
export const STARTED_FIELD = "formStartedAt";
export const MIN_FILL_MS = 2000;
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

const ALLOWED_HOSTS = new Set([
  "freshcutzbarber.co",
  "www.freshcutzbarber.co",
  "localhost",
  "127.0.0.1",
]);
const WINDOW_MS = 10 * 60_000;
const MAX_PER_IP = 8;
const hits = new Map<string, number[]>();

export type GuardInput = {
  honeypot: unknown;
  startedAt: unknown;
  origin: string | null;
  ip: string;
  now?: number;
};

export function originAllowed(origin: string | null): boolean {
  if (!origin) return false;
  try {
    return ALLOWED_HOSTS.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

/** Last x-forwarded-for hop (the one the platform appended), else x-real-ip. */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return headers.get("x-real-ip") ?? "unknown";
}

function ipLimited(ip: string, now: number): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_IP) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return false;
}

/** Returns null when the request may proceed, else a reason string (never shown to the client). */
export function checkGuard(input: GuardInput): "origin" | "honeypot" | "timing" | "rate" | null {
  const now = input.now ?? Date.now();
  if (!originAllowed(input.origin)) return "origin";
  if (typeof input.honeypot === "string" && input.honeypot.trim() !== "") return "honeypot";
  const started = Number(input.startedAt);
  if (!Number.isFinite(started)) return "timing";
  const age = now - started;
  if (age < MIN_FILL_MS || age > MAX_AGE_MS) return "timing";
  if (ipLimited(input.ip, now)) return "rate";
  return null;
}

export const GUARD_ERROR =
  "We couldn't send that. Please refresh the page and try again, or call the shop.";
