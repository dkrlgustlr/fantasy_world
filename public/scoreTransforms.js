export const BOOK_CHANGE_SUITS = ['군대', '땅', '날씨', '물', '불', '유물', '지도자', '마법사', '무기', '야수'];

const COPY_CARD_LABELS = {
  doppelganger: '도플갱어',
  mirage: '신기루',
  shapeshifter: '변신 능력자'
};

export function buildScoreRows(hand = [], discardPile = [], transforms = {}) {
  const safeHand = Array.isArray(hand) ? hand : [];
  const safeDiscardPile = Array.isArray(discardPile) ? discardPile : [];
  const safeTransforms = transforms || {};
  const rows = safeHand.map((card) => buildHandScoreRow(card, safeHand, safeDiscardPile, safeTransforms));
  const necromancerRow = buildNecromancerRow(safeHand, safeDiscardPile, safeTransforms.necromancer);
  if (necromancerRow) {
    rows.push(necromancerRow);
  }
  return rows;
}

function buildHandScoreRow(card, hand, discardPile, transforms) {
  const copyRow = buildCopyRow(card, hand, discardPile, transforms[card.id]);
  if (copyRow) return copyRow;

  const bookRow = buildBookChangedRow(card, transforms.book_of_changes);
  if (bookRow) return bookRow;

  return {
    key: card.id,
    cardId: card.id,
    sourceCard: card,
    displayCard: card,
    detailCardId: card.id,
    defaultBase: card.base,
    note: ''
  };
}

function buildCopyRow(card, hand, discardPile, transform) {
  if (!COPY_CARD_LABELS[card.id] || !transform?.targetId) return null;
  const target = findTargetCard(hand, discardPile, transform);
  if (!target) return null;
  const copiesBase = card.id === 'doppelganger';
  const copyType = copiesBase ? '이름, 종류, 기본 힘 복사중' : '이름과 종류 복사중';
  return {
    key: card.id,
    cardId: card.id,
    sourceCard: card,
    displayCard: target,
    detailCardId: target.id,
    defaultBase: copiesBase ? target.base : card.base,
    note: `${COPY_CARD_LABELS[card.id]}: ${target.name} ${copyType}`
  };
}

function buildBookChangedRow(card, transform) {
  if (!transform?.targetId || transform.targetId !== card.id || !transform.suit) return null;
  return {
    key: card.id,
    cardId: card.id,
    sourceCard: card,
    displayCard: { ...card, suit: transform.suit },
    detailCardId: card.id,
    defaultBase: card.base,
    note: `변화의 책: ${card.name} 종류 ${card.suit} -> ${transform.suit}`
  };
}

function buildNecromancerRow(hand, discardPile, transform) {
  if (!transform?.targetId) return null;
  const target = findTargetCard(hand, discardPile, transform);
  if (!target) return null;
  return {
    key: `necromancer:${target.id}`,
    cardId: target.id,
    sourceCard: target,
    displayCard: target,
    detailCardId: target.id,
    defaultBase: target.base,
    isNecromancerCard: true,
    note: `강령술사: 버린 ${target.name}을 가져온 카드`
  };
}

function findTargetCard(hand, discardPile, transform) {
  if (transform.source === 'discard') {
    return discardPile.find((card) => card.id === transform.targetId) || null;
  }
  if (transform.source === 'hand') {
    return hand.find((card) => card.id === transform.targetId) || null;
  }
  return [...hand, ...discardPile].find((card) => card.id === transform.targetId) || null;
}
