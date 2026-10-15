import assert from 'node:assert/strict';
import test from 'node:test';

import { BUTTON_TONE_CLASS } from '../src/atoms/buttonTones.ts';

/**
 * Button renders through React, so what is pinned here is the class table: a
 * reversible or per-row destructive action must not carry the loud solid fill
 * that "Delete my account" does.
 */

const SOLID_DANGER_FILL = 'bg-[var(--osio-danger)]';

test('danger is the solid fill and danger-subtle is not', () => {
  assert.ok(BUTTON_TONE_CLASS.danger.includes(SOLID_DANGER_FILL));
  assert.ok(!BUTTON_TONE_CLASS['danger-subtle'].includes(SOLID_DANGER_FILL));
});

test('danger-subtle is danger text on a transparent fill with the control border', () => {
  const classes = BUTTON_TONE_CLASS['danger-subtle'].split(' ');
  assert.ok(classes.includes('text-[var(--osio-danger)]'));
  assert.ok(classes.includes('bg-transparent'));
  assert.ok(classes.includes('border-[var(--osio-control-border)]'));
});

test('danger-subtle tints with the danger colour on hover, through a token', () => {
  const hover = BUTTON_TONE_CLASS['danger-subtle'].split(' ').filter((name) => name.startsWith('hover:bg-'));
  assert.deepEqual(hover, ['hover:bg-[var(--osio-danger-subtle-bg-hover)]']);
});

test('every tone is a row of the table and none reads a raw colour', () => {
  assert.deepEqual(Object.keys(BUTTON_TONE_CLASS).sort(), ['danger', 'danger-subtle', 'default', 'ghost', 'primary']);
  for (const classes of Object.values(BUTTON_TONE_CLASS)) assert.doesNotMatch(classes, /#[0-9a-fA-F]{3,8}\b|rgb\(|oklch\(/);
});
