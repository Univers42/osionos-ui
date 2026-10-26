/**
 * The style a popover is drawn with before it is placed: fixed, at the corner,
 * invisible. Fixed is the point. A portaled block left in the page flow is as
 * wide as the page, so the first measure clamped a 258 px menu as a full-width
 * one and drew it at the viewport's left edge, 391 px from its button (the
 * composer's "+", 2026-10-26). Later opens looked right only because they kept
 * the fixed style of the previous one.
 */
export const MEASURING_STYLE = { position: "fixed", top: 0, left: 0, opacity: 0, zIndex: 10003 } as const;
