/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   IconValueView.tsx                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: dlesieur <dlesieur@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/08 12:00:00 by dlesieur          #+#    #+#             */
/*   Updated: 2026/06/08 12:00:00 by dlesieur         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import React, { Suspense } from "react";
import { drawableEmojiOf, parseIconValue } from "../../shared/iconValue";
import { GlyphPlaceholder, LazyLegacyAssetRenderer } from "./LazyLegacyAssetRenderer";

// Lucide rendering is code-split: surfaces that only use emoji never load the lucide map.
const LucideGlyph = React.lazy(() => import("./LucideGlyph"));

interface Props {
  value?: string | null;
  size?: number;
  className?: string;
}

/**
 * Drop-in superset of AssetRenderer. Handles the picker's new forms — custom SVG/image (`img:`),
 * lucide icons (with optional color), emoji with or without a color chip — and delegates every
 * legacy value (`icon:<catalog>`, a bare catalog id, `url:…`) to AssetRenderer, loaded on first use.
 */
export const IconValueView: React.FC<Props> = ({ value, size = 20, className }) => {
  const raw = (value ?? "").trim();
  const parsed = parseIconValue(raw);
  if (!parsed) return null;

  if (parsed.kind === "image" && raw.startsWith("img:")) {
    return (
      <img className={className} src={parsed.ref} alt="" width={size} height={size} draggable={false} style={{ objectFit: "contain" }} />
    );
  }

  if (parsed.kind === "icon") {
    return (
      <span className={className} style={{ display: "inline-flex", color: parsed.color }}>
        <Suspense fallback={<GlyphPlaceholder size={size} />}>
          <LucideGlyph name={parsed.ref} size={size} color={parsed.color} />
        </Suspense>
      </span>
    );
  }

  if (parsed.kind === "emoji" && parsed.bg) {
    return (
      <span
        className={className}
        role="img"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: size, lineHeight: 1, background: parsed.bg,
          borderRadius: Math.round(size * 0.32), padding: Math.round(size * 0.22),
        }}
      >
        {parsed.ref}
      </span>
    );
  }

  const emoji = drawableEmojiOf(parsed);
  if (emoji !== null) {
    // AssetRenderer's emoji box, drawn without its catalogs (which also left out every emoji
    // they lack, skin-tone variants included).
    return (
      <span
        className={className}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: size, height: size, fontSize: size, lineHeight: 1,
        }}
      >
        {emoji}
      </span>
    );
  }

  return <LazyLegacyAssetRenderer value={raw} size={size} className={className} />;
};
