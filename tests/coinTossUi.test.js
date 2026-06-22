import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const html = readFileSync('public/index.html', 'utf8');
const app = readFileSync('public/app.js', 'utf8');
const css = readFileSync('public/styles.css', 'utf8');

test('coin toss screen exists between lobby and gameplay', () => {
  assert.match(html, /id="coinToss"/);
  assert.match(html, /id="coinImage"/);
  assert.match(html, /id="coinResult"/);
  assert.match(html, /id="coinPlayers"/);
  assert.match(app, /coinToss:\s*document\.querySelector\('#coinToss'\)/);
  assert.match(app, /function renderCoinToss/);
  assert.match(app, /postAction\('finish-coin'\)/);
});

test('coin toss uses a rotating fantasy coin image asset', () => {
  assert.equal(existsSync('public/assets/ui/coin-front.png'), true);
  assert.equal(existsSync('public/assets/ui/coin-back.png'), true);
  assert.match(css, /\.coin-stage/);
  assert.match(html, /coin-front\.png/);
  assert.match(html, /coin-back\.png/);
  assert.match(css, /@keyframes coinFlip/);
  assert.match(css, /\.coin-image\.is-spinning/);
});

test('coin toss reveal clearly marks the first player and final coin side', () => {
  assert.match(app, /els\.coinImage\.dataset\.coinSide = 'spinning'/);
  assert.match(app, /els\.coinImage\.dataset\.coinSide = 'front'/);
  assert.match(app, /선공: \$\{winnerName\}/);
  assert.match(app, /const label = isWinner \? '선공' : revealed \? '후공' : player\.isYou \? '나' : '대기'/);
});
