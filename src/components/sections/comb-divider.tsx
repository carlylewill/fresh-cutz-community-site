/** Teeth every 40px across a 1200-wide viewBox, stretched with preserveAspectRatio="none". */
const TEETH = Array.from({ length: 31 }, (_, i) => `M${i * 40} 25 V8`).join(" ");

export function CombDivider() {
  return (
    <svg className="comb" viewBox="0 0 1200 26" preserveAspectRatio="none" aria-hidden="true">
      <path d={`M0 25 H1200 ${TEETH}`} stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
