import "server-only";
import { getSupabaseAdmin } from "@/server/supabase-admin";

const WINDOW_MINUTES = 10;
const MAX_PER_WINDOW = 3;

// Best-effort only. There is no Redis here and no DDL allowed, so this counts
// existing rows by bookings.created_at instead of a purpose-built store. That
// means: it is a SELECT-then-INSERT with no lock (two concurrent requests can
// both pass), and it keys on an attacker-chosen email (a new address buys a
// fresh budget). It stops an honest double-click or a retry storm; a Vercel WAF
// rate-limit rule on the route is the real defence.
export async function isRateLimited(customerEmail: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { count, error } = await getSupabaseAdmin()
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("customer_email", customerEmail)
    .gt("created_at", since);

  if (error) {
    // Fail open: a broken count query must not stop real customers booking.
    console.error("[bookings] rate-limit check failed", error);
    return false;
  }
  return (count ?? 0) >= MAX_PER_WINDOW;
}
