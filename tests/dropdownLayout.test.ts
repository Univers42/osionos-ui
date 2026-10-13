import assert from 'node:assert/strict';
import test from 'node:test';

import { menuPlacement, showsValue, VIEWPORT_PAD } from '../src/primitives/dropdownLayout.ts';

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };
// A narrow value trigger sitting near the right edge of a 390px screen.
const TRIGGER = { left: 218, right: 313, top: 300, bottom: 328, width: 95 };

test('an auto-width list stays anchored to its trigger on a phone', () => {
  const placement = menuPlacement(TRIGGER, PHONE, 'auto', 'start');
  assert.equal(placement.left, 218);
  assert.equal(placement.width, undefined);
  assert.equal(placement.minWidth, 95);
  assert.equal(placement.maxWidth, 390 - 218 - VIEWPORT_PAD);
});

test('an auto-width list aligned to the end hangs from the trigger right edge', () => {
  const placement = menuPlacement(TRIGGER, PHONE, 'auto', 'end');
  assert.equal(placement.right, 390 - 313);
  assert.equal(placement.left, undefined);
});

test('an auto-width list is pulled back inside the viewport when its trigger overflows', () => {
  const placement = menuPlacement({ ...TRIGGER, left: 380, right: 475 }, PHONE, 'auto', 'start');
  assert.equal(placement.left, 390 - 95 - VIEWPORT_PAD);
});

test('a numeric width is clamped by that width', () => {
  const placement = menuPlacement(TRIGGER, PHONE, 260, 'start');
  assert.equal(placement.left, 390 - 260 - VIEWPORT_PAD);
  assert.equal(placement.width, 260);
});

test('the list opens above the trigger when there is no room below', () => {
  const low = { left: 100, right: 200, top: 800, bottom: 828, width: 100 };
  const placement = menuPlacement(low, DESKTOP, 'trigger', 'start');
  assert.equal(placement.top, 800 - placement.maxHeight - 6);
});

test('an empty-string option shows the placeholder, a real one shows its label', () => {
  assert.equal(showsValue({ value: '' }), false);
  assert.equal(showsValue(undefined), false);
  assert.equal(showsValue({ value: 'Doing' }), true);
});
