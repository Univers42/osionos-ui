/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   lockedMermaid.ts                                    +:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: dlesieur <dlesieur@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/10/22 00:00:00 by dlesieur          #+#    #+#             */
/*   Updated: 2026/10/22 00:00:00 by dlesieur         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

/**
 * The locked mermaid renderer (devil C108).
 *
 * `securityLevel: "strict"` alone is NOT a sandbox: DOMPurify keeps `<img>` in
 * a label (a shared page makes every viewer's browser fetch a third-party
 * URL), a `%%{init:…}%%` directive or a front-matter block rewrites the config
 * per diagram, and `click A "https://phish"` binds a URL or a callback here.
 *
 * Three layers: the SOURCE is scrubbed before mermaid parses it, the CONFIG is
 * fixed after initialization, the rendered SVG is scrubbed again.
 */

export type LockedMermaidTheme = "dark" | "neutral";

/**
 * The config keys a directive or a front-matter block may not touch. The first
 * six are mermaid's own default `secure` list (read out of the installed
 * mermaid 11.15.0 `defaultConfig`); the rest are the ones this renderer leans
 * on — HTML labels, the diagram config, and the stylesheet.
 */
export const LOCKED_MERMAID_SECURE_KEYS: string[] = [
  "secure", "securityLevel", "startOnLoad", "maxTextSize", "suppressErrorRendering", "maxEdges",
  "htmlLabels", "flowchart", "themeCSS", "themeVariables", "fontFamily", "altFontFamily",
];

/**
 * The leading YAML front-matter block mermaid reads as config — a superset of
 * mermaid's own `frontMatterRegex` (`/^-{3}\s*[\n\r](.*?)[\n\r]-{3}\s*[\n\r]+/s`),
 * so what mermaid would read as config, we remove.
 */
const FRONT_MATTER = /^\s*---[ \t]*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/;

/**
 * A `%%{init:…}%%` directive — it may span several lines. A superset of
 * mermaid's own `directiveRegex`, whose closing `}%%` is OPTIONAL: mermaid
 * applies `%%{init:{"securityLevel":"loose"}` even without it.
 */
const DIRECTIVE = /%%\{\s*\w[\s\S]*?(?:\}%%|$)/g;

/** A line whose FIRST token is one of these binds a link or a callback. */
const BINDING_LINE = /^[ \t]*(?:click|call|href)(?=[ \t]|$)/i;

/** The lines that can carry a CSS `url(…)` into the diagram. */
const STYLE_LINE = /^[ \t]*(?:style|classDef|linkStyle)(?=[ \t]|$)/i;

/** A CSS `url(…)` — a remote one is a fetch. */
const CSS_URL = /\burl\s*\(/i;

/** The SVG nodes that can carry a URL out of the diagram. */
const FORBIDDEN_SVG_TAGS = new Set(["img", "image", "a", "foreignobject"]);

/** The SVG attributes that carry a URL. */
const FORBIDDEN_SVG_ATTRS = ["href", "xlink:href"];

export interface LockedMermaidConfig {
  startOnLoad: false;
  securityLevel: "strict";
  htmlLabels: false;
  flowchart: { htmlLabels: false };
  theme: LockedMermaidTheme;
  secure: string[];
  dompurifyConfig: { FORBID_TAGS: string[]; FORBID_ATTR: string[] };
}

/** One pass of the scrub: front matter, then directives, then the line rules. */
function scrubOnce(text: string): string {
  let out = text;
  // A second front-matter block would become the LEADING one once the first
  // is gone, and mermaid would read that as the config.
  while (FRONT_MATTER.test(out)) out = out.replace(FRONT_MATTER, "");
  out = out.replace(DIRECTIVE, "");
  return out
    .split("\n")
    .filter((line) => {
      if (BINDING_LINE.test(line)) return false;
      if (STYLE_LINE.test(line) && CSS_URL.test(line)) return false;
      return true;
    })
    .join("\n");
}

/**
 * Strip everything a shared page could use to reach out of its diagram; every
 * other byte is left untouched.
 */
export function sanitizeMermaidSource(source: string): string {
  let text = source;
  // The rules feed each other: dropping a line can EXPOSE a front-matter
  // block that was hidden behind it, so the scrub repeats until it is stable.
  for (;;) {
    const next = scrubOnce(text);
    if (next === text) return text;
    text = next;
  }
}

/**
 * The one config every diagram renders through: `secure` locks the keys a
 * directive could rewrite, `htmlLabels` is off everywhere (a label is SVG
 * text, never HTML), and `dompurifyConfig` forbids the four URL-carrying nodes.
 */
export function lockedMermaidConfig(theme: LockedMermaidTheme): LockedMermaidConfig {
  return {
    startOnLoad: false,
    securityLevel: "strict",
    htmlLabels: false,
    flowchart: { htmlLabels: false },
    theme,
    secure: [...LOCKED_MERMAID_SECURE_KEYS],
    dompurifyConfig: {
      FORBID_TAGS: ["img", "image", "a", "foreignObject"],
      FORBID_ATTR: ["href", "xlink:href"],
    },
  };
}

/**
 * The belt after DOMPurify's braces: drop every node and attribute that can
 * carry a URL out of the rendered SVG. Returns how many were removed.
 */
export function stripForbiddenSvgNodes(root: ParentNode): number {
  let removed = 0;
  for (const el of Array.from(root.querySelectorAll("*"))) {
    if (!root.contains(el)) continue; // already gone, with an ancestor
    if (FORBIDDEN_SVG_TAGS.has((el.localName ?? "").toLowerCase())) {
      el.remove();
      removed += 1;
      continue;
    }
    for (const attr of FORBIDDEN_SVG_ATTRS) {
      if (el.hasAttribute(attr)) {
        el.removeAttribute(attr);
        removed += 1;
      }
    }
  }
  return removed;
}
