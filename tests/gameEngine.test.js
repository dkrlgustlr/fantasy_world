import test from 'node:test';
import assert from 'node:assert/strict';
import cards from '../data/cards.json' with { type: 'json' };
import { createGameStore } from '../server/gameEngine.js';

test('creates a game store object', () => {
  const store = createGameStore();
  assert.equal(typeof store.createRoom, 'function');
});

test('creates a room with the 53-card base deck', () => {
  const store = createGameStore(cards, { shuffle: false, random: () => 0 });
  const room = store.createRoom('첫 플레이어');

  assert.equal(cards.length, 53);
  assert.equal(room.deckCount, 53);
  assert.equal(room.players[0].name, '첫 플레이어');
});

test('allows exactly two players to join a room', () => {
  const store = createGameStore(cards, { shuffle: false, random: () => 0 });
  const created = store.createRoom('호스트');
  const joined = store.joinRoom(created.code, '게스트');

  assert.equal(created.playerToken.length > 8, true);
  assert.equal(joined.playerToken.length > 8, true);
  assert.notEqual(created.playerToken, joined.playerToken);
  assert.equal(joined.players.length, 2);
  assert.throws(() => store.joinRoom(created.code, '세 번째'), /방이 가득 찼습니다/);
});

test('returns a player-scoped room view', () => {
  const store = createGameStore(cards, { shuffle: false, random: () => 0 });
  const host = store.createRoom('호스트');
  store.joinRoom(host.code, '게스트');

  const view = store.getView(host.code, host.playerToken);
  assert.equal(view.code, host.code);
  assert.equal(view.you.name, '호스트');
  assert.equal(view.players.length, 2);
});

test('starts a two-player game by flipping a coin for the first turn', () => {
  const store = createGameStore(cards, { shuffle: false, random: () => 0.75 });
  const host = store.createRoom('호스트');
  const guest = store.joinRoom(host.code, '게스트');

  const started = store.startGame(host.code, host.playerToken);
  const hostView = store.getView(host.code, host.playerToken);
  const guestView = store.getView(host.code, guest.playerToken);

  assert.equal(started.phase, 'flipping');
  assert.equal(started.you.id, 'p1');
  assert.equal(started.discardPile.length, 0);
  assert.equal(hostView.you.hand.length, 7);
  assert.equal(guestView.you.hand.length, 7);
  assert.equal(hostView.players.find((player) => !player.isYou).handCount, 7);
  assert.equal(hostView.players.find((player) => !player.isYou).hand, undefined);
  assert.equal(hostView.deckCount, 39);
  assert.equal(hostView.currentPlayerId, null);
  assert.equal(hostView.coinToss.winnerPlayerId, 'p2');
  assert.throws(() => store.drawFromDeck(host.code, guest.playerToken));

  const afterCoin = store.finishCoinToss(host.code, host.playerToken);
  assert.equal(afterCoin.phase, 'playing');
  assert.equal(afterCoin.currentPlayerId, 'p2');
});

test('creates a started solo test room with both player tokens', () => {
  const store = createGameStore(cards, { shuffle: false, random: () => 0 });
  const solo = store.createSoloTestRoom('테스터');

  assert.equal(solo.phase, 'playing');
  assert.equal(solo.players.length, 2);
  assert.equal(solo.players[0].name, '테스터');
  assert.equal(solo.players[1].name, '테스터 2P');
  assert.equal(solo.playerTokens.p1.length > 8, true);
  assert.equal(solo.playerTokens.p2.length > 8, true);
  assert.notEqual(solo.playerTokens.p1, solo.playerTokens.p2);

  const playerOneView = store.getView(solo.code, solo.playerTokens.p1);
  const playerTwoView = store.getView(solo.code, solo.playerTokens.p2);

  assert.equal(playerOneView.you.id, 'p1');
  assert.equal(playerTwoView.you.id, 'p2');
  assert.equal(playerOneView.you.hand.length, 7);
  assert.equal(playerTwoView.you.hand.length, 7);
  assert.equal(playerOneView.players.find((player) => !player.isYou).hand, undefined);
  assert.equal(playerTwoView.players.find((player) => !player.isYou).hand, undefined);
  assert.equal(playerOneView.deckCount, 39);
  assert.equal(playerOneView.currentPlayerId, 'p1');
});

test('enforces draw then discard turn order', () => {
  const store = createGameStore(cards, { shuffle: false, random: () => 0 });
  const host = store.createRoom('호스트');
  const guest = store.joinRoom(host.code, '게스트');
  store.startGame(host.code, host.playerToken);
  store.finishCoinToss(host.code, host.playerToken);

  assert.throws(
    () => store.discardCard(host.code, host.playerToken, 'mountain'),
    /카드를 먼저 가져와야 합니다/
  );
  assert.throws(
    () => store.drawFromDeck(host.code, guest.playerToken),
    /현재 턴이 아닙니다/
  );

  const afterDraw = store.drawFromDeck(host.code, host.playerToken);
  assert.equal(afterDraw.you.hand.length, 8);
  assert.equal(afterDraw.deckCount, 38);
  assert.throws(
    () => store.drawFromDeck(host.code, host.playerToken),
    /이미 카드를 가져왔습니다/
  );

  const afterDiscard = store.discardCard(host.code, host.playerToken, 'mountain');
  assert.equal(afterDiscard.you.hand.length, 7);
  assert.equal(afterDiscard.discardPile.at(-1).id, 'mountain');
  assert.equal(afterDiscard.currentPlayerId, 'p2');
  assert.equal(afterDiscard.drawnThisTurn, false);
});

