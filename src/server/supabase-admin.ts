import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Service-role client — bypasses RLS entirely. The "server-only" import above
// is the only thing keeping this out of the client bundle: importing it from a
// client component is a build error. Do not remove it — the table has RLS on
// with zero policies, so this key is the sole means of access and leaking it to
// the browser would expose every booking.

let client: ReturnType<typeof createClient<Database>> | undefined;

export function getSupabaseAdmin() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
