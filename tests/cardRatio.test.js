import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8');

function rootVar(name) {
  const match = css.match(new RegExp(`${name}:\\s*(\\d+)px;`));
  assert.ok(match, `${name} should be declared in px`);
  return Number(match[1]);
}

function appMaxWidth() {
  const match = css.match(/\.app\s*{[^}]*width:\s*min\((\d+)px,\s*calc\(100% - (\d+)px\)\);/s);
  assert.ok(match, 'desktop app width should use a pixel max and viewport gutter');
  return {
    max: Number(match[1]),
    gutter: Number(match[2])
  };
}

function expectYuGiOhRatio(width, height, label) {
  const actual = width / height;
  const expected = 59 / 86;
  assert.ok(
    Math.abs(actual - expected) < 0.006,
    `${label} should be close to 59:86, got ${width}:${height}`
  );
}

test('main card dimensions use a Yu-Gi-Oh style 59:86 aspect ratio', () => {
  expectYuGiOhRatio(rootVar('--card-width'), rootVar('--card-height'), 'hand card');
});

test('desktop board uses wider space and larger readable cards', () => {
  const appWidth = appMaxWidth();

  assert.ok(appWidth.max >= 1520, 'desktop board should not stop at a narrow 1280px max');
  assert.ok(appWidth.gutter <= 32, 'desktop board should keep tighter side gutters');
  assert.ok(rootVar('--card-width') >= 184, 'desktop hand cards should be large enough to read');
  assert.ok(rootVar('--discard-card-width') >= 166, 'desktop discard cards should be large enough to read');
});

test('discard preview dimensions keep the same card aspect ratio', () => {
  expectYuGiOhRatio(
    rootVar('--discard-card-width'),
    rootVar('--discard-card-height'),
    'discard card'
  );
});

test('card artwork is contained inside the frame instead of cropped', () => {
  assert.match(css, /\.card-art img\s*{[^}]*object-fit:\s*contain;/s);
});

test('detail card preview uses the same 59:86 card ratio', () => {
  assert.match(css, /\.detail-card-full\s*{[^}]*aspect-ratio:\s*59\s*\/\s*86;/s);
});

test('detail card text is compact and clipped to the printed rules box', () => {
  assert.match(css, /\.detail-card-full \.card-rule-box\s*{[^}]*font-size:\s*clamp\(9px,\s*calc\(var\(--card-width\) \* 0\.038\),\s*13px\);/s);
  assert.match(css, /\.detail-card-full \.card-rule-box\s*{[^}]*overflow:\s*hidden;/s);
  assert.match(css, /\.detail-card-full \.term,\s*\.detail-card-full \.rule-word,\s*\.detail-card-full \.score-word\s*{[^}]*padding:\s*0 3px;/s);
});
