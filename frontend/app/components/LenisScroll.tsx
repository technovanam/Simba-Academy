import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import Lenis from "lenis";
import type { LenisOptions } from "lenis";

import "lenis/dist/lenis.css";

type LenisTarget =
  | { mode: "root" }
  | { mode: "wrapper"; wrapper: HTMLElement; content: HTMLElement };

function findPortalScrollTarget(): LenisTarget | null {
  const portalShell = document.querySelector(".portal-app-shell");
  if (!portalShell) return { mode: "root" };

  const scrollEl = portalShell.querySelector(
    ".portal-main-scroll",
  ) as HTMLElement | null;
  if (scrollEl) {
    const content = (scrollEl.firstElementChild as HTMLElement) ?? scrollEl;
    return { mode: "wrapper", wrapper: scrollEl, content };
  }

  const inner = portalShell.querySelector(
    ".portal-main-column [class*='overflow-y-auto']",
  ) as HTMLElement | null;
  if (inner) {
    const content = (inner.firstElementChild as HTMLElement) ?? inner;
    return { mode: "wrapper", wrapper: inner, content };
  }

  return null;
}

function buildLenisOptions(target: LenisTarget): LenisOptions {
  const base: LenisOptions = {
    autoRaf: false,
    lerp: 0.1,
    duration: 1.2,
    smoothWheel: true,
    syncTouch: false,
    anchors: true,
    stopInertiaOnNavigate: true,
    allowNestedScroll: true,
  };

  if (target.mode === "wrapper") {
    return {
      ...base,
      wrapper: target.wrapper,
      content: target.content,
    };
  }

  return base;
}

type LenisScrollProps = {
  onScroll?: () => void;
};

/**
 * Site-wide smooth scroll via Lenis — window on marketing pages,
 * portal main column when the shell locks body overflow.
 */
export function LenisScroll({ onScroll }: LenisScrollProps) {
  const location = useLocation();
  const onScrollRef = useRef(onScroll);
  onScrollRef.current = onScroll;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let cancelled = false;
    let rafId = 0;
    let lenis: Lenis | null = null;

    const setup = () => {
      if (cancelled) return;

      const target = findPortalScrollTarget();
      if (!target) return;

      lenis = new Lenis(buildLenisOptions(target));

      lenis.on("scroll", () => {
        onScrollRef.current?.();
      });

      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      lenis.scrollTo(0, { immediate: true });
    };

    const timeoutId = window.setTimeout(setup, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
      lenis?.destroy();
      lenis = null;
    };
  }, [location.pathname, location.search]);

  return null;
}
