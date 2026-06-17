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
  assert.equal(existsSync('public/assets/ui/coin-first-player.png'), true);
  assert.match(css, /\.coin-stage/);
  assert.match(css, /coin-first-player\.png/);
  assert.match(css, /@keyframes coinFlip/);
  assert.match(css, /\.coin-image\.is-spinning/);
});
