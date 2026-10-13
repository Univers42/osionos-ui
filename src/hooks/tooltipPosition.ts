export type TooltipSide = "top" | "bottom" | "left" | "right";

export interface TooltipTriggerRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface TooltipSize {
  width: number;
  height: number;
}

export interface TooltipPositionOptions {
  side?: TooltipSide;
  gap?: number;
  margin?: number;
}

export interface TooltipPlacement {
  top: number;
  left: number;
  side: TooltipSide;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function opposite(side: TooltipSide): TooltipSide {
  if (side === "top") return "bottom";
  if (side === "bottom") return "top";
  if (side === "left") return "right";
  return "left";
}

function fits(
  side: TooltipSide,
  trigger: TooltipTriggerRect,
  tooltip: TooltipSize,
  viewport: TooltipSize,
  gap: number,
  margin: number,
): boolean {
  if (side === "top") return trigger.top - gap - tooltip.height >= margin;
  if (side === "bottom") return trigger.top + trigger.height + gap + tooltip.height <= viewport.height - margin;
  if (side === "left") return trigger.left - gap - tooltip.width >= margin;
  return trigger.left + trigger.width + gap + tooltip.width <= viewport.width - margin;
}

export function tooltipPosition(
  trigger: TooltipTriggerRect,
  tooltip: TooltipSize,
  viewport: TooltipSize,
  options: TooltipPositionOptions = {},
): TooltipPlacement {
  const preferred = options.side ?? "top";
  const gap = options.gap ?? 6;
  const margin = options.margin ?? 8;
  const flipped = opposite(preferred);
  const side = fits(preferred, trigger, tooltip, viewport, gap, margin)
    ? preferred
    : fits(flipped, trigger, tooltip, viewport, gap, margin)
      ? flipped
      : preferred;

  if (side === "top" || side === "bottom") {
    const top = side === "top" ? trigger.top - gap - tooltip.height : trigger.top + trigger.height + gap;
    const left = clamp(trigger.left + trigger.width / 2 - tooltip.width / 2, margin, viewport.width - tooltip.width - margin);
    return { top, left, side };
  }

  const left = side === "left" ? trigger.left - gap - tooltip.width : trigger.left + trigger.width + gap;
  const top = clamp(trigger.top + trigger.height / 2 - tooltip.height / 2, margin, viewport.height - tooltip.height - margin);
  return { top, left, side };
}