test('can draw a visible discard card', () => {
  const store = createGameStore(cards, { shuffle: false, random: () => 0 });
  const host = store.createRoom('호스트');
  const guest = store.joinRoom(host.code, '게스트');
  store.startGame(host.code, host.playerToken);
  store.finishCoinToss(host.code, host.playerToken);
  store.drawFromDeck(host.code, host.playerToken);
  store.discardCard(host.code, host.playerToken, 'mountain');

  const guestDraw = store.drawFromDiscard(host.code, guest.playerToken, 'mountain');
  assert.equal(guestDraw.you.hand.some((card) => card.id === 'mountain'), true);
  assert.equal(guestDraw.discardPile.length, 0);
});

test('leaving an active room resets the remaining player to the lobby', () => {
  const store = createGameStore(cards, { shuffle: false, random: () => 0 });
  const host = store.createRoom('Leave Host');
  const guest = store.joinRoom(host.code, 'Leave Guest');
  store.startGame(host.code, host.playerToken);
  store.finishCoinToss(host.code, host.playerToken);

  const result = store.leaveRoom(host.code, guest.playerToken);
  const hostView = store.getView(host.code, host.playerToken);
  const newGuest = store.joinRoom(host.code, 'New Guest');

  assert.deepEqual(result, { left: true, code: host.code, deleted: false });
  assert.equal(hostView.phase, 'waiting');
  assert.equal(hostView.players.length, 1);
  assert.equal(hostView.players[0].id, 'p1');
  assert.equal(hostView.you.hand.length, 0);
  assert.equal(hostView.deckCount, 53);
  assert.equal(newGuest.players.length, 2);
  assert.equal(newGuest.players[1].id, 'p2');
});

test('ends at ten discarded cards and totals manual scores', () => {
  const store = createGameStore(cards, { shuffle: false, random: () => 0 });
  const host = store.createRoom('호스트');
  const guest = store.joinRoom(host.code, '게스트');
  store.startGame(host.code, host.playerToken);
  store.finishCoinToss(host.code, host.playerToken);

  for (let turn = 0; turn < 10; turn += 1) {
    const token = turn % 2 === 0 ? host.playerToken : guest.playerToken;
    const viewAfterDraw = store.drawFromDeck(host.code, token);
    store.discardCard(host.code, token, viewAfterDraw.you.hand[0].id);
  }

  const endedView = store.getView(host.code, host.playerToken);
  assert.equal(endedView.phase, 'ended');
  assert.equal(endedView.discardPile.length, 10);

  const hostScore = store.submitScore(host.code, host.playerToken, [
    { cardId: 'a', base: 10, bonusPenalty: 5 },
    { cardId: 'b', base: 2, bonusPenalty: -1 }
  ]);
  assert.equal(hostScore.scores.p1.total, 16);

  const guestScore = store.submitScore(host.code, guest.playerToken, [
    { cardId: 'c', base: 20, bonusPenalty: 0 }
  ]);
  assert.equal(guestScore.scores.p2.total, 20);
  assert.equal(guestScore.winner.playerId, 'p2');
});

test('keeps score manual by not including automatic score previews', () => {
  const store = createGameStore(cards, { shuffle: false, random: () => 0 });
  const host = store.createRoom('Score Host');
  store.joinRoom(host.code, 'Score Guest');

  const view = store.startGame(host.code, host.playerToken);

  assert.equal(Object.hasOwn(view.you, 'autoScore'), false);
});

test('restarts an ended game in the same room with the same players', () => {
  const store = createGameStore(cards, { shuffle: false, random: () => 0 });
  const host = store.createRoom('Restart Host');
  const guest = store.joinRoom(host.code, 'Restart Guest');
  store.startGame(host.code, host.playerToken);
  store.finishCoinToss(host.code, host.playerToken);

  for (let turn = 0; turn < 10; turn += 1) {
    const token = turn % 2 === 0 ? host.playerToken : guest.playerToken;
    const viewAfterDraw = store.drawFromDeck(host.code, token);
    store.discardCard(host.code, token, viewAfterDraw.you.hand[0].id);
  }

  const endedView = store.getView(host.code, host.playerToken);
  assert.equal(endedView.phase, 'ended');
  assert.equal(endedView.discardPile.length, 10);

  store.submitScore(host.code, host.playerToken, [
    { cardId: 'scored-card', base: 10, bonusPenalty: 5 }
  ]);

  const restarted = store.restartGame(host.code, host.playerToken);

  assert.equal(restarted.phase, 'flipping');
  assert.equal(restarted.code, host.code);
  assert.equal(restarted.players.length, 2);
  assert.equal(restarted.players[0].name, 'Restart Host');
  assert.equal(restarted.players[1].name, 'Restart Guest');
  assert.equal(restarted.discardPile.length, 0);
  assert.equal(restarted.deckCount, 39);
  assert.equal(restarted.you.hand.length, 7);
  assert.equal(restarted.currentPlayerId, null);
  assert.deepEqual(restarted.scores, {});

  const afterRestartCoin = store.finishCoinToss(host.code, host.playerToken);
  assert.equal(afterRestartCoin.phase, 'playing');
  assert.equal(afterRestartCoin.currentPlayerId, 'p1');
});
