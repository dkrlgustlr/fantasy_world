import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const server = readFileSync('server/server.js', 'utf8');

test('server selects persistent Redis-backed storage from environment variables', () => {
  assert.match(server, /createRoomRepositoryFromEnv/);
  assert.match(server, /createPersistentGameStore/);
  assert.match(server, /roomRepository \? createPersistentGameStore/);
});

test('server awaits store calls so redis-backed storage can be async', () => {
  assert.match(server, /await store\.createRoom/);
  assert.match(server, /await store\.getView/);
  assert.match(server, /await runRoomAction/);
  assert.match(server, /async function openStream/);
  assert.match(server, /async function broadcast/);
});
