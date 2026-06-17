import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('public/app.js', 'utf8');
const html = readFileSync('public/index.html', 'utf8');

test('score screen stays manual instead of using automatic score defaults', () => {
  assert.doesNotMatch(app, /autoScore/);
  assert.doesNotMatch(app, /autoRowsById/);
  assert.doesNotMatch(app, /자동 계산/);
  assert.match(app, /value="\$\{card\.base\}"/);
  assert.match(app, /class="bonus" value="0"/);
});

test('score screen has a special-card choice helper area', () => {
  assert.match(html, /id="specialChoices"/);
  assert.match(app, /specialChoicesForHand/);
  assert.match(app, /renderSpecialChoices/);
});

test('score screen shows final hand card images and can restart the same room', () => {
  assert.match(html, /id="restartGame"/);
  assert.match(app, /restartGame: document\.querySelector\('#restartGame'\)/);
  assert.match(app, /postAction\('restart'\)/);
  assert.match(app, /scoreCardImageSrc/);
  assert.match(app, /class="score-card-image"/);
  assert.match(app, /\/assets\/cards\/full\/\$\{imageId\}\.png/);
});

test('game screen has a real end button wired to manual scoring', () => {
  assert.match(html, /id="endGame"/);
  assert.match(html, />종료<\/button>/);
  assert.match(app, /endGame: document\.querySelector\('#endGame'\)/);
  assert.match(app, /els\.endGame\.addEventListener\('click', \(\) => postAction\('end'\)\)/);
});

test('score screen card previews open the detail overlay', () => {
  assert.match(app, /els\.scoreRows\.addEventListener\('click'/);
  assert.match(app, /data-score-card-detail/);
  assert.match(app, /class="score-card-preview"/);
  assert.match(app, /openCardDetail\(detailButton\.dataset\.scoreCardDetail\)/);
});
