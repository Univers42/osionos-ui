export type ButtonTone = "default" | "primary" | "danger" | "danger-subtle" | "ghost";

// "danger" is the solid fill for what cannot be undone; "danger-subtle" is the
// same hue as text and border for a reversible or per-row destructive action,
// so a list of them does not read as a wall of red.
export const BUTTON_TONE_CLASS: Record<ButtonTone, string> = {
  default:
    "border border-[var(--osio-control-border)] bg-[var(--osio-bg-surface)] text-[var(--osio-fg-default)] hover:bg-[var(--osio-control-bg-hover)] hover:border-[var(--osio-border-strong)]",
  primary:
    "bg-[var(--osio-accent)] text-[var(--osio-accent-fg)] shadow-[var(--osio-e1)] hover:bg-[var(--osio-accent-hover)] hover:shadow-[var(--osio-e2)]",
  danger:
    "bg-[var(--osio-danger)] text-[var(--osio-accent-fg)] shadow-[var(--osio-e1)] hover:bg-[var(--osio-danger-hover)] hover:shadow-[var(--osio-e2)]",
  "danger-subtle":
    "border border-[var(--osio-control-border)] bg-transparent text-[var(--osio-danger)] hover:bg-[color-mix(in_srgb,var(--osio-danger)_10%,transparent)] hover:border-[var(--osio-danger)]",
  ghost: "text-[var(--osio-fg-muted)] hover:bg-[var(--osio-control-bg-hover)] hover:text-[var(--osio-fg-default)]",
};
