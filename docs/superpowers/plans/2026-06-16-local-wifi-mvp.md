# Local Wi-Fi MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local 2-player iPhone-friendly web MVP for Fantasy Realms-style play with private hands, room codes, draw/discard turn order, and manual score entry.

**Architecture:** A Node.js local HTTP server owns all game state in memory and serves a static mobile web UI. The MVP uses HTTP actions plus Server-Sent Events for state updates, which avoids external packages and works in iPhone Safari on the same Wi-Fi. Game rules live in a pure `server/gameEngine.js` module covered by tests.

**Tech Stack:** Node.js built-ins (`http`, `node:test`, `assert`), vanilla HTML/CSS/JavaScript, JSON card data.

---

## File Structure

- `package.json`: npm scripts for starting and testing.
- `server/gameEngine.js`: pure room/game state logic.
- `server/server.js`: local HTTP API, SSE event stream, static file serving.
- `data/cards.json`: text-only 53-card base deck.
- `public/index.html`: single-page mobile UI shell.
- `public/styles.css`: iPhone-friendly layout and card styling.
- `public/app.js`: client-side room, turn, hand, discard, and score UI.
- `tests/gameEngine.test.js`: unit tests for room creation, joining, draw/discard order, hidden hands, and game end.

## Task 1: Project Skeleton

**Files:**
- Create: `package.json`
- Create: `server/gameEngine.js`
- Create: `tests/gameEngine.test.js`

- [ ] **Step 1: Write failing import test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameStore } from '../server/gameEngine.js';

test('creates a game store object', () => {
  const store = createGameStore();
  assert.equal(typeof store.createRoom, 'function');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because `package.json` or `server/gameEngine.js` does not exist.

- [ ] **Step 3: Add minimal project files**

Create `package.json` with module support and test/start scripts. Create `server/gameEngine.js` exporting `createGameStore()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

## Task 2: Card Data

**Files:**
- Create: `data/cards.json`
- Modify: `server/gameEngine.js`
- Modify: `tests/gameEngine.test.js`

- [ ] **Step 1: Write failing deck test**

Add a test that creates a room and confirms a 53-card deck exists before dealing.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because card data is not loaded.

- [ ] **Step 3: Add `data/cards.json`**

Register the base 53 cards as text cards with `id`, `name`, `suit`, `base`, and `text`. Use the confirmed 8-card text where available and concise summary text for the others.

- [ ] **Step 4: Load cards in the game engine**

Accept a card list in `createGameStore(cards)` and create shuffled room decks from it.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

## Task 3: Room and Player State

**Files:**
- Modify: `server/gameEngine.js`
- Modify: `tests/gameEngine.test.js`

- [ ] **Step 1: Write failing room tests**

Test that room codes are generated, two players can join, a third player is rejected, and each player gets a token.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because room/player logic is incomplete.

- [ ] **Step 3: Implement room/player logic**

Add `createRoom(playerName)`, `joinRoom(code, playerName)`, and `getView(code, playerToken)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

## Task 4: Start Game, Private Hands, Turn Order

**Files:**
- Modify: `server/gameEngine.js`
- Modify: `tests/gameEngine.test.js`

- [ ] **Step 1: Write failing start/view tests**

Test that starting a 2-player room deals 7 cards each, sets a current player, and hides the opponent hand contents.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because start/view logic is incomplete.

- [ ] **Step 3: Implement start and filtered views**

Add `startGame(code, playerToken)` and filter views so only the requesting player sees their hand details.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

## Task 5: Draw and Discard Rules

**Files:**
- Modify: `server/gameEngine.js`
- Modify: `tests/gameEngine.test.js`

- [ ] **Step 1: Write failing action tests**

Test that a player must draw before discarding, cannot draw twice, can draw from deck or discard pile, and turn passes after discard.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because action rules are incomplete.

- [ ] **Step 3: Implement draw/discard actions**

Add `drawFromDeck`, `drawFromDiscard`, and `discardCard` with strict turn and hand-size validation.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

## Task 6: Game End and Manual Score

**Files:**
- Modify: `server/gameEngine.js`
- Modify: `tests/gameEngine.test.js`

- [ ] **Step 1: Write failing end/score tests**

Test that the game ends when the discard pile reaches 10 cards and that manual score entries produce totals and a winner.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL because scoring is incomplete.

- [ ] **Step 3: Implement end and score entry**

Add ended state when discard reaches 10 and `submitScore(code, playerToken, rows)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

## Task 7: Local Server API

**Files:**
- Create: `server/server.js`
- Modify: `package.json`

- [ ] **Step 1: Write minimal HTTP smoke test manually**

Start server with `npm start` and verify `/api/health` returns JSON.

- [ ] **Step 2: Implement server routes**

Add static serving, JSON body parsing, action endpoints, and SSE `/api/rooms/:code/events`.

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: PASS.

## Task 8: Mobile Web UI

**Files:**
- Create: `public/index.html`
- Create: `public/styles.css`
- Create: `public/app.js`

- [ ] **Step 1: Build UI shell**

Create room/join, lobby, game, and score sections in one page.

- [ ] **Step 2: Wire API actions**

Connect create, join, start, draw, discard, and score submit buttons.

- [ ] **Step 3: Render live state**

Use EventSource to refresh the page state whenever the server broadcasts a room update.

- [ ] **Step 4: Run local verification**

Run: `npm start`, open `http://localhost:3000`, and verify one browser can create a room and another can join.

## Self-Review

- Spec coverage: The plan covers local server, two-player rooms, private hands, draw/discard order, 53 text cards, and manual score entry.
- Placeholder scan: No TODO/TBD placeholders remain.
- Type consistency: The planned engine API is consistently `createRoom`, `joinRoom`, `startGame`, `getView`, `drawFromDeck`, `drawFromDiscard`, `discardCard`, and `submitScore`.
