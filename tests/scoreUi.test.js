import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync('public/app.js', 'utf8');
const html = readFileSync('public/index.html', 'utf8');
const css = readFileSync('public/styles.css', 'utf8');

test('score screen stays manual instead of using automatic score defaults', () => {
  assert.doesNotMatch(app, /autoScore/);
  assert.doesNotMatch(app, /autoRowsById/);
  assert.doesNotMatch(app, /자동 계산/);
  assert.match(app, /value="\$\{baseValue\}"/);
  assert.match(app, /scoreRow\.defaultBase/);
  assert.match(app, /const bonusValue = draft\?\.bonus \?\? 0/);
  assert.match(app, /class="bonus" value="\$\{bonusValue\}"/);
});

test('score screen has a special-card choice helper area', () => {
  assert.match(html, /id="specialChoices"/);
  assert.match(app, /specialChoicesForHand/);
  assert.match(app, /renderSpecialChoices/);
});

test('score screen can transform special cards into selected score rows', () => {
  assert.match(app, /buildScoreRows/);
  assert.match(app, /scoreTransforms/);
  assert.match(app, /data-special-target/);
  assert.match(app, /data-clear-special/);
  assert.match(app, /data-book-suit/);
  assert.match(app, /renderScoreTransformNote/);
  assert.match(app, /scoreRow\.displayCard/);
  assert.match(css, /\.special-targets/);
  assert.match(css, /\.score-transform-note/);
});

test('score screen can reveal discarded cards for end-game choices', () => {
  assert.match(html, /id="viewDiscardedCards"/);
  assert.match(html, /id="scoreDiscardCards"/);
  assert.match(html, />버린 카드 보기<\/button>/);
  assert.match(app, /scoreDiscardCards: document\.querySelector\('#scoreDiscardCards'\)/);
  assert.match(app, /viewDiscardedCards: document\.querySelector\('#viewDiscardedCards'\)/);
  assert.match(app, /renderScoreDiscardCards/);
  assert.match(app, /data-score-discard-detail/);
  assert.match(app, /score-discard-card-image/);
  assert.match(app, /openCardDetail\(discardButton\.dataset\.scoreDiscardDetail\)/);
});

test('score screen shows every player score status in multiplayer rooms', () => {
  assert.match(app, /function renderScoreSummary/);
  assert.match(app, /view\.players\.map/);
  assert.match(app, /score-summary-row/);
  assert.match(app, /계산 중/);
  assert.match(app, /제출 완료/);
  assert.match(app, /view\.winner/);
  assert.match(css, /\.score-summary-row/);
  assert.match(css, /\.score-summary-row\.is-submitted/);
});

test('score screen shows final hand card images and can restart the same room', () => {
  assert.match(html, /id="restartGame"/);
  assert.match(app, /restartGame: document\.querySelector\('#restartGame'\)/);
  assert.match(app, /postAction\('restart'\)/);
  assert.match(app, /scoreCardImageSrc/);
  assert.match(app, /class="score-card-image"/);
  assert.match(app, /\/assets\/cards\/full\/\$\{imageId\}\.png/);
});

test('game screen has a dedicated action bar for leaving the room only', () => {
  assert.match(html, /id="roomActions"/);
  assert.doesNotMatch(html, /id="endGame"/);
  assert.doesNotMatch(html, />종료<\/button>/);
  assert.match(html, /id="leaveRoom"/);
  assert.match(html, />방 나가기<\/button>/);
  assert.match(app, /roomActions: document\.querySelector\('#roomActions'\)/);
  assert.doesNotMatch(app, /endGame/);
  assert.doesNotMatch(app, /postAction\('end'\)/);
  assert.match(app, /leaveRoom: document\.querySelector\('#leaveRoom'\)/);
  assert.match(app, /els\.leaveRoom\.addEventListener\('click', leaveRoom\)/);
});

test('score screen card previews open the detail overlay', () => {
  assert.match(app, /els\.scoreRows\.addEventListener\('click'/);
  assert.match(app, /data-score-card-detail/);
  assert.match(app, /class="score-card-preview"/);
  assert.match(app, /openCardDetail\(detailButton\.dataset\.scoreCardDetail\)/);
});
