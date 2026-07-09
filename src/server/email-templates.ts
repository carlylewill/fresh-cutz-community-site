import type { Booking } from "./types";
import { formatDate, formatTime } from "@/lib/format-date";

const CHARCOAL = "#1c1917";
const CHARCOAL_2 = "#262220";
const BRASS = "#d4af6a";
const BONE = "#f2ead9";
const CRIMSON = "#8a2f27";

const PHONE_DISPLAY = "07415 409277";
const ADDRESS = "18 Canning Road, Wealdstone, Harrow, HA3 7SJ";

function servicesLines(services: Booking["services"]): string {
  return services
    .map(
      (s) =>
        `<tr><td style="padding:6px 0;color:${BONE};font-size:15px;">${escapeHtml(s.name)}</td><td style="padding:6px 0;color:${BRASS};font-size:15px;text-align:right;">from &pound;${s.priceFrom}</td></tr>`,
    )
    .join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function button(label: string, url: string, variant: "brass" | "crimson" | "neutral"): string {
  const styles = {
    brass: `background:${BRASS};color:${CHARCOAL};`,
    crimson: `background:transparent;color:${CRIMSON};border:1.5px solid ${CRIMSON};`,
    neutral: `background:transparent;color:${BONE};border:1.5px solid rgba(242,234,217,0.4);`,
  }[variant];
  return `<a href="${url}" style="display:inline-block;margin:6px 8px 6px 0;padding:12px 22px;border-radius:999px;font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;${styles}">${label}</a>`;
}

function layout(opts: { preheader: string; title: string; bodyHtml: string }): string {
  return `<!doctype html>
<html>
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(opts.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${CHARCOAL_2};font-family:-apple-system,Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:${CHARCOAL_2};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(opts.preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CHARCOAL_2};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${CHARCOAL};border-radius:16px;overflow:hidden;border:1px solid rgba(212,175,106,0.25);">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid rgba(212,175,106,0.25);">
                <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:${BONE};">
                  Fresh Cutz <span style="color:${BRASS};">Barbers</span>
                </p>
                <p style="margin:4px 0 0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${BRASS};">Wealdstone, Harrow</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${opts.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid rgba(212,175,106,0.15);">
                <p style="margin:0;font-size:12px;color:rgba(242,234,217,0.5);">
                  ${ADDRESS} &middot; ${PHONE_DISPLAY}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function bookingSummaryTable(booking: Booking, dateLabel: string, timeLabel: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:${CHARCOAL_2};border-radius:12px;padding:18px 20px;">
      ${servicesLines(booking.services)}
      <tr><td colspan="2" style="border-top:1px solid rgba(212,175,106,0.2);padding-top:10px;margin-top:10px;"></td></tr>
      <tr>
        <td style="padding-top:10px;color:${BONE};font-size:15px;font-weight:600;">Total</td>
        <td style="padding-top:10px;color:${BRASS};font-size:15px;font-weight:600;text-align:right;">from &pound;${booking.total_price_from}</td>
      </tr>
    </table>
    <p style="margin:0 0 4px;color:${BONE};font-size:15px;"><strong style="color:${BRASS};">When:</strong> ${dateLabel} at ${timeLabel}</p>
    ${booking.preferred_barber ? `<p style="margin:0 0 4px;color:${BONE};font-size:15px;"><strong style="color:${BRASS};">Barber:</strong> ${booking.preferred_barber === "baggio" ? "Baggio" : "Rahul"}</p>` : ""}
  `;
}

export function customerThankYouEmail(booking: Booking): { subject: string; html: string } {
  const dateLabel = formatDate(booking.preferred_date);
  const timeLabel = formatTime(booking.preferred_time);
  return {
    subject: "We've got your booking request — Fresh Cutz Barbers",
    html: layout({
      preheader: "We'll confirm your appointment shortly.",
      title: "Booking received",
      bodyHtml: `
        <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:20px;color:${BONE};">Thanks, ${escapeHtml(booking.customer_name)}.</p>
        <p style="margin:0 0 18px;color:rgba(242,234,217,0.75);font-size:15px;line-height:1.5;">
          We've got your booking request. Baggio will personally confirm, decline, or suggest a
          better time — you'll hear back shortly.
        </p>
        ${bookingSummaryTable(booking, dateLabel, timeLabel)}
        <p style="margin:20px 0 0;color:rgba(242,234,217,0.6);font-size:13px;">
          Need to change something before we confirm? Call or text ${PHONE_DISPLAY}.
        </p>
      `,
    }),
  };
}

export function ownerNewBookingEmail(
  booking: Booking,
  links: { approveUrl: string; rejectUrl: string; proposeUrl: string },
): { subject: string; html: string } {
  const dateLabel = formatDate(booking.preferred_date);
  const timeLabel = formatTime(booking.preferred_time);
  return {
    subject: `New booking request — ${booking.customer_name} — ${dateLabel}`,
    html: layout({
      preheader: `${booking.customer_name} wants to book ${dateLabel} at ${timeLabel}`,
      title: "New booking request",
      bodyHtml: `
        <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:20px;color:${BONE};">New booking request</p>
        <p style="margin:0 0 18px;color:rgba(242,234,217,0.75);font-size:15px;">
          <strong style="color:${BONE};">${escapeHtml(booking.customer_name)}</strong> &middot;
          ${escapeHtml(booking.customer_email)}${booking.customer_phone ? ` &middot; ${escapeHtml(booking.customer_phone)}` : ""}
        </p>
        ${bookingSummaryTable(booking, dateLabel, timeLabel)}
        ${booking.message ? `<p style="margin:14px 0 0;color:${BONE};font-size:14px;"><strong style="color:${BRASS};">Message:</strong> ${escapeHtml(booking.message)}</p>` : ""}
        <div style="margin-top:24px;">
          ${button("Approve", links.approveUrl, "brass")}
          ${button("Reject", links.rejectUrl, "crimson")}
          ${button("Propose a different time", links.proposeUrl, "neutral")}
        </div>
      `,
    }),
  };
}

export function customerConfirmedEmail(booking: Booking): { subject: string; html: string } {
  const dateLabel = formatDate(booking.confirmed_date ?? booking.preferred_date);
  const timeLabel = formatTime(booking.confirmed_time ?? booking.preferred_time);
  return {
    subject: "Booking confirmed — Fresh Cutz Barbers",
    html: layout({
      preheader: `You're booked in for ${dateLabel} at ${timeLabel}.`,
      title: "Booking confirmed",
      bodyHtml: `
        <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:20px;color:${BONE};">You're booked in, ${escapeHtml(booking.customer_name)}.</p>
        <p style="margin:0 0 18px;color:rgba(242,234,217,0.75);font-size:15px;">See you at Fresh Cutz Barbers.</p>
        ${bookingSummaryTable(booking, dateLabel, timeLabel)}
        <p style="margin:20px 0 0;color:rgba(242,234,217,0.6);font-size:13px;">
          Need to change anything? Call or text ${PHONE_DISPLAY}.
        </p>
      `,
    }),
  };
}

export function customerDeclinedEmail(booking: Booking): { subject: string; html: string } {
  return {
    subject: "About your booking request — Fresh Cutz Barbers",
    html: layout({
      preheader: "We couldn't fit that time — let's find another one.",
      title: "Booking declined",
      bodyHtml: `
        <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:20px;color:${BONE};">Sorry, ${escapeHtml(booking.customer_name)} — we can't make that time work.</p>
        <p style="margin:0 0 4px;color:rgba(242,234,217,0.75);font-size:15px;line-height:1.5;">
          Give us a call or text and we'll find a time that suits: <strong style="color:${BRASS};">${PHONE_DISPLAY}</strong>.
        </p>
      `,
    }),
  };
}

export function customerProposedTimeEmail(
  booking: Booking,
  links: { acceptUrl: string; declineUrl: string; counterProposeUrl: string },
): { subject: string; html: string } {
  const dateLabel = formatDate(booking.proposed_date!);
  const timeLabel = formatTime(booking.proposed_time!);
  return {
    subject: "A different time was suggested — Fresh Cutz Barbers",
    html: layout({
      preheader: `Baggio suggested ${dateLabel} at ${timeLabel} instead.`,
      title: "New time suggested",
      bodyHtml: `
        <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:20px;color:${BONE};">Hi ${escapeHtml(booking.customer_name)},</p>
        <p style="margin:0 0 18px;color:rgba(242,234,217,0.75);font-size:15px;line-height:1.5;">
          Your original time isn't free, but Baggio suggested this instead:
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:${CHARCOAL_2};border-radius:12px;padding:18px 20px;">
          <tr><td style="color:${BONE};font-size:16px;font-weight:600;">${dateLabel} at ${timeLabel}</td></tr>
        </table>
        <div style="margin-top:8px;">
          ${button("Accept this time", links.acceptUrl, "brass")}
          ${button("Decline", links.declineUrl, "crimson")}
          ${button("Suggest another time", links.counterProposeUrl, "neutral")}
        </div>
      `,
    }),
  };
}

export function ownerCustomerRespondedEmail(
  booking: Booking,
  outcome: "accepted" | "declined" | "countered",
  links?: { approveUrl: string; rejectUrl: string; proposeUrl: string },
): { subject: string; html: string } {
  const messages: Record<typeof outcome, string> = {
    accepted: "accepted the proposed time.",
    declined: "declined the proposed time.",
    countered: "suggested a different time.",
  };
  const dateLabel = formatDate(
    outcome === "countered"
      ? booking.proposed_date!
      : (booking.confirmed_date ?? booking.preferred_date),
  );
  const timeLabel = formatTime(
    outcome === "countered"
      ? booking.proposed_time!
      : (booking.confirmed_time ?? booking.preferred_time),
  );
  return {
    subject: `${booking.customer_name} ${messages[outcome]} — Fresh Cutz Barbers`,
    html: layout({
      preheader: `${booking.customer_name} ${messages[outcome]}`,
      title: "Customer response",
      bodyHtml: `
        <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:20px;color:${BONE};">
          ${escapeHtml(booking.customer_name)} ${messages[outcome]}
        </p>
        ${bookingSummaryTable(booking, dateLabel, timeLabel)}
        ${
          outcome === "countered" && links
            ? `<div style="margin-top:16px;">
                ${button("Approve", links.approveUrl, "brass")}
                ${button("Reject", links.rejectUrl, "crimson")}
                ${button("Propose a different time", links.proposeUrl, "neutral")}
              </div>`
            : ""
        }
      `,
    }),
  };
}
