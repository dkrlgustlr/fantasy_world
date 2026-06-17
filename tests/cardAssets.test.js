import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import cards from '../data/cards.json' with { type: 'json' };

function readPngSize(path) {
  const bytes = readFileSync(path);
  assert.equal(bytes.toString('ascii', 1, 4), 'PNG', `${path} should be a PNG file`);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20)
  };
}

test('all generated card illustrations exist and match the frame art window ratio', () => {
  const expectedRatio = (0.884 * 59) / (0.368 * 86);

  for (const card of cards) {
    const path = `public/assets/cards/generated/${card.id}.png`;
    assert.equal(existsSync(path), true, `${card.id} should have generated art`);

    const { width, height } = readPngSize(path);
    assert.ok(width > height, `${card.id} should be landscape, got ${width}x${height}`);
    assert.ok(
      Math.abs(width / height - expectedRatio) < 0.015,
      `${card.id} should match card art window ratio, got ${width}x${height}`
    );
  }
});

test('all baked full-card images exist with a Yu-Gi-Oh style card ratio', () => {
  for (const card of cards) {
    const path = `public/assets/cards/full/${card.id}.png`;
    assert.equal(existsSync(path), true, `${card.id} should have a baked full-card image`);

    const { width, height } = readPngSize(path);
    assert.equal(width, 590, `${card.id} full-card width`);
    assert.equal(height, 860, `${card.id} full-card height`);
  }
});

test('deck back asset exists for the draw deck control', () => {
  const path = 'public/assets/ui/cards/deck-back.png';
  assert.equal(existsSync(path), true, 'deck back image should exist');

  const { width, height } = readPngSize(path);
  assert.ok(width > 0, 'deck back image should have width');
  assert.ok(height > 0, 'deck back image should have height');
});

test('draw deck control uses the deck back image', () => {
  const css = readFileSync('public/styles.css', 'utf8');

  assert.match(css, /#drawDeck/);
  assert.match(css, /deck-back\.png/);
  assert.match(css, /aspect-ratio:\s*59\s*\/\s*86/);
});

test('draw deck control does not add ghost deck layers', () => {
  const css = readFileSync('public/styles.css', 'utf8');

  assert.doesNotMatch(css, /#drawDeck::before/);
  assert.doesNotMatch(css, /#drawDeck::after/);
});

test('selected action button image assets exist', () => {
  assert.equal(existsSync('public/assets/ui/button-primary.svg'), true, 'primary action button image should exist');
  assert.equal(existsSync('public/assets/ui/button-disabled.svg'), true, 'disabled action button image should exist');
});
