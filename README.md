# @osionos/ui

A React component kit: atoms, primitives, molecules and hooks. No runtime
dependencies — every library it touches is a peer, and most are optional.

## The token contract

The kit ships **no CSS file that it forces on you**. Every component styles
itself through `--osio-*` custom properties that the *host* defines, so one kit
renders correctly in a light theme, a dark theme, and every palette the host
defines (nine in osionos) without a single `if (theme === …)` in component code.

That makes the token set a real dependency, and an invisible one — so it is
declared, not assumed:

- **`tokens.css`** lists every property the kit reads, with reference light
  values. Import it to get a working look out of the box, or ignore it and
  define the tokens yourself.
- **`scripts/check-token-contract.mjs`** fails the build if a component starts
  reading a token that is not declared, *or* if a declared token stops being
  used. The contract cannot drift from the code.

A host that defines the tokens itself should also check the other direction —
that it actually satisfies the contract. Renaming a token in the host silently
falls back to the CSS initial value otherwise; nothing throws.

```ts
import '@osionos/ui/tokens.css';   // optional: only if you want the defaults
import { Button, Modal, useToastStore } from '@osionos/ui';
```

### Component tokens

Besides colours and sizes, the kit reads five sets of component tokens, one per
kind of surface. A host restyles every menu, field or chip by changing the set,
not the components. The values below are the defaults in `tokens.css`; osionos
defines them in `src/app/styles/recipes.css`, aliased onto its semantic tokens.

| Surface | Tokens | Read by |
| --- | --- | --- |
| Overlay | `--osio-overlay-bg`, `-border`, `-radius`, `-shadow`, `-padding` | `Menu`, `Popover`, `Dropdown` (all five); `Modal` (bg, border, radius) |
| Control | `--osio-control-radius`, `-bg-hover`, `-border` | `Button`, `IconButton`, `Menu`, `Dropdown`, `dropdownStyles` |
| Field | `--osio-field-bg`, `-border`, `-border-focus`, `-radius`, `-h` | `Input`, `dropdownStyles` |
| Chip | `--osio-chip-radius`, `-h`, `-px` | `dropdownStyles` (option and tag chips) |
| Tooltip | `--osio-tooltip-bg`, `-fg`, `-radius` | `Tooltip` |

`tokens.css` declares the same names with fallbacks that point at tokens the kit
already declares (`--osio-overlay-bg: var(--osio-bg-elevated)`), so a host that
imports the file and defines nothing else still gets a consistent look.
`IconButton` takes a required `label`, which becomes its `aria-label`; it does
not render a tooltip, so wrap it in `Tooltip` when sighted users need the name too.

### The contract check

`make tokens` (`scripts/check-token-contract.mjs`, plain node) compares the
`--osio-*` names found in `src/**/*.ts(x)` with the ones declared in `tokens.css`,
in both directions:

- a token the kit reads and `tokens.css` does not declare fails, with the files that read it;
- a token declared and read by nothing fails, so the contract cannot keep dead entries.

What it does not do:

- It matches the literal text `--osio-name`. A name assembled at runtime is not seen,
  and a name that appears only in a comment counts as read, which hides an unused declaration.
- It compares names, never values. Whether the host's value suits the kit is not checked.
- It checks the kit against `tokens.css`, not the host against the kit. The host half is
  osionos's `scripts/check-ui-token-contract.sh`, which fails when a declared token is
  undefined in the host stylesheets.

## Code-splitting

Deep subpaths are exported, so a heavy component stays out of your warm chunk:

```ts
// pulls mermaid only when this chunk loads
const Diagram = lazy(() => import('@osionos/ui/molecules/MermaidDiagram'));
```

`MermaidDiagram` (mermaid), `CodeSyntaxHighlight` (highlight.js) and the icon
catalogs (~2.8k generated lines) all load lazily at runtime.

## Layout

```
src/atoms/        Button, Badge, Card, Input, IconButton, Kbd, Avatar, IconValueView, …
src/primitives/   Modal, Menu, Popover, Dropdown, Toggle, Checkbox, Tooltip, MiniTabs, toasts
src/molecules/    IconPicker, EmojiPicker, MermaidDiagram, ConfirmDialog, …
src/hooks/        useClickOutside, useEscapeKey, viewport positioning
src/shared/       cx, icon-value parse/serialize, emoji skin tones (pure)
tokens.css        the token contract
```

`src/shared/` is the pure layer — no React, no DOM — and is where the unit tests
live. Icon values are **persisted strings**, so `parseIconValue` /
`serializeIconValue` are covered as a round-trip: an asymmetry there corrupts
saved documents rather than merely misrendering one.

## Peers

Required: `react`, `react-dom`, `zustand`, `lucide-react`,
`@univers42/ui-collection`. Optional (only if you use the component that needs
it): `mermaid`, `highlight.js`, `@tanstack/react-virtual`.

## Development

```sh
make check      # typecheck + tests + token contract
```
