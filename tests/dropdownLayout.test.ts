import assert from 'node:assert/strict';
import test from 'node:test';

import { menuPlacement, showsValue, triggerMoved, VIEWPORT_PAD } from '../src/primitives/dropdownLayout.ts';

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

// Anchored by its bottom edge: a short list sits right above the trigger
// instead of where a list of the maximum height would start.
test('the list opens above the trigger when there is no room below, hugging it', () => {
  const low = { left: 100, right: 200, top: 800, bottom: 828, width: 100 };
  const placement = menuPlacement(low, DESKTOP, 'trigger', 'start');
  assert.equal(placement.top, undefined);
  assert.equal(placement.bottom, 900 - 800 + 6);
});

test('a list with room below opens below the trigger', () => {
  const placement = menuPlacement(TRIGGER, PHONE, 'trigger', 'start');
  assert.equal(placement.top, 328 + 6);
  assert.equal(placement.bottom, undefined);
});

test('a scroll that left the trigger in place does not count as a move', () => {
  const at = { left: 10, right: 110, top: 200, bottom: 228, width: 100 };
  assert.equal(triggerMoved(at, { ...at }), false);
  assert.equal(triggerMoved(at, { ...at, top: 200.4, bottom: 228.4 }), false);
  assert.equal(triggerMoved(at, { ...at, top: 180, bottom: 208 }), true);
  assert.equal(triggerMoved(at, { ...at, left: 30, right: 130 }), true);
});

test('an empty-string option shows the placeholder, a real one shows its label', () => {
  assert.equal(showsValue({ value: '' }), false);
  assert.equal(showsValue(undefined), false);
  assert.equal(showsValue({ value: 'Doing' }), true);
});
