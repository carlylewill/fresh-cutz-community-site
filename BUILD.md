# Build notes

## Speed pass Nov 2026
- next.config: AVIF/WebP image formats; experimental.inlineCss (critical CSS inlined, no render-blocking CSS request).
- Hero video now mounts after window load + idle, so its 2.3MB no longer competes with the LCP poster. Same poster frame, same handoff.
- Remaining floor: the preloader ("The Cut") covers the hero for about 1.5s after hydration, so LCP/Speed Index cannot go much below ~2.5s without shortening the loader (a visible change, left alone).

## Loader shortening Nov 2026
- The Cut loader timeline now plays at a speed that totals ~0.6s (was ~1.5s) via tl.timeScale; same sequence, still first visit per session only and skipped on reduced motion. Deploy is manual: push, then vercel --prod as pramitmazumdar26.
