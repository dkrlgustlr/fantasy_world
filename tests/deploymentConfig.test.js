import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('deployment env example documents Upstash Redis settings', () => {
  const env = readFileSync('.env.example', 'utf8');

  assert.match(env, /UPSTASH_REDIS_REST_URL=/);
  assert.match(env, /UPSTASH_REDIS_REST_TOKEN=/);
  assert.match(env, /ROOM_TTL_SECONDS=86400/);
});

test('render config runs the node web service and health check', () => {
  const render = readFileSync('render.yaml', 'utf8');

  assert.match(render, /type: web/);
  assert.match(render, /runtime: node/);
  assert.match(render, /buildCommand: npm install/);
  assert.match(render, /startCommand: npm start/);
  assert.match(render, /healthCheckPath: \/api\/health/);
});

test('readme explains remote deployment with Render and Upstash', () => {
  const readme = readFileSync('README.md', 'utf8');

  assert.match(readme, /Render/);
  assert.match(readme, /Upstash/);
  assert.match(readme, /UPSTASH_REDIS_REST_URL/);
  assert.match(readme, /UPSTASH_REDIS_REST_TOKEN/);
});
