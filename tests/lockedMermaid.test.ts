import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LOCKED_MERMAID_SECURE_KEYS,
  lockedMermaidConfig,
  sanitizeMermaidSource,
  stripForbiddenSvgNodes,
} from '../src/molecules/MermaidDiagram/lockedMermaid.ts';

/**
 * Mermaid diagrams come from shared pages, so the renderer is locked (devil
 * C108): the source is scrubbed before mermaid parses it, the config is fixed
 * after initialization, and the rendered SVG is scrubbed again.
 *
 * What is pinned here is the pure layer — the scrubbing, the config, and the
 * belt. The React component is covered by the host's e2e suite.
 */

// ── the five C108 fixtures ──────────────────────────────────────────────────

test('a label carrying an <img> is left alone — the RENDER scrubs it, not the source', () => {
  const source = 'flowchart TD\n A["<img src=https://x onerror=alert(1)>"] --> B';
  assert.equal(sanitizeMermaidSource(source), source);
});

test('an init directive is gone', () => {
  const out = sanitizeMermaidSource('%%{init:{"securityLevel":"loose"}}%%\nflowchart TD\n A-->B');
  assert.ok(!out.includes('%%{'), out);
  assert.ok(!out.includes('securityLevel'), out);
  assert.ok(out.includes('flowchart TD'), out);
});

test('a front-matter block is gone', () => {
  const out = sanitizeMermaidSource(
    '---\nconfig:\n  themeCSS: ".node{background:url(https://x)}"\n---\nflowchart TD\n A-->B',
  );
  assert.ok(!out.includes('themeCSS'), out);
  assert.ok(!out.includes('---'), out);
  assert.ok(out.includes('flowchart TD'), out);
});

test('a click link line is gone', () => {
  const out = sanitizeMermaidSource('flowchart TD\n A-->B\nclick A "https://phish"');
  assert.ok(!out.includes('click'), out);
  assert.ok(!out.includes('phish'), out);
});

test('a click callback line is gone', () => {
  const out = sanitizeMermaidSource('flowchart TD\n A-->B\nclick A call f()');
  assert.ok(!out.includes('click'), out);
  assert.ok(!out.includes('call f()'), out);
});

// ── the rest of the rules ───────────────────────────────────────────────────

test('a multi-line directive is gone', () => {
  const out = sanitizeMermaidSource('%%{init: {\n  "theme": "dark"\n}}%%\nflowchart TD\n A-->B');
  assert.ok(!out.includes('%%{'), out);
  assert.ok(!out.includes('theme'), out);
});

test('an unterminated directive is gone — mermaid applies one without its closing', () => {
  const out = sanitizeMermaidSource('%%{init:{"securityLevel":"loose"}\nflowchart TD\n A-->B');
  assert.ok(!out.includes('%%{'), out);
  assert.ok(!out.includes('securityLevel'), out);
});

test('a second front-matter block does not become the leading one', () => {
  const out = sanitizeMermaidSource(
    '---\nconfig:\n  themeCSS: "a"\n---\n---\nconfig:\n  themeCSS: "b"\n---\nflowchart TD',
  );
  assert.ok(!out.includes('themeCSS'), out);
  assert.ok(!out.startsWith('---'), out);
});

test('a classDef carrying a url() is gone', () => {
  const out = sanitizeMermaidSource('flowchart TD\n A-->B\nclassDef c fill:url(https://x)');
  assert.ok(!out.includes('classDef'), out);
});

test('a classDef carrying a colour is kept', () => {
  const out = sanitizeMermaidSource('flowchart TD\n A-->B\nclassDef c fill:#f00');
  assert.ok(out.includes('classDef c fill:#f00'), out);
});

test('a style line carrying a url() is gone, a style line carrying a colour is kept', () => {
  const gone = sanitizeMermaidSource('style A background:url(https://x)');
  assert.equal(gone.trim(), '');
  const kept = sanitizeMermaidSource('style A fill:#f00');
  assert.ok(kept.includes('style A fill:#f00'), kept);
});

test('a linkStyle carrying a url() is gone', () => {
  const out = sanitizeMermaidSource('linkStyle 0 stroke:url(https://x)');
  assert.ok(!out.includes('linkStyle'), out);
});

test('a label that says "click" mid-line is kept', () => {
  const source = 'flowchart TD\n A["click here to buy"] --> B';
  assert.equal(sanitizeMermaidSource(source), source);
});

test('a node NAMED click is kept — only a line whose first token is the keyword goes', () => {
  const source = 'flowchart TD\n click["Buy"] --> B';
  assert.equal(sanitizeMermaidSource(source), source);
});

test('ordinary text is untouched, byte for byte', () => {
  const source = 'flowchart TD\n  A["Hello, world"] --> B\n  B --> C\n';
  assert.equal(sanitizeMermaidSource(source), source);
});

// ── the config ──────────────────────────────────────────────────────────────

test('the config is strict, with no HTML labels anywhere', () => {
  const config = lockedMermaidConfig('dark');
  assert.equal(config.securityLevel, 'strict');
  assert.equal(config.startOnLoad, false);
  assert.equal(config.htmlLabels, false);
  assert.equal(config.flowchart.htmlLabels, false);
  assert.equal(config.theme, 'dark');
  assert.equal(lockedMermaidConfig('neutral').theme, 'neutral');
});

