import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCard } from '../public/cardView.js';

test('renders a baked card image as a selectable card without per-card controls', () => {
  const html = renderCard({
    id: 'fire_elemental',
    name: 'Fire Elemental',
    suit: 'fire',
    base: 4,
    text: 'Bonus: fire +15.'
  }, {
    buttonText: 'Discard',
    action: 'discard:fire_elemental'
  });

  assert.match(html, /class="card-slot"/);
  assert.match(html, /class="card-select"/);
  assert.match(html, /data-card-select="fire_elemental"/);
  assert.match(html, /class="card suit-fire"/);
  assert.match(html, /class="full-card-image"/);
  assert.match(html, /src="\/assets\/cards\/full\/fire_elemental\.png"/);
  assert.match(html, /alt="Fire Elemental"/);
  assert.equal(html.includes('class="card-controls"'), false);
  assert.equal(html.includes('data-action='), false);
  assert.equal(html.includes('data-card-detail='), false);
  assert.equal(html.includes('class="card-summary"'), false);
  assert.equal(html.includes('class="card-actions'), false);
  assert.equal(html.includes('class="card-rule-box"'), false);
});

test('escapes baked card image alt text and selection attributes', () => {
  const html = renderCard({
    id: 'bad-card',
    name: '<script>',
    suit: 'wild',
    base: 0,
    text: '<water>'
  }, {
    buttonText: 'Discard',
    action: 'discard:<bad-card>'
  });

  assert.equal(html.includes('<script>'), false);
  assert.match(html, /alt="&lt;script&gt;"/);
  assert.match(html, /src="\/assets\/cards\/full\/bad-card\.png"/);
  assert.match(html, /data-card-select="bad-card"/);
  assert.equal(html.includes('discard:&lt;bad-card&gt;'), false);
});

test('can render a baked card image without action controls for detail previews', () => {
  const html = renderCard({
    id: 'shapeshifter',
    name: 'Shapeshifter',
    suit: 'wild',
    base: 0,
    text: 'Copy another card.'
  }, {
    className: 'detail-card-full',
    showActions: false
  });

  assert.match(html, /class="card suit-wild detail-card-full"/);
  assert.match(html, /src="\/assets\/cards\/full\/shapeshifter\.png"/);
  assert.equal(html.includes('class="card-slot"'), false);
  assert.equal(html.includes('class="card-controls"'), false);
  assert.equal(html.includes('data-card-detail='), false);
});
