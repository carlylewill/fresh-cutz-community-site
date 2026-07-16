/**
 * Contact icons. The WhatsApp and phone glyphs are carried over from the
 * urlashtrap footer so the two sites read as one studio's work; the map pin,
 * Instagram and clock are drawn to match — 24px box, 1.7 stroke, currentColor,
 * so they inherit brass/paper wherever they're placed.
 *
 * Inline SVG rather than an icon package: five glyphs don't justify a
 * dependency, and these need to inherit colour on hover.
 */

type IconProps = { className?: string };

const BASE = "h-[18px] w-[18px] shrink-0";

export function WhatsAppIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`${BASE} ${className}`}>
      <path
        d="M3.5 20.5l1.2-4.1A8.2 8.2 0 1 1 8 19.4l-4.5 1.1z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 8.4c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .6.5l.7 1.6c.1.3 0 .5-.1.7l-.4.4c-.1.2-.2.3 0 .6a6 6 0 0 0 2.7 2.3c.3.1.5.1.6-.1l.5-.6c.2-.2.4-.2.6-.1l1.6.8c.3.1.4.3.4.5 0 .8-.6 1.5-1.3 1.7-.6.2-1.4.3-4-1.2a8.4 8.4 0 0 1-3.2-3.4c-.5-1-.5-1.9-.4-2.4.1-.4.3-.6.5-.8z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PhoneIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`${BASE} ${className}`}>
      <path
        d="M6.2 3.5h2.3l1.4 3.6-1.8 1.3a11 11 0 0 0 5.5 5.5l1.3-1.8 3.6 1.4v2.3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MapPinIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`${BASE} ${className}`}>
      <path
        d="M12 21.5s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10.2" r="2.6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function InstagramIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`${BASE} ${className}`}>
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="4.6"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.1" cy="6.9" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function ClockIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`${BASE} ${className}`}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.4V12l3 1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
