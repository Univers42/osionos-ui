/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   IconButton.tsx                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: dlesieur <dlesieur@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/05/18 21:19:21 by dlesieur          #+#    #+#             */
/*   Updated: 2026/05/18 21:19:21 by dlesieur         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import React from "react";

import { cx } from "../shared/classNames";

export type IconButtonSize = "xs" | "sm" | "md";
export type IconButtonTone = "default" | "muted" | "danger";

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  /** The button's accessible name: an icon alone says nothing to a screen reader. */
  label: string;
  size?: IconButtonSize;
  tone?: IconButtonTone;
}

const SIZE_CLASS: Record<IconButtonSize, string> = {
  // The box is a control height, never below 24px — WCAG 2.2 target-size
  // (Lighthouse a11y gate). Keep the ICON small via padding, not the hit area.
  xs: "h-[var(--osio-control-h-xs)] w-[var(--osio-control-h-xs)] p-1",
  sm: "h-[var(--osio-control-h-sm)] w-[var(--osio-control-h-sm)] p-1",
  md: "h-[var(--osio-control-h-md)] w-[var(--osio-control-h-md)] p-1.5",
};

const TONE_CLASS: Record<IconButtonTone, string> = {
  default: "text-[var(--osio-fg-default)] hover:bg-[var(--osio-control-bg-hover)]",
  muted: "text-[var(--osio-fg-muted)] hover:bg-[var(--osio-control-bg-hover)] hover:text-[var(--osio-fg-default)]",
  danger: "text-[var(--osio-danger)] hover:bg-[var(--osio-control-bg-hover)] hover:text-[var(--osio-danger-hover)]",
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, label, size = "sm", tone = "muted", type = "button", children, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-[var(--osio-control-radius)] transition-[background-color,color,box-shadow,transform] duration-[var(--osio-dur-fast)] ease-[var(--osio-ease-standard)] active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--osio-focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--osio-bg-page)] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
        SIZE_CLASS[size],
        TONE_CLASS[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);

IconButton.displayName = "IconButton";
