// Where a Dropdown's list goes and whether its trigger shows a value. Pure, so
// the placement rules are tested without a browser.

export interface TriggerRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export type MenuWidth = number | "trigger" | "auto";

export const VIEWPORT_PAD = 8;
const MAX_MENU_HEIGHT = 360;
const GAP = 6;

export interface MenuPlacement {
  top: number;
  left?: number;
  right?: number;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  maxHeight: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

/**
 * A fixed width is clamped by that width. An "auto" list has no known width
 * before it renders, so it is anchored by the trigger edge on its align side
 * and capped at the room left on the other: it can never come loose from the
 * trigger, which clamping by a guessed width did on narrow screens.
 */
export function menuPlacement(
  rect: TriggerRect,
  viewport: Viewport,
  width: MenuWidth,
  align: "start" | "end",
): MenuPlacement {
  const maxHeight = Math.min(MAX_MENU_HEIGHT, viewport.height - VIEWPORT_PAD * 2);
  const belowTop = rect.bottom + GAP;
  const aboveTop = rect.top - maxHeight - GAP;
  const top = belowTop + maxHeight > viewport.height - VIEWPORT_PAD && aboveTop > VIEWPORT_PAD
    ? aboveTop
    : clamp(belowTop, VIEWPORT_PAD, viewport.height - maxHeight - VIEWPORT_PAD);

  if (width === "auto") {
    const reach = Math.max(rect.width, 0);
    if (align === "end") {
      const right = clamp(viewport.width - rect.right, VIEWPORT_PAD, viewport.width - reach - VIEWPORT_PAD);
      return { top, right, minWidth: rect.width, maxWidth: viewport.width - right - VIEWPORT_PAD, maxHeight };
    }
    const left = clamp(rect.left, VIEWPORT_PAD, viewport.width - reach - VIEWPORT_PAD);
    return { top, left, minWidth: rect.width, maxWidth: viewport.width - left - VIEWPORT_PAD, maxHeight };
  }

  const resolved = width === "trigger" ? rect.width : width;
  const preferredLeft = align === "end" ? rect.right - resolved : rect.left;
  return {
    top,
    left: clamp(preferredLeft, VIEWPORT_PAD, viewport.width - resolved - VIEWPORT_PAD),
    width: resolved,
    maxHeight,
  };
}

/** An option whose value is "" means "nothing chosen": the trigger shows the placeholder, muted. */
export function showsValue(selected: { value: string } | undefined): boolean {
  return selected !== undefined && selected.value !== "";
}
