/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   LucideGlyph.tsx                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: dlesieur <dlesieur@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/06/08 12:00:00 by dlesieur          #+#    #+#             */
/*   Updated: 2026/06/08 12:00:00 by dlesieur         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import React, { Suspense } from "react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { GlyphPlaceholder, LazyLegacyAssetRenderer } from "./LazyLegacyAssetRenderer";

// dynamicIconImports is a kebab-name → () => import() map of the whole lucide set, so each icon is
// its own chunk and nothing here lands in the main bundle (IconValueView lazy-imports this file).
type Loader = () => Promise<{ default: React.ComponentType<{ size?: number; color?: string }> }>;
const IMPORTS = dynamicIconImports as unknown as Record<string, Loader>;
const cache = new Map<string, React.LazyExoticComponent<React.ComponentType<{ size?: number; color?: string }>>>();

function resolveIcon(name: string) {
  if (!cache.has(name)) cache.set(name, React.lazy(IMPORTS[name]));
  return cache.get(name)!;
}

/** Render `icon:<name>` — via lucide when the name exists there, else fall back to the legacy
 *  AssetRenderer catalog (so package names like "page"/"table" keep working), loaded only then:
 *  a lucide icon never pulls ui-collection's catalogs in. */
const LucideGlyph: React.FC<{ name: string; size?: number; color?: string }> = ({ name, size = 20, color }) => {
  // Memoized BEFORE the conditional return (rules of hooks): resolveIcon is
  // cache-stable per name, but the linter needs the render-stability spelled.
  const known = name in IMPORTS;
  // resolveIcon returns the MODULE-CACHED React.lazy per name (stable
  // identity across renders) — no component is created during render.
  const Cmp = React.useMemo(() => (known ? resolveIcon(name) : null), [known, name]);
  if (!known || !Cmp) return <LazyLegacyAssetRenderer value={`icon:${name}`} size={size} />;
  return (
    <Suspense fallback={<GlyphPlaceholder size={size} />}>
      {/* eslint-disable-next-line react-hooks/static-components -- Cmp is the
          module-cached React.lazy per name (stable identity across renders) */}
      <Cmp size={size} color={color} />
    </Suspense>
  );
};

export default LucideGlyph;
