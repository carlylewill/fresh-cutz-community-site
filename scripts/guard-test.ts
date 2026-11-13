// Run: bun scripts/guard-test.ts  (pure logic, sends nothing, no network)
import { checkGuard } from "../src/lib/bookings/spam-guard";

const now = 1_000_000_000_000;
const ok = { honeypot: "", origin: "https://freshcutzbarber.co", now };
const results = [
  ["valid 3s", checkGuard({ ...ok, startedAt: now - 3000, ip: "1.1.1.1" }), null],
  [
    "honeypot filled",
    checkGuard({ ...ok, honeypot: "x", startedAt: now - 3000, ip: "1.1.1.2" }),
    "honeypot",
  ],
  ["under 2s", checkGuard({ ...ok, startedAt: now - 500, ip: "1.1.1.3" }), "timing"],
  ["missing ts", checkGuard({ ...ok, startedAt: "", ip: "1.1.1.4" }), "timing"],
  [
    "bad origin",
    checkGuard({ ...ok, origin: "https://evil.example", startedAt: now - 3000, ip: "1.1.1.5" }),
    "origin",
  ],
  [
    "no origin",
    checkGuard({ ...ok, origin: null, startedAt: now - 3000, ip: "1.1.1.6" }),
    "origin",
  ],
] as const;
let fail = 0;
for (const [name, got, want] of results) {
  const pass = got === want;
  if (!pass) fail++;
  console.log(pass ? "PASS" : "FAIL", name, got);
}
let last: string | null = null;
for (let i = 0; i < 9; i++) last = checkGuard({ ...ok, startedAt: now - 3000, ip: "9.9.9.9" });
console.log(last === "rate" ? "PASS" : "FAIL", "rate limit after 8", last);
if (last !== "rate") fail++;
process.exit(fail ? 1 : 0);
