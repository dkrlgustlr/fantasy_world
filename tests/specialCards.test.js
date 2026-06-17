import test from 'node:test';
import assert from 'node:assert/strict';
import cards from '../data/cards.json' with { type: 'json' };
import { specialChoicesForHand } from '../public/specialCards.js';

const cardsById = Object.fromEntries(cards.map((card) => [card.id, card]));

function hand(ids) {
  return ids.map((id) => {
    assert.ok(cardsById[id], `${id} should exist`);
    return cardsById[id];
  });
}

test('lists special cards that need manual choices', () => {
  const choices = specialChoicesForHand(hand([
    'mirage',
    'shapeshifter',
    'doppelganger',
    'book_of_changes',
    'fountain_of_life',
    'island',
    'necromancer'
  ]));

  assert.deepEqual(
    choices.map((choice) => choice.cardId),
    ['mirage', 'shapeshifter', 'doppelganger', 'book_of_changes', 'fountain_of_life', 'island', 'necromancer']
  );
  assert.equal(choices.every((choice) => choice.prompt.length > 0), true);
});

test('suggests visible target cards without calculating score', () => {
  const choices = specialChoicesForHand(
    hand(['doppelganger', 'dragon', 'warship']),
    hand(['knights', 'queen'])
  );

  const doppelganger = choices.find((choice) => choice.cardId === 'doppelganger');
  assert.deepEqual(doppelganger.targets.map((target) => target.id), ['dragon', 'warship']);

  const necromancerChoices = specialChoicesForHand(hand(['necromancer']), hand(['knights', 'queen']));
  assert.deepEqual(necromancerChoices[0].targets.map((target) => target.id), ['knights', 'queen']);
});
