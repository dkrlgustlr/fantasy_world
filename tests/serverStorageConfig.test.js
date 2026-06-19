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

test('server sends action responses before broadcasting room updates', () => {
  const postActionBlock = server.match(/if \(req\.method === 'POST'\) \{([\s\S]*?)\n      \}/)?.[1] || '';

  assert.match(postActionBlock, /const result = await runRoomAction/);
  assert.match(postActionBlock, /broadcast\(code\)/);
  assert.match(postActionBlock, /sendJson\(res, 200, result\)/);
  assert.doesNotMatch(postActionBlock, /await broadcast\(code\)/);
  assert.ok(
    postActionBlock.indexOf('sendJson(res, 200, result)') < postActionBlock.indexOf('broadcast(code)'),
    'HTTP action response should not wait for SSE broadcasts to every connected player'
  );
});

test('server broadcasts room updates to connected players in parallel', () => {
  const broadcastFunction = server.match(/async function broadcast\(code\) \{([\s\S]*?)\n\}/)?.[1] || '';

  assert.match(broadcastFunction, /Promise\.all/);
  assert.doesNotMatch(broadcastFunction, /for \(const client of clients\)/);
});
