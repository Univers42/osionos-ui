import React, { useState } from "react";

import { avatarTint, initialsOf, type AvatarTint } from "../shared/initials";
import { cx } from "../shared/classNames";

export type AvatarSize = "xs" | "sm" | "md" | "lg";

export interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASS: Record<AvatarSize, string> = {
  xs: "h-5 w-5 text-[length:var(--osio-font-size-3xs)]",
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
};

// Written out literally so the token-contract script sees every tint it reads.
const TINT_CLASS: Record<AvatarTint, string> = {
  gray: "bg-[var(--osio-block-tint-gray-bg)] text-[var(--osio-block-tint-gray-fg)]",
  brown: "bg-[var(--osio-block-tint-brown-bg)] text-[var(--osio-block-tint-brown-fg)]",
  orange: "bg-[var(--osio-block-tint-orange-bg)] text-[var(--osio-block-tint-orange-fg)]",
  yellow: "bg-[var(--osio-block-tint-yellow-bg)] text-[var(--osio-block-tint-yellow-fg)]",
  green: "bg-[var(--osio-block-tint-green-bg)] text-[var(--osio-block-tint-green-fg)]",
  blue: "bg-[var(--osio-block-tint-blue-bg)] text-[var(--osio-block-tint-blue-fg)]",
  purple: "bg-[var(--osio-block-tint-purple-bg)] text-[var(--osio-block-tint-purple-fg)]",
  pink: "bg-[var(--osio-block-tint-pink-bg)] text-[var(--osio-block-tint-pink-fg)]",
  red: "bg-[var(--osio-block-tint-red-bg)] text-[var(--osio-block-tint-red-fg)]",
};

/**
 * Avatar — a circular identity mark: the image when it loads, its owner's
 * initials on a stable tint otherwise. The accessible name lives on the root;
 * the <img> is decorative, so alt="" is intentional.
 */
export const Avatar: React.FC<AvatarProps> = ({ name, src, size = "md", className }) => {
  // Remembers which URL failed, not that one did: a new src gets its own attempt.
  const [failedSrc, setFailedSrc] = useState<string | undefined>(undefined);
  const showImage = src !== undefined && src !== failedSrc;

  return (
    <span
      role="img"
      aria-label={name}
      className={cx(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium select-none",
        SIZE_CLASS[size],
        showImage ? undefined : TINT_CLASS[avatarTint(name)],
        className,
      )}
    >
      {showImage ? (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailedSrc(src)} />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
};