test('every key a directive could rewrite is locked', () => {
  const config = lockedMermaidConfig('dark');
  for (const key of LOCKED_MERMAID_SECURE_KEYS) {
    assert.ok(config.secure.includes(key), `${key} is not locked`);
  }
  // mermaid's own default secure list, read out of the installed 11.15.0.
  for (const key of [
    'secure',
    'securityLevel',
    'startOnLoad',
    'maxTextSize',
    'suppressErrorRendering',
    'maxEdges',
  ]) {
    assert.ok(config.secure.includes(key), `${key} is not locked`);
  }
  assert.ok(config.secure.includes('themeCSS'), 'themeCSS is not locked');
});

test('the four nodes that can carry a URL are forbidden in a label', () => {
  const config = lockedMermaidConfig('dark');
  for (const tag of ['img', 'image', 'a', 'foreignObject']) {
    assert.ok(config.dompurifyConfig.FORBID_TAGS.includes(tag), `${tag} is allowed`);
  }
  assert.ok(config.dompurifyConfig.FORBID_ATTR.includes('href'));
  assert.ok(config.dompurifyConfig.FORBID_ATTR.includes('xlink:href'));
});

// ── the belt ────────────────────────────────────────────────────────────────

/** The smallest DOM the belt needs: a parent, its children, and attributes. */
class FakeNode {
  readonly localName: string;
  readonly attributes = new Set<string>();
  readonly children: FakeNode[] = [];
  parent: FakeNode | null = null;

  constructor(localName: string, attributes: string[] = []) {
    this.localName = localName;
    attributes.forEach((name) => this.attributes.add(name));
  }

  add(child: FakeNode): FakeNode {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  remove(): void {
    const parent = this.parent;
    if (!parent) return;
    const at = parent.children.indexOf(this);
    if (at >= 0) parent.children.splice(at, 1);
    this.parent = null;
  }

  hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }

  descendants(): FakeNode[] {
    return this.children.flatMap((child) => [child, ...child.descendants()]);
  }

  contains(node: FakeNode): boolean {
    let cursor: FakeNode | null = node;
    while (cursor) {
      if (cursor === this) return true;
      cursor = cursor.parent;
    }
    return false;
  }

  querySelectorAll(_selector: string): FakeNode[] {
    return this.descendants();
  }
}

test('the belt removes the nodes and the attributes that can point out', () => {
  const root = new FakeNode('div');
  const svg = root.add(new FakeNode('svg'));
  const group = svg.add(new FakeNode('g'));
  group.add(new FakeNode('img'));
  group.add(new FakeNode('a', ['href']));
  const foreign = group.add(new FakeNode('foreignObject'));
  foreign.add(new FakeNode('img'));
  const use = group.add(new FakeNode('use', ['href', 'xlink:href']));
  group.add(new FakeNode('path', ['d']));

  const removed = stripForbiddenSvgNodes(root as unknown as ParentNode);

  // img + a + foreignObject, then the two href attributes of the <use>.
  assert.equal(removed, 5);
  const left = root.descendants().map((node) => node.localName);
  assert.deepEqual(left, ['svg', 'g', 'use', 'path']);
  assert.equal(use.hasAttribute('href'), false);
  assert.equal(use.hasAttribute('xlink:href'), false);
});

test('the belt leaves a clean diagram alone', () => {
  const root = new FakeNode('div');
  const svg = root.add(new FakeNode('svg'));
  svg.add(new FakeNode('path', ['d']));
  assert.equal(stripForbiddenSvgNodes(root as unknown as ParentNode), 0);
  assert.equal(root.descendants().length, 2);
});

// ── the property test ───────────────────────────────────────────────────────

/** A seeded PRNG (mulberry32) — the same 500 sources on every run. */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FRAGMENTS = [
  'flowchart TD',
  '  A --> B',
  '  A["a label"] --> B',
  '%%{init:{"securityLevel":"loose"}}%%',
  '%%{init: {\n  "theme": "dark"\n}}%%',
  'click A "https://phish"',
  '  click A call f()',
  'href A "https://phish"',
  'call f()',
  'classDef c fill:url(https://x)',
  'classDef c fill:#f00',
  'style A fill:#f00',
  'style A background:url(https://x)',
  'linkStyle 0 stroke:url(https://x)',
  'A["click here"] --> B',
  '---\nconfig:\n  themeCSS: ".node{background:url(https://x)}"\n---',
];

test('no generated source can keep a directive, a front-matter block or a binding', () => {
  const random = seeded(0xc108);
  for (let i = 0; i < 500; i++) {
    const lines: string[] = [];
    const count = 1 + Math.floor(random() * 8);
    for (let n = 0; n < count; n++) {
      lines.push(FRAGMENTS[Math.floor(random() * FRAGMENTS.length)]!);
    }
    const source = lines.join('\n');
    const out = sanitizeMermaidSource(source);

    assert.ok(!out.includes('%%{'), `directive left in:\n${out}`);
    assert.ok(!out.startsWith('---'), `front-matter left at the top:\n${out}`);
    assert.ok(!/^-{3}\s*[\n\r]/.test(out), `front-matter left at the top:\n${out}`);
    for (const line of out.split('\n')) {
      assert.ok(
        !/^[ \t]*(?:click|call|href)(?=[ \t]|$)/i.test(line),
        `binding line left in:\n${out}`,
      );
    }
  }
});
