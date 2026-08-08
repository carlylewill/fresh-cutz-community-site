"use client";

import { ScrollTrigger, getScroller, useIsoLayoutEffect } from "@/lib/motion";

/**
 * Points every ScrollTrigger on the site at #scroller instead of the window.
 *
 * Renders nothing. It exists purely for WHEN its effect runs, and that timing is
 * the entire contract:
 *
 * 1. It must be a LAYOUT effect, and this component must be the FIRST child of
 *    <body>. React flushes layout effects child-before-parent and siblings in
 *    order, each subtree completing before the next sibling starts — so being
 *    first at the top means this fires before any other effect in the tree.
 *    That matters concretely: <TicketSnip /> creates ScrollTriggers on touch and
 *    is mounted at the root, so a binding placed any deeper (inside the Lenis
 *    provider, or inside #scroller) would run AFTER it and those triggers would
 *    have already bound to the window and would never fire.
 *
 * 2. The scroller must be handed over as a RESOLVED ELEMENT, never the selector
 *    string "#scroller". GSAP resolves a default selector eagerly at odd moments
 *    during hydration and throws on `t._gsap` being undefined, which takes the
 *    whole React tree down rather than merely breaking the scroll.
 *
 * Defaults only apply to triggers created after they are set, which is why both
 * points above are requirements rather than preferences.
 */
export function ScrollerBinding() {
  useIsoLayoutEffect(() => {
    const el = getScroller();
    if (!el) return;
    ScrollTrigger.defaults({ scroller: el });
  }, []);

  return null;
}
