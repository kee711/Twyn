"use client";

import { RefObject, useCallback, useEffect } from "react";

/**
 * Ensures focused inputs/textareas inside a scroll container remain visible
 * when the mobile virtual keyboard opens. It also dynamically adds bottom
 * padding equal to the keyboard height so content can scroll above it.
 */
type GenericRef = { current: HTMLElement | null };

export function useMobileKeyboardScroll(
  scrollContainerRef: GenericRef
) {
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const vv = (typeof window !== "undefined" && window.visualViewport) || null;
    if (!vv) return;

    const updatePaddingBottom = () => {
      const viewportOffsetTop = vv.offsetTop || 0;
      const visibleHeight = vv.height + viewportOffsetTop;
      const keyboardHeight = Math.max(0, window.innerHeight - visibleHeight);

      // Add a small margin above the keyboard so the caret has some space
      const extraMargin = keyboardHeight > 0 ? 12 : 0;
      container.style.paddingBottom = keyboardHeight
        ? `${keyboardHeight + extraMargin}px`
        : "";
    };

    vv.addEventListener("resize", updatePaddingBottom);
    vv.addEventListener("scroll", updatePaddingBottom);

    // Initialize once
    updatePaddingBottom();

    return () => {
      vv.removeEventListener("resize", updatePaddingBottom);
      vv.removeEventListener("scroll", updatePaddingBottom);
    };
  }, [scrollContainerRef]);

  const ensureVisible = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;
      const container = scrollContainerRef.current;
      if (!container) return;

      // If VisualViewport exists, we can calculate the visible area above the keyboard
      const vv = (typeof window !== "undefined" && window.visualViewport) || null;

      // Fallback: simply center the element within the nearest scroll container
      const fallback = () => {
        try {
          element.scrollIntoView({ block: "center", behavior: "smooth" });
        } catch (_) {
          // no-op
        }
      };

      if (!vv) {
        fallback();
        return;
      }

      // Defer a bit to allow the keyboard animation/layout to settle
      window.setTimeout(() => {
        const viewportOffsetTop = vv.offsetTop || 0;
        const visibleBottom = vv.height + viewportOffsetTop; // bottom Y coordinate of visible area
        const margin = 12; // small safe margin
        const visibleTop = viewportOffsetTop + margin;
        const adjustedVisibleBottom = visibleBottom - margin;

        const elRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Calculate how much we need to scroll the container so that the element
        // sits within the visible viewport (between visibleTop and adjustedVisibleBottom)
        let delta = 0;
        if (elRect.bottom > adjustedVisibleBottom) {
          delta = elRect.bottom - adjustedVisibleBottom;
        } else if (elRect.top < visibleTop) {
          delta = elRect.top - visibleTop; // negative value -> scroll up
        }

        if (delta !== 0) {
          // Convert delta (in viewport coordinates) to container scroll delta
          // Since both rects are in viewport space, the delta applies directly.
          container.scrollTo({
            top: container.scrollTop + delta,
            behavior: "smooth",
          });
        } else {
          // Nothing to adjust; ensure caret is still roughly centered
          fallback();
        }
      }, 50);
    },
    [scrollContainerRef]
  );

  return ensureVisible;
}


