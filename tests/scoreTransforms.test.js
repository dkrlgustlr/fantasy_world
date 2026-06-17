import test from 'node:test';
import assert from 'node:assert/strict';
import cards from '../data/cards.json' with { type: 'json' };
import { buildScoreRows } from '../public/scoreTransforms.js';

const cardsById = Object.fromEntries(cards.map((card) => [card.id, card]));

function hand(ids) {
  return ids.map((id) => {
    assert.ok(cardsById[id], `${id} should exist`);
    return cardsById[id];
  });
}

test('doppelganger score row displays the copied card and copies its base strength', () => {
  const rows = buildScoreRows(hand(['doppelganger', 'dragon']), [], {
    doppelganger: { targetId: 'dragon', source: 'hand' }
  });

  const doppelganger = rows.find((row) => row.key === 'doppelganger');
  assert.equal(doppelganger.displayCard.id, 'dragon');
  assert.equal(doppelganger.detailCardId, 'dragon');
  assert.equal(doppelganger.defaultBase, cardsById.dragon.base);
  assert.match(doppelganger.note, /도플갱어/);
  assert.match(doppelganger.note, /용/);
});

test('mirage and shapeshifter display copied card identity while keeping their own base strength', () => {
  const rows = buildScoreRows(hand(['mirage', 'shapeshifter', 'forest', 'queen']), [], {
    mirage: { targetId: 'forest', source: 'hand' },
    shapeshifter: { targetId: 'queen', source: 'hand' }
  });

  const mirage = rows.find((row) => row.key === 'mirage');
  const shapeshifter = rows.find((row) => row.key === 'shapeshifter');
  assert.equal(mirage.displayCard.id, 'forest');
  assert.equal(mirage.defaultBase, cardsById.mirage.base);
  assert.match(mirage.note, /신기루/);
  assert.equal(shapeshifter.displayCard.id, 'queen');
  assert.equal(shapeshifter.defaultBase, cardsById.shapeshifter.base);
  assert.match(shapeshifter.note, /변신 능력자/);
});

test('book of changes changes the displayed suit of the chosen hand card', () => {
  const rows = buildScoreRows(hand(['book_of_changes', 'dragon']), [], {
    book_of_changes: { targetId: 'dragon', source: 'hand', suit: '지도자' }
  });

  const dragon = rows.find((row) => row.key === 'dragon');
  assert.equal(dragon.displayCard.name, cardsById.dragon.name);
  assert.equal(dragon.displayCard.suit, '지도자');
  assert.equal(dragon.defaultBase, cardsById.dragon.base);
  assert.match(dragon.note, /변화의 책/);
});

test('necromancer adds a discarded target as an eighth score row', () => {
  const rows = buildScoreRows(hand(['necromancer', 'queen']), hand(['knights']), {
    necromancer: { targetId: 'knights', source: 'discard' }
  });

  const necromancerRow = rows.find((row) => row.key === 'necromancer:knights');
  assert.equal(rows.length, 3);
  assert.equal(necromancerRow.displayCard.id, 'knights');
  assert.equal(necromancerRow.defaultBase, cardsById.knights.base);
  assert.equal(necromancerRow.cardId, 'necromancer:knights');
  assert.match(necromancerRow.note, /강령술사/);
});
