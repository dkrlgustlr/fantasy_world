const SPECIAL_CARD_PROMPTS = {
  mirage: '군대, 땅, 날씨, 물, 불 중 복사할 카드 1장을 정하세요.',
  shapeshifter: '유물, 지도자, 마법사, 무기, 야수 중 복사할 카드 1장을 정하세요.',
  doppelganger: '내 손패에서 복사할 다른 카드 1장을 정하세요.',
  book_of_changes: '종류를 바꿀 카드 1장과 새 종류를 정하세요.',
  fountain_of_life: '무기, 물, 불, 땅, 날씨 중 기본 힘을 더할 카드 1장을 정하세요.',
  island: '페널티를 제거할 물 또는 불 카드 1장을 정하세요.',
  necromancer: '버린 군대, 지도자, 마법사, 야수 중 8번째 카드로 쓸 카드 1장을 정하세요.'
};

const TARGET_RULES = {
  mirage: {
    handSuits: ['군대', '땅', '날씨', '물', '불'],
    discardSuits: ['군대', '땅', '날씨', '물', '불']
  },
  shapeshifter: {
    handSuits: ['유물', '지도자', '마법사', '무기', '야수'],
    discardSuits: ['유물', '지도자', '마법사', '무기', '야수']
  },
  doppelganger: {
    handSuits: 'any',
    excludeSelf: true
  },
  book_of_changes: {
    handSuits: 'any',
    excludeSelf: true
  },
  fountain_of_life: {
    handSuits: ['무기', '물', '불', '땅', '날씨'],
    excludeSelf: true
  },
  island: {
    handSuits: ['물', '불'],
    excludeSelf: true
  },
  necromancer: {
    discardSuits: ['군대', '지도자', '마법사', '야수']
  }
};

export function specialChoicesForHand(hand = [], discardPile = []) {
  const safeHand = Array.isArray(hand) ? hand : [];
  const safeDiscardPile = Array.isArray(discardPile) ? discardPile : [];

  return safeHand
    .filter((card) => SPECIAL_CARD_PROMPTS[card.id])
    .map((card) => ({
      cardId: card.id,
      name: card.name,
      prompt: SPECIAL_CARD_PROMPTS[card.id],
      targets: targetsForSpecialCard(card, safeHand, safeDiscardPile)
    }));
}

function targetsForSpecialCard(card, hand, discardPile) {
  const rule = TARGET_RULES[card.id];
  if (!rule) return [];

  const targets = [];
  if (rule.handSuits) {
    targets.push(...filterTargets(hand, rule.handSuits, card, rule.excludeSelf, 'hand'));
  }
  if (rule.discardSuits) {
    targets.push(...filterTargets(discardPile, rule.discardSuits, card, false, 'discard'));
  }
  return targets;
}

function filterTargets(cards, suits, sourceCard, excludeSelf, source) {
  return cards
    .filter((card) => {
      if (excludeSelf && card.id === sourceCard.id) return false;
      return suits === 'any' || suits.includes(card.suit);
    })
    .map((card) => ({
      id: card.id,
      name: card.name,
      suit: card.suit,
      base: card.base,
      source
    }));
}
