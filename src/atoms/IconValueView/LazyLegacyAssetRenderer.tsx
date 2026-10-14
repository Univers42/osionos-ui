/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   LazyLegacyAssetRenderer.tsx                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: dlesieur <dlesieur@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/10/13 00:00:00 by dlesieur          #+#    #+#             */
/*   Updated: 2026/10/13 00:00:00 by dlesieur         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import React, { Suspense } from "react";

const LegacyAssetRenderer = React.lazy(() =>
  import("./legacyAssetRenderer").then((module) => ({ default: module.AssetRenderer })),
);

interface Props {
  value: string;
  size: number;
  className?: string;
}

/** An empty box the glyph's size, so a glyph that is still loading moves nothing around it. */
export const GlyphPlaceholder: React.FC<{ size: number }> = ({ size }) => (
  <span style={{ display: "inline-block", width: size, height: size }} />
);

/** AssetRenderer, fetched on the first value only it can draw; until then, its placeholder. */
export const LazyLegacyAssetRenderer: React.FC<Props> = ({ value, size, className }) => (
  <Suspense fallback={<GlyphPlaceholder size={size} />}>
    <LegacyAssetRenderer value={value} size={size} className={className} />
  </Suspense>
);
