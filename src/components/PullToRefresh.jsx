import React, { useRef, useState } from "react";
import { Loader2 } from "lucide-react";

const THRESHOLD = 70;

/**
 * Reusable pull-to-refresh wrapper for mobile. No-ops on md+ viewports.
 * Detects the nearest scrollable ancestor (e.g. the AppLayout main) so the
 * gesture only engages when that container is scrolled to the top.
 */
export default function PullToRefresh({ onRefresh, children }) {
  const wrapRef = useRef(null);
  const startY = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const findScrollParent = (node) => {
    let el = node?.parentElement;
    while (el && el !== document.body) {
      const { overflowY } = window.getComputedStyle(el);
      if (["auto", "scroll"].includes(overflowY)) return el;
      el = el.parentElement;
    }
    return null;
  };

  const handleTouchStart = (event) => {
    if (window.matchMedia("(min-width: 768px)").matches || refreshing) {
      startY.current = null;
      return;
    }
    const scroller = findScrollParent(wrapRef.current);
    const atTop = scroller
      ? scroller.scrollTop <= 0
      : (window.scrollY || document.documentElement.scrollTop) <= 0;
    startY.current = atTop ? event.touches[0].clientY : null;
  };

  const handleTouchMove = (event) => {
    if (startY.current == null) return;
    const delta = event.touches[0].clientY - startY.current;
    if (delta > 0) setPull(Math.min(delta * 0.5, THRESHOLD));
  };

  const handleTouchEnd = async () => {
    if (startY.current == null) return;
    startY.current = null;
    if (pull >= THRESHOLD && !refreshing && onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.warn("Pull-to-refresh failed", error);
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  const showIndicator = pull > 0 || refreshing;

  return (
    <div
      ref={wrapRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: pull ? `translateY(${pull}px)` : undefined,
        transition: startY.current == null ? "transform 0.25s ease" : "none",
      }}
    >
      {showIndicator && (
        <div className="flex items-center justify-center py-2" aria-hidden="true">
          <Loader2
            className={`w-5 h-5 text-primary ${refreshing ? "animate-spin" : ""}`}
            style={{ opacity: refreshing ? 1 : Math.min(pull / THRESHOLD, 1) }}
          />
        </div>
      )}
      {children}
    </div>
  );
}