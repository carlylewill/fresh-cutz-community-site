/**
 * No "use client" on purpose. The prototype drove this with an infinite
 * `gsap.to(..., {repeat: -1})`, which pins a JS tween to the ticker for the whole
 * session for something a CSS keyframe composites on its own thread. It also did
 * `mq.innerHTML += mq.innerHTML`, duplicating the content at runtime — here the
 * duplicate is server-rendered, so the strip is seamless on frame one.
 *
 * Renders the track only; <MarqueeStrip /> owns the `.marquee` bar around it.
 */
export function Marquee({ items }: { items: string[] }) {
  return (
    // marquee-track (globals.css): translateX(0 -> -50%) over 26s. The -50% only
    // lands on a seam because the phrases below are rendered exactly twice.
    <div className="marquee-track">
      {items.map((item, i) => (
        <span key={`a${i}`}>{item}</span>
      ))}
      {items.map((item, i) => (
        <span key={`b${i}`} aria-hidden="true">
          {item}
        </span>
      ))}
    </div>
  );
}
