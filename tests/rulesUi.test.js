import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const app = readFileSync('public/app.js', 'utf8');
const html = readFileSync('public/index.html', 'utf8');
const css = readFileSync('public/styles.css', 'utf8');

test('game exposes an image-based how-to-play manual', () => {
  assert.match(html, /id="openRules"/);
  assert.match(html, />게임 방법<\/button>/);
  assert.match(html, /id="rulesOverlay"/);
  assert.match(html, /src="\/assets\/ui\/how-to-play\.svg"/);
  assert.match(app, /openRules: document\.querySelector\('#openRules'\)/);
  assert.match(app, /rulesOverlay: document\.querySelector\('#rulesOverlay'\)/);
  assert.match(app, /els\.openRules\.addEventListener\('click', openRulesOverlay\)/);
  assert.match(app, /function openRulesOverlay/);
  assert.match(app, /function closeRulesOverlay/);
  assert.match(css, /\.rules-overlay/);
  assert.match(css, /\.rules-manual-image/);
  assert.equal(existsSync('public/assets/ui/how-to-play.svg'), true);
});
