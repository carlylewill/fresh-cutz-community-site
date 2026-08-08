/*
 * Regression probe for the iOS Safari "content leaks above the header" bug.
 *
 * PASS is:
 *   {"headerPinnedAt0":true,"nothingAboveHeader":true,"horizontalScroll":false,"pageErrors":[]}
 *
 * It asserts the app shell is intact: the <header> never leaves y=0, and at
 * every scroll position the topmost painted pixel still belongs to it. Any
 * change that puts the header back inside #scroller — or drops #scroller
 * altogether — fails this.
 *
 *   npm run build && npx next start -p 4417
 *   npm i -D playwright && npx playwright install webkit   # not a project dep
 *   B=http://localhost:4417 node scripts/_iosprobe.mjs
 */
import { webkit, devices } from "playwright";
const B = process.env.B || "http://localhost:4400";
const b = await webkit.launch();
const p = await b.newPage({ ...devices["iPhone 13"] });
const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto(B + "/", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
let moved = false, above = false;
for (const y of [0, 300, 900, 1800, 3000, 4500]) {
  await p.evaluate(v => { const s = document.getElementById("scroller"); if (s) s.scrollTo(0, v); else window.scrollTo(0, v); }, y);
  await p.waitForTimeout(280);
  const r = await p.evaluate(() => {
    const h = document.querySelector("header"); if (!h) return { top: -999, inHeader: false };
    const at2 = document.elementFromPoint(innerWidth / 2, 2);
    return { top: Math.round(h.getBoundingClientRect().top), inHeader: at2 ? h.contains(at2) : false };
  });
  if (r.top !== 0) moved = true;
  if (!r.inHeader) above = true;
}
const hs = await p.evaluate(() => { const de = document.getElementById("scroller") || document.documentElement; return de.scrollWidth > de.clientWidth + 1; });
console.log(JSON.stringify({ headerPinnedAt0: !moved, nothingAboveHeader: !above, horizontalScroll: hs, pageErrors: errs.slice(0,3) }));
await b.close();
