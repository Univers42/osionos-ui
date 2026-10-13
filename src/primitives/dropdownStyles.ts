// Trigger classes for Dropdown, kept beside it so the component stays readable.
export const TRIGGER_BASE =
  "inline-flex items-center justify-between gap-2 text-[var(--osio-fg-default)] transition-[color,background-color,border-color,box-shadow] duration-[var(--osio-dur-fast)] ease-[var(--osio-ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--osio-focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--osio-bg-page)] disabled:cursor-not-allowed disabled:opacity-60";

export const TRIGGER_VARIANT = {
  field:
    "h-[var(--osio-field-h)] rounded-[var(--osio-field-radius)] border border-[var(--osio-field-border)] bg-[var(--osio-field-bg)] px-3 text-sm font-medium hover:bg-[var(--osio-control-bg-hover)] focus-visible:border-[var(--osio-field-border-focus)]",
  inline:
    "h-[var(--osio-control-h-sm)] max-w-full rounded-[var(--osio-control-radius)] bg-transparent px-1.5 text-sm hover:bg-[var(--osio-control-bg-hover)]",
  // text-xs here and text-sm on the others: never both on one trigger, since
  // Tailwind settles two font-size utilities by stylesheet order.
  // A chosen value shown as the same pill a multi-select tag is.
  chip:
    "h-[var(--osio-chip-h)] max-w-full rounded-[var(--osio-chip-radius)] bg-[var(--osio-bg-muted)] px-[var(--osio-chip-px)] text-xs leading-none hover:bg-[var(--osio-control-bg-hover)]",
} as const;
