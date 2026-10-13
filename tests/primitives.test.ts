import assert from 'node:assert/strict';
import test from 'node:test';

import { AVATAR_TINTS, avatarTint, initialsOf } from '../src/shared/initials.ts';
import { tooltipPosition } from '../src/hooks/tooltipPosition.ts';

/**
 * Avatar and Tooltip render through React, so the host's e2e suite covers the
 * markup. What they decide — which letters, which colour, where on screen — is
 * pure, and is pinned here: an avatar that changes colour between releases, or
 * a tooltip that opens off-screen, is a regression nobody reports precisely.
 */

test('initialsOf takes the first letter of the first and last word', () => {
  assert.equal(initialsOf('Ada Lovelace'), 'AL');
  assert.equal(initialsOf('ada lovelace'), 'AL');
  assert.equal(initialsOf('  Ada   Lovelace  '), 'AL');
  assert.equal(initialsOf('Mary Jane Watson'), 'MW');
  assert.equal(initialsOf('Jean-Luc Picard'), 'JP');
  assert.equal(initialsOf('Ada'), 'A');
});

test('initialsOf reads an email by its local part, without the +tag', () => {
  assert.equal(initialsOf('dev@gmail.com'), 'D');
  assert.equal(initialsOf('john.doe@example.com'), 'JD');
  assert.equal(initialsOf('john_doe+billing@example.com'), 'JD');
  assert.equal(initialsOf('mary-jane.watson@example.com'), 'MW');
});

test('initialsOf handles a handle, an accent, an emoji and nothing at all', () => {
  assert.equal(initialsOf('@ada'), 'A');
  assert.equal(initialsOf('émile zola'), 'ÉZ');
  assert.equal(initialsOf('😀 smile'), '😀S');
  assert.equal(initialsOf(''), '?');
  assert.equal(initialsOf('   '), '?');
  assert.equal(initialsOf('@'), '?');
});

test('avatarTint gives one person one colour, whatever the spacing or case', () => {
  assert.deepEqual([...AVATAR_TINTS], ['gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red']);
  assert.equal(avatarTint('Ada'), 'purple');
  assert.equal(avatarTint('  ADA '), 'purple');
  assert.equal(avatarTint('grace hopper'), 'gray');
  assert.equal(avatarTint('dev@gmail.com'), 'orange');
  assert.equal(avatarTint('Émile Zola'), 'yellow');
  assert.equal(avatarTint('a'), 'pink');
  assert.equal(avatarTint(''), 'gray');
  assert.equal(avatarTint('   '), 'gray');
});

test('avatarTint spreads a crowd over every colour', () => {
  const used = new Set<string>();
  for (let index = 0; index < 200; index += 1) used.add(avatarTint(`user ${index}`));
  assert.equal(used.size, AVATAR_TINTS.length);
});

const viewport = { width: 1000, height: 800 };
const tooltip = { width: 100, height: 30 };

test('a tooltip sits centred on its preferred side when there is room', () => {
  const trigger = { top: 400, left: 450, width: 100, height: 20 };
  assert.deepEqual(tooltipPosition(trigger, tooltip, viewport), { top: 364, left: 450, side: 'top' });
  assert.deepEqual(tooltipPosition(trigger, tooltip, viewport, { side: 'bottom' }), { top: 426, left: 450, side: 'bottom' });
  assert.deepEqual(tooltipPosition(trigger, tooltip, viewport, { side: 'right' }), { top: 395, left: 556, side: 'right' });
  assert.deepEqual(tooltipPosition(trigger, tooltip, viewport, { side: 'left' }), { top: 395, left: 344, side: 'left' });
});

test('a tooltip flips to the opposite side when its own side has no room', () => {
  assert.deepEqual(
    tooltipPosition({ top: 10, left: 450, width: 100, height: 20 }, tooltip, viewport),
    { top: 36, left: 450, side: 'bottom' },
  );
  assert.deepEqual(
    tooltipPosition({ top: 770, left: 450, width: 100, height: 20 }, tooltip, viewport, { side: 'bottom' }),
    { top: 734, left: 450, side: 'top' },
  );
  assert.deepEqual(
    tooltipPosition({ top: 400, left: 900, width: 90, height: 20 }, tooltip, viewport, { side: 'right' }),
    { top: 395, left: 794, side: 'left' },
  );
  assert.deepEqual(
    tooltipPosition({ top: 400, left: 10, width: 90, height: 20 }, tooltip, viewport, { side: 'left' }),
    { top: 395, left: 106, side: 'right' },
  );
});

test('a tooltip never leaves the viewport along its cross axis', () => {
  assert.equal(tooltipPosition({ top: 400, left: 0, width: 20, height: 20 }, tooltip, viewport).left, 8);
  assert.equal(tooltipPosition({ top: 400, left: 980, width: 20, height: 20 }, tooltip, viewport).left, 892);
  assert.equal(tooltipPosition({ top: 0, left: 450, width: 100, height: 10 }, tooltip, viewport, { side: 'right' }).top, 8);
  assert.equal(tooltipPosition({ top: 790, left: 450, width: 100, height: 10 }, tooltip, viewport, { side: 'right' }).top, 762);
});

test('a tooltip keeps its preferred side when neither side has room', () => {
  const cramped = { width: 1000, height: 50 };
  assert.deepEqual(
    tooltipPosition({ top: 15, left: 450, width: 100, height: 20 }, tooltip, cramped),
    { top: -21, left: 450, side: 'top' },
  );
});

test('gap and margin are adjustable', () => {
  const trigger = { top: 400, left: 0, width: 20, height: 20 };
  assert.deepEqual(tooltipPosition(trigger, tooltip, viewport, { gap: 10, margin: 20 }), { top: 360, left: 20, side: 'top' });
});
