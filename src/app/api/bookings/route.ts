import { createBookingCore } from "@/lib/bookings/service";
import {
  checkGuard,
  clientIp,
  GUARD_ERROR,
  HONEYPOT_FIELD,
  STARTED_FIELD,
} from "@/lib/bookings/spam-guard";

// The booking form posts through the Server Action, not this route — Next
// verifies Origin on actions, and this endpoint has no such protection. It
// exists to satisfy the documented POST /api/bookings contract. Rate limiting
// is inside createBookingCore, so both entry points share it.

const STATUS_BY_REASON = { invalid: 400, rate_limited: 429, failed: 500 } as const;

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Expected a JSON body." }, { status: 400 });
  }

  const rec = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const blocked = checkGuard({
    honeypot: rec[HONEYPOT_FIELD],
    startedAt: rec[STARTED_FIELD],
    origin: request.headers.get("origin"),
    ip: clientIp(request.headers),
  });
  if (blocked) {
    return Response.json(
      { ok: false, error: GUARD_ERROR },
      { status: blocked === "rate" ? 429 : 400 },
    );
  }

  const result = await createBookingCore(body);
  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.error },
      { status: STATUS_BY_REASON[result.reason] },
    );
  }
  return Response.json(result, { status: 201 });
}
