import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('public/styles.css', 'utf8');
const html = readFileSync('public/index.html', 'utf8');
const app = readFileSync('public/app.js', 'utf8');

test('mobile game UI does not use sticky panels or headers', () => {
  assert.doesNotMatch(css, /position:\s*sticky/);
});

test('opponent panel renders every other player as hidden hand groups', () => {
  assert.match(html, /id="opponentHand"/);
  assert.match(app, /opponentHand:\s*document\.querySelector\('#opponentHand'\)/);
  assert.match(app, /function renderOpponentPlayers/);
  assert.match(app, /view\.players\.filter\(\(player\) => !player\.isYou\)/);
  assert.match(app, /opponent-player-card/);
  assert.match(app, /is-current-turn/);
  assert.match(app, /opponent-card-back/);
  assert.match(css, /\.opponent-hand/);
  assert.match(css, /\.opponent-player-card/);
  assert.match(css, /\.opponent-player-card\.is-current-turn/);
  assert.match(css, /\.opponent-card-back/);
  assert.match(css, /deck-back\.png/);
});

test('solo test controls can switch between six seats', () => {
  for (let playerNumber = 1; playerNumber <= 6; playerNumber += 1) {
    assert.match(html, new RegExp(`data-test-seat="p${playerNumber}"`));
  }
  assert.match(app, /seatButtons:\s*\[\.\.\.document\.querySelectorAll\('\[data-test-seat\]'\)\]/);
  assert.match(app, /playerCount:\s*6/);
  assert.match(app, /switchTestSeat\(button\.dataset\.testSeat\)/);
});

test('selected card actions render as one shared button pair', () => {
  assert.match(html, /id="selectedCardActions"/);
  assert.match(html, /id="selectedCardAction"/);
  assert.match(html, /id="selectedCardDetail"/);
  assert.match(app, /selectedCardId/);
  assert.match(app, /function selectCard/);
  assert.match(app, /function renderSelectedCardActions/);
  assert.match(app, /selectedCardAction/);
  assert.match(app, /data-card-select/);
  assert.match(css, /\.card-slot\.is-selected/);
  assert.match(css, /\.selected-card-actions/);
  assert.match(css, /\.selected-card-actions \.card-control:disabled/);
  assert.doesNotMatch(css, /\.card-slot:not\(\.is-selected\) \.card-controls/);
});

test('selected card action buttons use readable image-backed disabled styling', () => {
  const buttonCss = css.match(/\.selected-card-actions \.card-control\s*\{([\s\S]*?)\n\}/)?.[1] || '';
  const disabledCss = css.match(/\.selected-card-actions \.card-control:disabled\s*\{([\s\S]*?)\n\}/)?.[1] || '';

  assert.match(buttonCss, /background-image:\s*url\("\/assets\/ui\/button-primary\.svg"\)/);
  assert.match(buttonCss, /background-size:\s*100%\s*100%/);
  assert.match(disabledCss, /background-image:\s*url\("\/assets\/ui\/button-disabled\.svg"\)/);
  assert.match(disabledCss, /opacity:\s*1/);
  assert.match(disabledCss, /color:\s*#fff6e6/i);
  assert.doesNotMatch(disabledCss, /filter:\s*grayscale/);
});

test('mobile turn panel keeps the draw deck control compact', () => {
  const portraitMobile = css.match(/@media \(max-width: 700px\) and \(orientation: portrait\) \{([\s\S]*)\n\}/)?.[1] || '';
  const landscapeMobile = css.match(/@media \(orientation: landscape\) and \(max-height: 520px\) \{([\s\S]*?)\n\}/)?.[1] || '';

  assert.match(portraitMobile, /\.turn-panel\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto/);
  assert.match(portraitMobile, /#drawDeck\s*\{[\s\S]*?width:\s*min\(24vw,\s*96px\)/);
  assert.match(portraitMobile, /#drawDeck\s*\{[\s\S]*?min-width:\s*76px/);
  assert.match(portraitMobile, /#drawDeck\s*\{[\s\S]*?font-size:\s*12px/);

  assert.match(landscapeMobile, /#drawDeck\s*\{[\s\S]*?width:\s*min\(100%,\s*94px\)/);
});
