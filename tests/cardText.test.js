import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCardText } from '../public/cardText.js';

test('highlights card suit keywords in rules text', () => {
  const html = formatCardText('물 1장당 +10. 모든 군대 무효. 모든 땅 무효.');

  assert.match(html, /class="term term-water">물<\/span>/);
  assert.match(html, /class="term term-army">군대<\/span>/);
  assert.match(html, /class="term term-land">땅<\/span>/);
  assert.match(html, /class="rule-word">무효<\/span>/);
  assert.match(html, /class="score-word">\+10<\/span>/);
});

test('escapes card text before applying highlights', () => {
  const html = formatCardText('<물> & 마법사');

  assert.equal(html.includes('<물>'), false);
  assert.match(html, /&lt;<span class="term term-water">물<\/span>&gt; &amp; <span class="term term-wizard">마법사<\/span>/);
});
