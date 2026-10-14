/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   AnimatedTab.tsx                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: dlesieur <dlesieur@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/07/12 12:00:00 by dlesieur          #+#    #+#             */
/*   Updated: 2026/07/12 12:00:00 by dlesieur         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import React, { useMemo, useState } from "react";
import { NOTO_ANIMATED_BASE, NOTO_ANIMATED_DATA } from "./notoAnimated.generated";
import { VirtualGrid } from "./VirtualRows";

interface AnimatedEmoji {
  cp: string;
  name: string;
}

const ITEMS: AnimatedEmoji[] = NOTO_ANIMATED_DATA.split("\n").map((line) => {
  const [cp, name] = line.split("|");
  return { cp, name };
});

/** gstatic-hosted animated WebP for one Noto emoji (also available as /512.gif). */
export function notoAnimatedUrl(cp: string): string {
  return `${NOTO_ANIMATED_BASE}/${cp}/512.webp`;
}

function notoStaticUrl(cp: string): string {
  return `${NOTO_ANIMATED_BASE}/${cp}/emoji.svg`;
}

/** One grid cell. It shows the static SVG and swaps to the animation only while
 *  hovered or focused. The animated file is ~330 KB and decodes at 512x512 per
 *  frame: as the 26px thumbnail of ~120 mounted cells it cost 58 MB and +660 MB
 *  of browser memory just to open the tab, 303 MB to scroll to the end (measured;
 *  the static set is 6 MB for all 878). */
const AnimatedTile: React.FC<{ item: AnimatedEmoji; onPick: (url: string) => void }> = ({ item, onPick }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <button
      type="button"
      title={item.name}
      onClick={() => onPick(notoAnimatedUrl(item.cp))}
      onPointerEnter={() => setIsPlaying(true)}
      onPointerLeave={() => setIsPlaying(false)}
      onFocus={() => setIsPlaying(true)}
      onBlur={() => setIsPlaying(false)}
      className="flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-(--osio-dur-fast) hover:bg-[var(--osio-bg-hover)]"
    >
      <img src={isPlaying ? notoAnimatedUrl(item.cp) : notoStaticUrl(item.cp)} alt={item.name} width={26} height={26} loading="lazy" draggable={false} />
    </button>
  );
};

/** Google Noto animated-emoji grid (~880, virtualized). Picking stores the
 *  animated asset URL as a regular `img:` icon, so it animates everywhere icons
 *  render. Previews load lazily from fonts.gstatic.com — offline they stay blank. */
export const AnimatedTab: React.FC<{ query: string; onPick: (url: string) => void }> = ({ query, onPick }) => {
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [{ title: `Animated · Noto Emoji · ${ITEMS.length}`, items: ITEMS }];
    return [{ items: ITEMS.filter((item) => item.name.includes(q)) }];
  }, [query]);

  if (sections.every((section) => section.items.length === 0)) {
    return <p className="p-6 text-center text-sm text-[var(--osio-fg-muted)]">No animated emoji match “{query}”.</p>;
  }
  return (
    <div ref={setScroller} className="h-full overflow-auto py-1">
      <VirtualGrid
        scrollElement={scroller}
        sections={sections}
        perRow={8}
        renderItem={(item) => <AnimatedTile key={item.cp} item={item} onPick={onPick} />}
      />
    </div>
  );
};

export default AnimatedTab;
