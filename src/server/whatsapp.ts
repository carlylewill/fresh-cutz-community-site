import "server-only";

/**
 * Meta WhatsApp Cloud API sender, dark by default.
 *
 * Mirrors sendEmail's contract deliberately: this NEVER throws. A booking must
 * never fail because a notification didn't go out — see the same reasoning in
 * email.ts. Callers get a result object and log it to booking_notifications.
 *
 * Note for enabling: business-initiated messages outside the customer's 24-hour
 * reply window require a message template pre-approved by Meta. Until templates
 * are approved, turning WHATSAPP_ENABLED on will produce template errors that
 * this module will swallow and log — it will not break bookings, but nothing
 * will be delivered either.
 */

const GRAPH_VERSION = "v21.0";

export type WhatsAppResult =
  | { status: "sent"; providerMessageId: string | null }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

export function isWhatsAppEnabled(): boolean {
  return process.env.WHATSAPP_ENABLED === "true";
}

/** E.164 without the leading +, which is what the Cloud API expects. */
function normaliseNumber(raw: string): string | null {
  const trimmed = raw.replace(/[\s()-]/g, "");
  if (/^\+?[1-9]\d{7,14}$/.test(trimmed)) return trimmed.replace(/^\+/, "");
  // UK local format — the booking form's placeholder is "07…".
  if (/^0\d{9,10}$/.test(trimmed)) return `44${trimmed.slice(1)}`;
  return null;
}

export async function sendWhatsApp(opts: { to: string; body: string }): Promise<WhatsAppResult> {
  if (!isWhatsAppEnabled()) return { status: "skipped", reason: "WHATSAPP_ENABLED is not true" };

  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) {
    return { status: "skipped", reason: "Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_ID" };
  }

  const to = normaliseNumber(opts.to);
  if (!to) return { status: "skipped", reason: `Unusable phone number: ${opts.to}` };

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: false, body: opts.body },
      }),
    });

    const json = (await res.json()) as {
      messages?: Array<{ id: string }>;
      error?: { message?: string };
    };

    if (!res.ok) {
      const error = json.error?.message ?? `HTTP ${res.status}`;
      console.error(`[whatsapp] send failed to ${to}: ${error}`);
      return { status: "failed", error };
    }
    return { status: "sent", providerMessageId: json.messages?.[0]?.id ?? null };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[whatsapp] send threw to ${to}: ${error}`);
    return { status: "failed", error };
  }
}

export function ownerWhatsAppNumber(): string | null {
  return process.env.OWNER_WHATSAPP || null;
}
