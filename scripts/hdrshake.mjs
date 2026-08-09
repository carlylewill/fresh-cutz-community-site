/**
 * Does the header move while the page scrolls?
 *
 * The header lives OUTSIDE #scroller, so its viewport y MUST be constant at
 * every scroll position. Any variance at all is the shake - on a real phone a
 * 1-2px per-frame wobble reads as the whole bar vibrating.
 *
 * A probe that sets `scroller.scrollTop` directly PASSES FOR THE WRONG
 * REASON: it bypasses Lenis entirely, so it can never see the per-frame lag
 * against the smoothed position that IS the shake. This drives Lenis's REAL
 * `wheel` listener instead (`element.addEventListener("wheel", ...)` in
 * node_modules/lenis/dist/lenis.js) via Playwright's `mouse.wheel`, in small
 * steps at native frame cadence, and samples the header's
 * getBoundingClientRect().top on every animation frame across the whole
 * scroll - the exact causal chain (input -> Lenis's animated/smoothed
 * position -> its `scroll` event -> ScrollTrigger.update) that produces the
 * per-frame pin-transform shake when it exists. This is the same mechanism a
 * touch drag drives; WebKit's mobile-emulation Touch/TouchEvent constructors
 * are not instantiable from page scripts ("Illegal constructor"), and
 * Playwright's WebKit has no native swipe/drag gesture either, which is why
 * wheel is the driver - the house rule's own allowed list is
 * "mouse.wheel / touch drag, or Lenis's own API".
 *
 * WebKit, not Chromium: headless Chromium cannot see Safari layout bugs.
 *
 * Also asserts <title> on every load - localhost:4503 is not this project's
 * reserved port, so another dev server squatting it would otherwise pass
 * silently against the wrong site.
 *
 *   node scripts/hdrshake.mjs [url] [path]
 */
import { webkit } from "playwright";

const BASE = process.argv[2] || "http://localhost:4503";
const PATHS = process.argv[3] ? [process.argv[3]] : ["/"];
const EXPECT_TITLE = "Fresh Cutz";

/* Real usable heights (a URL bar + toolbar eat 150-190px of the nominal
   screen), plus desktop. See ~/.claude/studio-rules/mobile-audit-end-to-end.md. */
const VIEWPORTS = [
  { w: 320, h: 553 },
  { w: 360, h: 700 },
  { w: 390, h: 629 },
  { w: 414, h: 715 },
  { w: 768, h: 900 },
  { w: 1280, h: 800 },
  { w: 1440, h: 820 },
];

const b = await webkit.launch();
let bad = 0;

for (const { w, h } of VIEWPORTS) {
  for (const p of PATHS) {
    // Deliberately NOT isMobile/hasTouch: WebKit's Touch/TouchEvent
    // constructors throw "Illegal constructor" from page scripts, and
    // mouse.wheel is unsupported once isMobile is set. A mobile-width viewport
    // without those flags still exercises every CSS media query on the page
    // and lets a real wheel event drive Lenis's actual listener.
    const page = await b.newPage({
      viewport: { width: w, height: h },
      deviceScaleFactor: 3,
    });
    await page.goto(BASE + p, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000); // let the loader/curtain finish

    const label = `${w}x${h} ${p}`;

    const title = await page.title();
    if (!title.includes(EXPECT_TITLE)) {
      console.log(`${label.padEnd(18)} FAIL - wrong <title> "${title}" (port squatted?)`);
      bad++;
      await page.close();
      continue;
    }

    const has = await page.evaluate(
      () => !!document.querySelector("header") && !!document.getElementById("scroller"),
    );
    if (!has) {
      console.log(`${label.padEnd(18)} FAIL - no header or #scroller`);
      bad++;
      await page.close();
      continue;
    }

    await page.evaluate(() => {
      window.__ys = [];
      window.__sampling = true;
      const h = document.querySelector("header");
      const loop = () => {
        if (!window.__sampling) return;
        window.__ys.push(+h.getBoundingClientRect().top.toFixed(2));
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });

    const max = await page.evaluate(() => {
      const sc = document.getElementById("scroller");
      return sc.scrollHeight - sc.clientHeight;
    });

    await page.mouse.move(195, 300);
    const steps = 100;
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, max / steps);
      await page.waitForTimeout(16); // real per-frame cadence, not one jump
    }
    await page.waitForTimeout(500); // let Lenis's easing settle at the bottom
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, -max / steps);
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(500);

    const r = await page.evaluate(() => {
      window.__sampling = false;
      const h = document.querySelector("header");
      const ys = window.__ys || [];
      const pos = getComputedStyle(h).position;
      const pinSpacers = document.querySelectorAll(".pin-spacer").length;
      if (!ys.length) return { err: "no samples captured", pos, pinSpacers };
      return {
        pos,
        pinSpacers,
        samples: ys.length,
        min: Math.min(...ys),
        max: Math.max(...ys),
        drift: +(Math.max(...ys) - Math.min(...ys)).toFixed(2),
        moved: ys.filter((y) => y !== ys[0]).length,
      };
    });

    const hscroll = await page.evaluate(() => {
      const docBad =
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      const nested = [...document.querySelectorAll("body *")].filter(
        (e) =>
          /auto|scroll/.test(getComputedStyle(e).overflowX) && e.scrollWidth > e.clientWidth + 2,
      ).length;
      return { docBad, nested };
    });

    const fail =
      r.err ||
      r.drift > 0.5 ||
      r.pinSpacers > 0 ||
      Math.abs(r.min ?? 999) > 1 ||
      hscroll.docBad ||
      hscroll.nested > 0;
    if (fail) bad++;
    console.log(
      `${label.padEnd(18)} pos=${r.pos} samples=${r.samples ?? 0} headerTop=${r.min}..${r.max} ` +
        `drift=${r.drift}px movedFrames=${r.moved}/${r.samples ?? 0} pinSpacers=${r.pinSpacers} ` +
        `hscroll(doc=${hscroll.docBad},nested=${hscroll.nested}) ${fail ? "FAIL" : "PASS"}`,
    );
    await page.close();
  }
}

await b.close();
console.log(bad ? `\n${bad} page(s) FAIL` : "\nall pages PASS");
process.exit(bad ? 1 : 0);
