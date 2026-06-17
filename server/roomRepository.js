const DEFAULT_PREFIX = 'fantasy-world';
const DEFAULT_ROOM_TTL_SECONDS = 60 * 60 * 24;

export function createMemoryRoomRepository() {
  const rooms = new Map();
  return {
    mode: 'memory',
    async hasRoom(code) {
      return rooms.has(normalizeCode(code));
    },
    async getRoom(code) {
      const room = rooms.get(normalizeCode(code));
      return room ? cloneJson(room) : null;
    },
    async saveRoom(room) {
      rooms.set(normalizeCode(room.code), cloneJson(room));
    },
    async deleteRoom(code) {
      rooms.delete(normalizeCode(code));
    }
  };
}

export function createRedisRoomRepository(options = {}) {
  const url = String(options.url || '').trim();
  const token = String(options.token || '').trim();
  const prefix = String(options.prefix || DEFAULT_PREFIX).trim();
  const ttlSeconds = Number(options.ttlSeconds || DEFAULT_ROOM_TTL_SECONDS);
  const fetchImpl = options.fetchImpl || globalThis.fetch;

  if (!url || !token) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required.');
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('A fetch implementation is required for Redis room storage.');
  }

  return {
    mode: 'redis',
    async hasRoom(code) {
      const result = await command(['EXISTS', roomKey(prefix, code)]);
      return Number(result) > 0;
    },
    async getRoom(code) {
      const result = await command(['GET', roomKey(prefix, code)]);
      return result ? JSON.parse(result) : null;
    },
    async saveRoom(room) {
      await command([
        'SET',
        roomKey(prefix, room.code),
        JSON.stringify(room),
        'EX',
        String(ttlSeconds)
      ]);
    },
    async deleteRoom(code) {
      await command(['DEL', roomKey(prefix, code)]);
    }
  };

  async function command(redisCommand) {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(redisCommand)
    });
    if (!response.ok) {
      const body = await safeResponseText(response);
      throw new Error(`Redis request failed: ${response.status} ${response.statusText} ${body}`.trim());
    }
    const payload = await response.json();
    if (payload?.error) {
      throw new Error(`Redis command failed: ${payload.error}`);
    }
    return payload?.result;
  }
}

export function createRoomRepositoryFromEnv(env = process.env) {
  const url = String(env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = String(env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  if (!url && !token) {
    return null;
  }
  if (!url || !token) {
    throw new Error('Both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set to use Redis room storage.');
  }
  return createRedisRoomRepository({
    url,
    token,
    ttlSeconds: Number(env.ROOM_TTL_SECONDS || DEFAULT_ROOM_TTL_SECONDS)
  });
}

function roomKey(prefix, code) {
  return `${prefix}:room:${normalizeCode(code)}`;
}

function normalizeCode(code) {
  return String(code || '').toUpperCase();
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

async function safeResponseText(response) {
  try {
    return await response.text();
  } catch {
    return '';
  }
}
