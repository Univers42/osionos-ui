import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useEscapeKey } from "../hooks/useEscapeKey";
import { tooltipPosition, type TooltipSide } from "../hooks/tooltipPosition";

export interface TooltipProps {
  label: React.ReactNode;
  side?: TooltipSide;
  /** Hover delay before the tooltip opens. Keyboard focus opens it at once. */
  delayMs?: number;
  children: React.ReactElement<{ "aria-describedby"?: string }>;
}

function useTooltipOpen(delayMs: number): { open: boolean; show: (immediate: boolean) => void; hide: () => void } {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const show = useCallback(
    (immediate: boolean) => {
      clear();
      if (immediate) setOpen(true);
      else timerRef.current = setTimeout(() => setOpen(true), delayMs);
    },
    [clear, delayMs],
  );

  const hide = useCallback(() => {
    clear();
    setOpen(false);
  }, [clear]);

  useEffect(() => () => clear(), [clear]);

  return { open, show, hide };
}

interface TooltipBubbleProps {
  id: string;
  label: React.ReactNode;
  side: TooltipSide;
  anchorRef: React.RefObject<HTMLElement | null>;
}

// Mounted only while open and rendered in a portal so no ancestor can clip it.
// It measures itself before the first paint and stays hidden until then, so it
// never flashes at the wrong place. It follows a scroll rather than closing on
// it: focusing a trigger scrolls it into view, and closing there would hide the
// label from exactly the keyboard users it opens for.
const TooltipBubble: React.FC<TooltipBubbleProps> = ({ id, label, side, anchorRef }) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const place = () => {
      const anchor = anchorRef.current;
      const bubble = bubbleRef.current;
      if (!anchor || !bubble) return;
      const viewport = { width: globalThis.innerWidth, height: globalThis.innerHeight };
      const { top, left } = tooltipPosition(anchor.getBoundingClientRect(), bubble.getBoundingClientRect(), viewport, { side });
      setPlacement({ top, left });
    };
    place();
    globalThis.addEventListener("resize", place);
    document.addEventListener("scroll", place, true);
    return () => {
      globalThis.removeEventListener("resize", place);
      document.removeEventListener("scroll", place, true);
    };
  }, [anchorRef, side]);

  return createPortal(
    <div
      ref={bubbleRef}
      role="tooltip"
      id={id}
      style={{ position: "fixed", top: placement?.top ?? 0, left: placement?.left ?? 0, visibility: placement ? "visible" : "hidden" }}
      className="pointer-events-none z-[var(--osio-z-toast)] max-w-xs rounded-[var(--osio-tooltip-radius)] bg-[var(--osio-tooltip-bg)] px-2 py-1 text-xs text-[var(--osio-tooltip-fg)] shadow-[var(--osio-e3)]"
    >
      {label}
    </div>,
    document.body,
  );
};

/**
 * Tooltip — a label shown on hover (after a delay) or on keyboard focus (at
 * once), positioned against its trigger and following it through a scroll or a
 * resize. Escape, a press, or leaving the trigger closes it. Touch never opens
 * it: there is no hover to end it.
 * Props:
 *   label: React.ReactNode           tooltip content
 *   side?: "top" | "bottom" | "left" | "right"   (default "top")
 *   delayMs?: number                 hover delay; focus opens immediately
 *   children: single element         gains the tooltip in aria-describedby while open
 */
export const Tooltip: React.FC<TooltipProps> = ({ label, side = "top", delayMs = 400, children }) => {
  const { open, show, hide } = useTooltipOpen(delayMs);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();
  const describedBy = [children.props["aria-describedby"], open ? tooltipId : undefined].filter(Boolean).join(" ");

  useEscapeKey(hide, open);

  return (
    <span
      ref={wrapperRef}
      className="inline-flex"
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") show(false);
      }}
      onPointerLeave={hide}
      onPointerDown={hide}
      onFocus={(event) => {
        // A mouse press focuses the trigger too; only keyboard focus opens the
        // tooltip, or every clicked button would keep its label up until blur.
        if (event.target.matches(":focus-visible")) show(true);
      }}
      onBlur={hide}
    >
      {React.cloneElement(children, { "aria-describedby": describedBy || undefined })}
      {open ? <TooltipBubble id={tooltipId} label={label} side={side} anchorRef={wrapperRef} /> : null}
    </span>
  );
};
