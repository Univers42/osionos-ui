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

export type StoredIcon =
  | { type: "emoji"; value: string; bg?: string }
  | { type: "icon"; name: string; color?: string }
  | { type: "image"; url: string; color?: string };

/** Type guard for StoredIcon objects. */
export function isStoredIcon(value: unknown): value is StoredIcon {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.type === "emoji") {
    if (typeof candidate.value !== "string" || candidate.value.trim().length === 0) return false;
    return candidate.bg === undefined || typeof candidate.bg === "string";
  }
  if (candidate.type === "icon") {
    if (typeof candidate.name !== "string" || candidate.name.trim().length === 0) return false;
    return candidate.color === undefined || typeof candidate.color === "string";
  }
  if (candidate.type === "image") {
    if (typeof candidate.url !== "string" || candidate.url.trim().length === 0) return false;
    return candidate.color === undefined || typeof candidate.color === "string";
  }
  return false;
}

/**
 * Parses either a legacy string or a StoredIcon object into canonical StoredIcon.
 * Returns null if invalid or blank.
 */
export function parseStoredIcon(input?: unknown): StoredIcon | null {
  if (isStoredIcon(input)) {
    if (input.type === "emoji") {
      const value = input.value.trim();
      if (!value) return null;
      const bg = typeof input.bg === "string" ? input.bg.trim() : undefined;
      return { type: "emoji", value, ...(bg ? { bg } : {}) };
    }
    if (input.type === "icon") {
      const name = input.name.trim();
      if (!name) return null;
      const color = typeof input.color === "string" ? input.color.trim() : undefined;
      return { type: "icon", name, ...(color ? { color } : {}) };
    }
    if (input.type === "image") {
      const url = input.url.trim();
      if (!url) return null;
      const color = typeof input.color === "string" ? input.color.trim() : undefined;
      return { type: "image", url, ...(color ? { color } : {}) };
    }
  }
  if (typeof input === "string") {
    const parsed = parseIconValue(input);
    if (!parsed) return null;
    if (parsed.kind === "emoji") {
      return { type: "emoji", value: parsed.ref, ...(parsed.bg ? { bg: parsed.bg } : {}) };
    }
    if (parsed.kind === "icon") {
      return { type: "icon", name: parsed.ref, ...(parsed.color ? { color: parsed.color } : {}) };
    }
    if (parsed.kind === "image") {
      return { type: "image", url: parsed.ref, ...(parsed.color ? { color: parsed.color } : {}) };
    }
  }
  return null;
}

/**
 * Normalizes any icon representation (string or object) to a canonical StoredIcon.
 * Alias/equivalent to parseStoredIcon.
 */
export function storedIconToCanonical(input?: unknown): StoredIcon | null {
  return parseStoredIcon(input);
}

/**
 * Serializes a StoredIcon into its backward-compatible string representation.
 */
export function serializeStoredIcon(icon: StoredIcon): string {
  if (icon.type === "emoji") {
    return serializeIconValue({ kind: "emoji", ref: icon.value, bg: icon.bg });
  }
  if (icon.type === "icon") {
    return serializeIconValue({ kind: "icon", ref: icon.name, color: icon.color });
  }
  if (icon.type === "image") {
    return serializeIconValue({ kind: "image", ref: icon.url, color: icon.color });
  }
  return "";
}

