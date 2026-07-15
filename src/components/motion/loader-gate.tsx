"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Preloader } from "./preloader";

/**
 * `done` starts false on both server and client, so there is no hydration
 * mismatch. The Preloader flips it — immediately when the head script stamped
 * data-loader="skip", or on timeline completion when it played.
 *
 * The hero keys its intro off this rather than the prototype's approach of
 * reaching into `#headline` from the loader timeline, which couples the two
 * through a magic ID and hardcodes a `delay: 3.4` that desyncs the moment the
 * loader is retimed.
 */
const LoaderContext = createContext<{ done: boolean }>({ done: false });

export function useLoaderDone() {
  return useContext(LoaderContext).done;
}

export function LoaderGate({ children }: { children: ReactNode }) {
  const [done, setDone] = useState(false);
  return (
    <LoaderContext.Provider value={{ done }}>
      <Preloader onDone={() => setDone(true)} />
      {children}
    </LoaderContext.Provider>
  );
}
