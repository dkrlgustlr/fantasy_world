import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const script = readFileSync(
  new URL('../scripts/render-full-card-images.ps1', import.meta.url),
  'utf8'
);

test('full card renderer uses a Korean calligraphy-style font stack', () => {
  assert.match(script, /\$cardFontFamily\s*=\s*'Gungsuh'/);
  assert.match(script, /\$fallbackFontFamily\s*=\s*'Malgun Gothic'/);
});

test('full card renderer normalizes bonus and penalty labels before drawing rules', () => {
  assert.match(script, /function Normalize-RuleText/);
  assert.match(script, /\$bonusLabel/);
  assert.match(script, /\$penaltyLabel/);
});

test('full card renderer colors suit terms inside the rules text', () => {
  assert.match(script, /function Get-RuleTextColor/);
  assert.match(script, /\$termColors/);
  assert.match(script, /Draw-RichWrappedText/);
});

test('full card renderer enlarges rules and leaves action buttons to the UI', () => {
  assert.match(script, /\$fontSize\s*=\s*34/);
  assert.match(script, /New-Rect 82 598 426 210/);
  assert.doesNotMatch(script, /Draw-TextCenter[\s\S]*\$discardLabel/);
  assert.doesNotMatch(script, /Draw-TextCenter[\s\S]*\$detailLabel/);
});

test('full card renderer replaces the lower button area with an expanded rules box', () => {
  assert.match(script, /function Draw-ExpandedRuleBox/);
  assert.match(script, /Draw-ExpandedRuleBox -Graphics \$graphics/);
  assert.match(script, /New-Rect 52 548 486 286/);
  assert.doesNotMatch(script, /Draw-ActionButtonAreaCover/);
});
