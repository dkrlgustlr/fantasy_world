# Score Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first automatic score calculator for the 53-card Fantasy World MVP.

**Architecture:** Add a focused `server/scoreEngine.js` module that calculates one hand without touching room, turn, or network state. `server/gameEngine.js` will keep multiplayer flow and call the score engine only when scoring is needed. Selection-based cards remain explicit follow-up work and are surfaced as unresolved choices instead of silently guessing.

**Tech Stack:** Node.js ES modules, `node:test`, existing JSON card data.

---

### Task 1: Deterministic Score Engine

**Files:**
- Create: `server/scoreEngine.js`
- Test: `tests/scoreEngine.test.js`

- [ ] **Step 1: Write failing tests**

Cover base scoring, simple bonuses, conditional bonuses, penalties, blanking, and penalty removal with real card objects from `data/cards.json`.

- [ ] **Step 2: Verify tests fail**

Run: `node --test tests/scoreEngine.test.js`
Expected: FAIL because `server/scoreEngine.js` does not exist.

- [ ] **Step 3: Implement the score engine**

Export `calculateHandScore(hand, options = {})`. Return `total`, `cards`, `unresolvedChoices`, and per-card notes. Keep the implementation deterministic and side-effect free.

- [ ] **Step 4: Verify tests pass**

Run: `node --test tests/scoreEngine.test.js`
Expected: PASS.

### Task 2: Existing Game Compatibility

**Files:**
- Modify: `server/gameEngine.js`
- Test: `tests/gameEngine.test.js`

- [ ] **Step 1: Add a compatibility test**

Ended-game views should include an automatic score preview while preserving the existing manual score submission path.

- [ ] **Step 2: Verify test fails**

Run: `node --test tests/gameEngine.test.js`
Expected: FAIL because automatic score preview is not yet attached.

- [ ] **Step 3: Attach score preview**

Import `calculateHandScore` and add `autoScore` to `playerView` when a player has a hand.

- [ ] **Step 4: Verify test passes**

Run: `node --test tests/gameEngine.test.js`
Expected: PASS.

### Task 3: Full Verification

**Files:**
- No additional files.

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 2: Syntax check touched browser/server modules**

Run: `node --check server/scoreEngine.js`
Expected: no output.

Run: `node --check server/gameEngine.js`
Expected: no output.
