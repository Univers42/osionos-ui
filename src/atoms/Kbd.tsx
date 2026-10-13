import React from "react";

import { cx } from "../shared/classNames";

/**
 * Kbd — one keyboard key, styled as a small key cap.
 * Props:
 *   children: React.ReactNode   the key legend
 *   className?: string
 * One key per Kbd; a combination is several Kbd elements side by side.
 */
export interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export const Kbd: React.FC<KbdProps> = ({ children, className }) => (
  <kbd
    className={cx(
      "inline-flex min-w-5 h-5 items-center justify-center px-1 text-xs font-medium rounded-[var(--osio-radius-xs)] border border-[var(--osio-border-default)] bg-[var(--osio-bg-subtle)] text-[var(--osio-fg-muted)]",
      className,
    )}
  >
    {children}
  </kbd>
);
