import test from 'node:test';
import assert from 'node:assert/strict';
import cards from '../data/cards.json' with { type: 'json' };
import { createPersistentGameStore } from '../server/gameEngine.js';
import { createMemoryRoomRepository } from '../server/roomRepository.js';

test('persistent game store restores rooms from a shared repository', async () => {
  const repository = createMemoryRoomRepository();
  const firstStore = createPersistentGameStore(cards, { repository, shuffle: false });
  const created = await firstStore.createRoom('Remote Host');
  await firstStore.joinRoom(created.code, 'Remote Guest');
  await firstStore.startGame(created.code, created.playerToken);
  await firstStore.finishCoinToss(created.code, created.playerToken);

  const secondStore = createPersistentGameStore(cards, { repository, shuffle: false });
  const restored = await secondStore.getView(created.code, created.playerToken);

  assert.equal(restored.code, created.code);
  assert.equal(restored.phase, 'playing');
  assert.equal(restored.you.name, 'Remote Host');
  assert.equal(restored.you.hand.length, 7);
  assert.equal(restored.players.find((player) => !player.isYou).handCount, 7);
  assert.equal(restored.deckCount, 39);
});

test('persistent game store keeps restart state in the shared repository', async () => {
  const repository = createMemoryRoomRepository();
  const firstStore = createPersistentGameStore(cards, { repository, shuffle: false, random: () => 0 });
  const host = await firstStore.createRoom('Persistent Host');
  const guest = await firstStore.joinRoom(host.code, 'Persistent Guest');
  await firstStore.startGame(host.code, host.playerToken);
  await firstStore.finishCoinToss(host.code, host.playerToken);

  for (let turn = 0; turn < 10; turn += 1) {
    const token = turn % 2 === 0 ? host.playerToken : guest.playerToken;
    const viewAfterDraw = await firstStore.drawFromDeck(host.code, token);
    await firstStore.discardCard(host.code, token, viewAfterDraw.you.hand[0].id);
  }

  const restarted = await firstStore.restartGame(host.code, host.playerToken);
  assert.equal(restarted.phase, 'flipping');
  await firstStore.finishCoinToss(host.code, host.playerToken);

  const secondStore = createPersistentGameStore(cards, { repository, shuffle: false });
  const restored = await secondStore.getView(host.code, host.playerToken);

  assert.equal(restored.phase, 'playing');
  assert.equal(restored.discardPile.length, 0);
  assert.equal(restored.deckCount, 39);
  assert.equal(restored.you.hand.length, 7);
});
