/*
 * Regression probe for the hero cut -> next section handoff.
 *
 * PASS is {"jumpPx": <1, "speedBefore": ~1, "speedAfter": 1}: the section below
 * the hero must not move when the cut is destroyed (jumpPx), and must already be
 * travelling at the page's own scroll speed on the last frame of the cut
 * (speedBefore), or the swap reads as a jerk even though nothing teleported.
 *
 *   npx next dev -p 4433
 *   B=http://localhost:4433 node scripts/_handoff.mjs
 */
import { chromium } from "playwright";
const B = process.env.B || "http://localhost:4433";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto(B + "/", { waitUntil: "networkidle" });
await p.waitForTimeout(2500);

const info = await p.evaluate(() => {
  const s = document.getElementById("scroller");
  return {
    title: document.title,
    navH: getComputedStyle(document.documentElement).getPropertyValue("--nav-h"),
    scrollerTop: s.getBoundingClientRect().top,
    heroH: document.querySelector("#top").offsetHeight,
  };
});

/**
 * Where the user actually sees the section below the hero, in window px.
 *
 * Approached in steps, never jumped to: a single big scrollTo lands ScrollTrigger
 * on the new position with a stale progress for a beat, and a probe that reads it
 * then measures a cut that is still at progress 0. That is a probe passing for the
 * wrong reason, not a passing site.
 */
const seen = async (y, from = -1) => {
  for (const step of [y - 60 * from, y - 20 * from, y]) {
    await p.evaluate((v) => {
      document.getElementById("scroller").scrollTo(0, v);
    }, step);
    await p.waitForTimeout(400);
  }
  return p.evaluate(() => {
    const inner = document.querySelector(".cut-riser-inner");
    const el = inner ? inner.firstElementChild : document.querySelector("#top").nextElementSibling;
    return {
      cut: !!inner,
      top: +el.getBoundingClientRect().top.toFixed(1),
      st: Math.round(document.getElementById("scroller").scrollTop),
    };
  });
};

const end = info.heroH; // the trigger's "bottom top"
const a = await seen(end - 21);
const bfr = await seen(end - 1);
const aft = await seen(end + 1);
const c = await seen(end + 21);

// Same seam, approached from below — the cut is reversible, so onEnterBack has
// to rebuild the riser on the same pixel onLeave destroyed it on.
const upAft = await seen(end + 1, 1);
const upBfr = await seen(end - 1, 1);

console.log(JSON.stringify(info));
console.log(
  JSON.stringify({
    // The two samples straddle the seam, so they are a couple of pixels of
    // scroll apart and the page is entitled to have moved by that much. What
    // must be 0 is whatever it moved ON TOP of that.
    jumpPx: +(bfr.top - aft.top - (aft.st - bfr.st)).toFixed(1),
    speedBefore: +((a.top - bfr.top) / (bfr.st - a.st)).toFixed(2),
    speedAfter: +((aft.top - c.top) / (c.st - aft.st)).toFixed(2),
    jumpPxUp: +(upBfr.top - upAft.top - (upAft.st - upBfr.st)).toFixed(1),
    cutLive: [a.cut, bfr.cut, aft.cut, c.cut],
    cutLiveUp: [upAft.cut, upBfr.cut],
    pageErrors: errs.slice(0, 3),
  }),
);
await b.close();
