import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMemoryRoomRepository,
  createRedisRoomRepository,
  createRoomRepositoryFromEnv
} from '../server/roomRepository.js';

test('memory room repository stores cloned room data', async () => {
  const repository = createMemoryRoomRepository();
  const room = {
    code: 'ABC123',
    players: [{ id: 'p1', name: 'Host', token: 'secret' }],
    deck: [],
    discardPile: [],
    phase: 'waiting',
    currentPlayerId: null,
    drawnThisTurn: false,
    scores: {}
  };

  await repository.saveRoom(room);
  room.players[0].name = 'Changed';

  const restored = await repository.getRoom('abc123');
  assert.equal(restored.players[0].name, 'Host');

  restored.players[0].name = 'Mutated';
  const restoredAgain = await repository.getRoom('ABC123');
  assert.equal(restoredAgain.players[0].name, 'Host');
});

test('redis room repository stores room JSON with TTL and auth header', async () => {
  const calls = [];
  const repository = createRedisRoomRepository({
    url: 'https://example-upstash.upstash.io',
    token: 'test-token',
    ttlSeconds: 42,
    fetchImpl: async (url, options) => {
      calls.push({ url, options, command: JSON.parse(options.body) });
      return jsonResponse({ result: options.body.includes('"GET"') ? null : 'OK' });
    }
  });

  await repository.saveRoom({ code: 'abc123', phase: 'waiting' });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://example-upstash.upstash.io');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-token');
  assert.deepEqual(calls[0].command.slice(0, 3), ['SET', 'fantasy-world:room:ABC123', '{"code":"abc123","phase":"waiting"}']);
  assert.deepEqual(calls[0].command.slice(3), ['EX', '42']);
});

test('redis room repository reads and parses stored room JSON', async () => {
  const repository = createRedisRoomRepository({
    url: 'https://example-upstash.upstash.io',
    token: 'test-token',
    fetchImpl: async (url, options) => {
      const command = JSON.parse(options.body);
      assert.deepEqual(command, ['GET', 'fantasy-world:room:ABC123']);
      return jsonResponse({ result: '{"code":"ABC123","phase":"playing"}' });
    }
  });

  const room = await repository.getRoom('abc123');

  assert.deepEqual(room, { code: 'ABC123', phase: 'playing' });
});

test('repository factory selects redis only when both Upstash env vars exist', () => {
  assert.equal(createRoomRepositoryFromEnv({}), null);
  assert.throws(
    () => createRoomRepositoryFromEnv({ UPSTASH_REDIS_REST_URL: 'https://redis.example' }),
    /UPSTASH_REDIS_REST_URL.*UPSTASH_REDIS_REST_TOKEN/
  );
  assert.equal(
    createRoomRepositoryFromEnv({
      UPSTASH_REDIS_REST_URL: 'https://redis.example',
      UPSTASH_REDIS_REST_TOKEN: 'token'
    }).mode,
    'redis'
  );
});

function jsonResponse(payload, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Error',
    async json() {
      return payload;
    },
    async text() {
      return JSON.stringify(payload);
    }
  };
}
