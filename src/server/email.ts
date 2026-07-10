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

export const FROM_EMAIL = `Fresh Cutz Barbers <booking@${process.env.RESEND_EMAIL_DOMAIN ?? "freshcutzbarber.co"}>`;
export const OWNER_EMAIL = "info@freshcutzbarber.co";

// Never throws — a failed send is logged and swallowed so it can never break
// the booking flow (e.g. before the sending domain is DNS-verified).
export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    });
    if (error) {
      console.error(`[email] send failed to ${opts.to}: ${opts.subject}`, error);
    }
  } catch (err) {
    console.error(`[email] send threw to ${opts.to}: ${opts.subject}`, err);
  }
}
