import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import cards from '../data/cards.json' with { type: 'json' };
import { createGameStore, createPersistentGameStore } from './gameEngine.js';
import { createRoomRepositoryFromEnv } from './roomRepository.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const port = Number(process.env.PORT || 3000);
const roomRepository = createRoomRepositoryFromEnv(process.env);
const store = roomRepository ? createPersistentGameStore(cards, { repository: roomRepository }) : createGameStore(cards);
const streams = new Map();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/api/health') {
      return sendJson(res, 200, { ok: true });
    }
    if (url.pathname === '/api/rooms' && req.method === 'POST') {
      const body = await readJson(req);
      const result = await store.createRoom(body.name);
      return sendJson(res, 201, result);
    }
    if (url.pathname === '/api/test/solo-room' && req.method === 'POST') {
      const body = await readJson(req);
      const result = await store.createSoloTestRoom(body.name);
      return sendJson(res, 201, result);
    }
    const roomMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)(?:\/([^/]+))?$/);
    if (roomMatch) {
      const code = roomMatch[1].toUpperCase();
      const action = roomMatch[2] || '';
      if (req.method === 'GET' && action === '') {
        return sendJson(res, 200, await store.getView(code, url.searchParams.get('token')));
      }
      if (req.method === 'GET' && action === 'events') {
        return openStream(req, res, code, url.searchParams.get('token'));
      }
      if (req.method === 'POST') {
        const body = await readJson(req);
        const token = body.playerToken;
        const result = await runRoomAction(code, action, token, body);
        await broadcast(code);
        return sendJson(res, 200, result);
      }
    }
    return serveStatic(url.pathname, res);
  } catch (error) {
    return sendJson(res, 400, { error: error.message || '요청 처리 중 오류가 발생했습니다.' });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Fantasy World MVP running on http://localhost:${port}`);
  console.log(`Room storage: ${roomRepository?.mode || 'memory'}`);
  for (const address of getLocalAddresses()) {
    console.log(`Same Wi-Fi URL: http://${address}:${port}`);
  }
});

async function runRoomAction(code, action, token, body) {
  switch (action) {
    case 'join':
      return store.joinRoom(code, body.name);
    case 'start':
      return store.startGame(code, token);
    case 'restart':
      return store.restartGame(code, token);
    case 'draw-deck':
      return store.drawFromDeck(code, token);
    case 'draw-discard':
      return store.drawFromDiscard(code, token, body.cardId);
    case 'discard':
      return store.discardCard(code, token, body.cardId);
    case 'score':
      return store.submitScore(code, token, body.rows);
    default:
      throw new Error('알 수 없는 액션입니다.');
  }
}

async function openStream(req, res, code, token) {
  const initialView = await store.getView(code, token);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  const client = { res, token };
  if (!streams.has(code)) {
    streams.set(code, new Set());
  }
  streams.get(code).add(client);
  sendEvent(res, initialView);
  req.on('close', () => {
    streams.get(code)?.delete(client);
  });
}

async function broadcast(code) {
  const clients = streams.get(code);
  if (!clients) return;
  for (const client of clients) {
    try {
      sendEvent(client.res, await store.getView(code, client.token));
    } catch {
      clients.delete(client);
    }
  }
}

function sendEvent(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

async function serveStatic(urlPath, res) {
  const cleanPath = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.normalize(path.join(publicDir, cleanPath));
  if (!filePath.startsWith(publicDir)) {
    return sendJson(res, 403, { error: 'Forbidden' });
  }
  try {
    const body = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    res.end(body);
  } catch {
    sendJson(res, 404, { error: 'Not found' });
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.svg')) return 'image/svg+xml; charset=utf-8';
  return 'application/octet-stream';
}

function getLocalAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((network) => network && network.family === 'IPv4' && !network.internal)
    .map((network) => network.address);
}
