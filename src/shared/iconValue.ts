/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   iconValue.ts                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: dlesieur <dlesieur@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/08 12:00:00 by dlesieur          #+#    #+#             */
/*   Updated: 2026/06/08 12:00:00 by dlesieur         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

/**
 * Canonical icon value used by every place that stores a picked icon (page icons, callout
 * `block.color`, workspace icon). One opaque string so it round-trips through markdown/JSON
 * unchanged. Forms (backward-compatible with the legacy `icon:`/`url:`/bare-emoji values):
 *   - "🚀"                     bare emoji            (optional ";bg=%23hex" → colored chip)
 *   - "icon:rocket"            a lucide icon         (optional ";color=%23hex" → stroke color)
 *   - "img:<url|data-uri>"     custom SVG / image    (legacy "url:" accepted)
 * Colours are URL-encoded so they never collide with `]` in `> [!…]` callout markdown.
 */

export type IconKind = "emoji" | "icon" | "image";

export interface IconValue {
  kind: IconKind;
  ref: string;
  color?: string; // icon stroke / svg tint
  bg?: string; // emoji background chip
}

const COLOR_RE = /;color=([^;]+)/;
const BG_RE = /;bg=([^;]+)/;

function decodeMaybe(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Parse a stored icon string into its kind + ref + optional colours. Empty → null. */
export function parseIconValue(value?: string | null): IconValue | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const color = decodeMaybe(COLOR_RE.exec(raw)?.[1]);
  const bg = decodeMaybe(BG_RE.exec(raw)?.[1]);
  const base = raw.replace(COLOR_RE, "").replace(BG_RE, "");
  if (base.startsWith("icon:")) return { kind: "icon", ref: base.slice(5), color };
  if (base.startsWith("img:")) return { kind: "image", ref: base.slice(4), color };
  if (base.startsWith("url:")) return { kind: "image", ref: base.slice(4), color };
  if (base.startsWith("emoji:")) return { kind: "emoji", ref: base.slice(6), bg };
  return { kind: "emoji", ref: base, bg };
}

// Ponytail: printable ASCII means a legacy value (a catalog id like "page", "emoji:rocket", a
// bare URL); anything else is the glyph itself. A bare URL with non-ASCII characters is taken
// for a glyph and drawn as text instead of an image.
const LEGACY_EMOJI_REF = /^[\x20-\x7e]+$/;

/** The emoji to draw as-is, or null for a value only ui-collection's AssetRenderer resolves. */
export function drawableEmojiOf(value: IconValue): string | null {
  return value.kind === "emoji" && !LEGACY_EMOJI_REF.test(value.ref) ? value.ref : null;
}

/** Build a stored icon string from its parts (inverse of parseIconValue). */
export function serializeIconValue(value: IconValue): string {
  const ref = value.ref.trim();
  let out = value.kind === "icon" ? `icon:${ref}` : value.kind === "image" ? `img:${ref}` : ref;
  if (value.color) out += `;color=${encodeURIComponent(value.color)}`;
  if (value.kind === "emoji" && value.bg) out += `;bg=${encodeURIComponent(value.bg)}`;
  return out;
}
