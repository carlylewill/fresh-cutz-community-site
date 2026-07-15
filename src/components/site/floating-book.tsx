import { Magnetic } from "@/components/motion/magnetic";

/**
 * Server component — <Magnetic> is the only client boundary, and children pass
 * through it as already-rendered JSX.
 *
 * The fixed positioning lives on the wrapper rather than on <Magnetic> itself:
 * Magnetic animates transform on its own element, and a transform on a fixed
 * element establishes a containing block — so combining the two makes the
 * button's anchor drift as it's nudged.
 */
export function FloatingBook() {
  return (
    <div className="fixed right-5 bottom-5 z-[60]">
      <Magnetic>
        <a className="btn-primary" href="#book">
          <i className="sweep" aria-hidden />
          <span>Book Now</span>
        </a>
      </Magnetic>
    </div>
  );
}
