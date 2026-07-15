import "server-only";
import { Resend } from "resend";

let client: Resend | undefined;

function getResend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("Missing RESEND_API_KEY");
    client = new Resend(key);
  }
  return client;
}

// `||` not `??`: an env var set to "" in Vercel is a string, so `??` would not
// fall back and the From address would build as "info@" — which Resend rejects
// with a 422 that sendEmail then swallows. Same reasoning in site-url.ts.
const EMAIL_DOMAIN = process.env.RESEND_EMAIL_DOMAIN || "freshcutzbarber.co";

export const FROM_EMAIL = `Fresh Cutz Barbers <info@${EMAIL_DOMAIN}>`;
export const OWNER_EMAIL = process.env.OWNER_EMAIL || "info@freshcutzbarber.co";

export type SendResult = { ok: true; id: string | null } | { ok: false; error: string };

// Never throws — a failed send is logged and reported in the return value so it
// can never break the booking flow (e.g. before the sending domain is
// DNS-verified). Callers that ignore the result keep the old behaviour;
// notify() reads it to write the booking_notifications row.
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    });
    if (error) {
      console.error(`[email] send failed to ${opts.to}: ${opts.subject}`, error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id ?? null };
  } catch (err) {
    console.error(`[email] send threw to ${opts.to}: ${opts.subject}`, err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
