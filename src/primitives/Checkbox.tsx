import React, { useEffect, useRef } from "react";
import { Check, Minus } from "lucide-react";

import { cx } from "../shared/classNames";

export interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  label?: React.ReactNode;
  /** Required when there is no visible label. */
  ariaLabel?: string;
  className?: string;
}

const BOX =
  "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[var(--osio-radius-xs)] border transition-colors duration-[var(--osio-dur-fast)] ease-[var(--osio-ease-standard)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--osio-focus-ring-color)]";
// One or the other, never both: two background utilities on one element are
// settled by their order in the stylesheet, and the unchecked one came last.
const BOX_ON = "border-[var(--osio-accent)] bg-[var(--osio-accent)] text-[var(--osio-accent-fg)]";
const BOX_OFF = "border-[var(--osio-border-strong)] bg-[var(--osio-bg-surface)]";

/**
 * Checkbox — a real native checkbox, visually replaced by a styled box so it
 * keeps the platform's keyboard, screen-reader and form behaviour.
 * Props:
 *   checked: boolean                 controlled state
 *   onChange: (next: boolean) => void
 *   indeterminate?: boolean          mixed state (DOM property, not an attribute)
 *   disabled?: boolean
 *   label?: React.ReactNode          visible text next to the box
 *   ariaLabel?: string               required when there is no visible label
 *   className?: string
 */
export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, indeterminate = false, disabled = false, label, ariaLabel, className }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const active = checked || indeterminate;

  return (
    <label
      className={cx(
        "inline-flex items-center gap-2",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => {
          // The browser clears the mixed state on every press. The owner decides
          // it, so it is put back until they change the prop.
          event.target.indeterminate = indeterminate;
          onChange(event.target.checked);
        }}
      />
      <span aria-hidden="true" className={cx(BOX, active ? BOX_ON : BOX_OFF)}>
        {indeterminate ? <Minus size={12} strokeWidth={3} /> : checked ? <Check size={12} strokeWidth={3} /> : null}
      </span>
      {label ? <span className="text-sm text-[var(--osio-fg-default)]">{label}</span> : null}
    </label>
  );
};
