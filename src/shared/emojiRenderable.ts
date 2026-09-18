/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   emojiRenderable.ts                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: dlesieur <dlesieur@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/09/18 12:00:00 by dlesieur          #+#    #+#             */
/*   Updated: 2026/09/18 12:00:00 by dlesieur         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

/**
 * Can THIS device actually draw a given emoji?
 *
 * The bundled catalog is the full RGI set (Unicode 17.0), but an OS emoji font
 * lags the standard by years — measured on the dev VM, Unicode 16.0/17.0
 * glyphs paint the .notdef box (tofu) while everything through 15.0 renders.
 * Offering a glyph the user's machine cannot draw is a broken affordance: they
 * pick a smiley and a rectangle lands in their document. So the picker asks
 * here first and hides what would tofu.
 *
 * Detection renders the glyph to a canvas and compares its pixel signature to
 * control codepoints from unassigned planes — those can never have a glyph, so
 * whatever the font paints for them IS this font's tofu. Results are cached per
 * string; the canvas is created once. SSR / no-canvas → assume renderable
 * (never hide emoji because we could not measure).
 */

const cache = new Map<string, boolean>();
const CONTROL_CODEPOINTS = ["\u{10FFFD}", "\u{0FFFFD}"];

interface Probe {
  ctx: CanvasRenderingContext2D;
  font: string;
  controls: Set<number>;
}

let probe: Probe | null | undefined;

function signature(ctx: CanvasRenderingContext2D, font: string, text: string): number {
  ctx.clearRect(0, 0, 48, 48);
  ctx.font = `28px ${font}`;
  ctx.textBaseline = "top";
  ctx.fillText(text, 2, 2);
  const { data } = ctx.getImageData(0, 0, 48, 48);
  let hash = 0;
  for (let i = 0; i < data.length; i += 4) {
    hash = (hash * 31 + data[i] + data[i + 1] * 3 + data[i + 2] * 7 + data[i + 3] * 11) >>> 0;
  }
  return hash;
}

function getProbe(): Probe | null {
  if (probe !== undefined) return probe;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      probe = null;
      return probe;
    }
    const font = getComputedStyle(document.body).fontFamily || "sans-serif";
    const controls = new Set(CONTROL_CODEPOINTS.map((c) => signature(ctx, font, c)));
    probe = { ctx, font, controls };
  } catch {
    probe = null;
  }
  return probe;
}

/** True when `emoji` paints something other than this font's tofu box. */
export function isEmojiRenderable(emoji: string): boolean {
  if (!emoji) return false;
  const hit = cache.get(emoji);
  if (hit !== undefined) return hit;
  const active = getProbe();
  if (!active) return true; // cannot measure → never hide
  let renderable: boolean;
  try {
    renderable = !active.controls.has(signature(active.ctx, active.font, emoji));
  } catch {
    renderable = true;
  }
  cache.set(emoji, renderable);
  return renderable;
}

/** Drop the emoji this device would paint as tofu. Order is preserved. */
export function filterRenderableEmoji<T>(items: readonly T[], read: (item: T) => string): T[] {
  const active = getProbe();
  if (!active) return [...items];
  return items.filter((item) => isEmojiRenderable(read(item)));
}
