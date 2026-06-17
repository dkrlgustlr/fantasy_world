import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCardDetail } from '../public/cardDetail.js';

test('renders detail view as a large baked full-card image', () => {
  const html = renderCardDetail({
    id: 'shapeshifter',
    name: '변신 능력자',
    suit: '불명',
    base: 0,
    text: '복사 가능.'
  });

  assert.match(html, /class="detail-card-stage"/);
  assert.match(html, /class="card suit-불명 detail-card-full"/);
  assert.match(html, /class="full-card-image"/);
  assert.match(html, /src="\/assets\/cards\/full\/shapeshifter\.png"/);
  assert.match(html, /alt="변신 능력자"/);
  assert.equal(html.includes('class="card-actions'), false);
  assert.equal(html.includes('data-card-detail='), false);
});

test('escapes card detail names before rendering', () => {
  const html = renderCardDetail({
    id: 'bad-card',
    name: '<script>',
    suit: '불명',
    base: 0,
    text: '<물>'
  });

  assert.equal(html.includes('<script>'), false);
  assert.match(html, /alt="&lt;script&gt;"/);
});
