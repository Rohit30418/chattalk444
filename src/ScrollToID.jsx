import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToHash = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) return undefined;

    let cancelled = false;
    let frameId = 0;
    let attempts = 0;
    const targetId = decodeURIComponent(hash.slice(1));

    // Route chunks are lazy-loaded. On navigation from Rooms -> Pricing the
    // hash can be available before HomePage has mounted its #pricing section.
    // Retry for a short window instead of silently missing the scroll.
    const scrollWhenReady = () => {
      if (cancelled) return;

      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      attempts += 1;
      if (attempts < 120) {
        frameId = window.requestAnimationFrame(scrollWhenReady);
      }
    };

    frameId = window.requestAnimationFrame(scrollWhenReady);

    return () => {
      cancelled = true;
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [pathname, hash]);

  return null;
};
