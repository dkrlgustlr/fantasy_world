import test from 'node:test';
import assert from 'node:assert/strict';
import cards from '../data/cards.json' with { type: 'json' };

const cardsById = Object.fromEntries(cards.map((card) => [card.id, card]));

test('photo-verified cards match the physical card text', () => {
  const expectedCards = {
    mountain: { name: '산', suit: '땅', base: 9, text: '연기와 들불이 모두 있으면 +50. 모든 물의 페널티 제거.' },
    earth_elemental: { name: '대지의 정령', suit: '땅', base: 4, text: '다른 땅 1장당 +15.' },
    warship: { name: '전함', suit: '무기', base: 23, text: "페널티. 물이 하나도 없으면 이 카드는 무효. 모든 불의 페널티에서 '군대'를 제거." },
    knights: { name: '기사단', suit: '군대', base: 20, text: '페널티. 지도자가 하나도 없으면 -8.' },
    elven_archers: { name: '엘프 궁수대', suit: '군대', base: 10, text: '날씨가 하나도 없으면 +5.' },
    rangers: { name: '돌격대', suit: '군대', base: 5, text: "땅 1장당 +10. 모든 카드의 페널티에서 '군대'를 제거." },
    light_cavalry: { name: '경기병대', suit: '군대', base: 17, text: '페널티. 땅 1장당 -2.' },
    dwarvish_infantry: { name: '드워프 보병대', suit: '군대', base: 15, text: '페널티. 다른 군대 1장당 -2.' },
    cavern: { name: '동굴', suit: '땅', base: 6, text: '드워프 보병대, 용 중 하나라도 있으면 +25. 모든 날씨의 페널티 제거.' },
    airship: { name: '전투 비행선', suit: '무기', base: 35, text: '페널티. 군대가 하나도 없거나, 날씨가 하나라도 있으면 이 카드는 무효.' },
    rainstorm: { name: '폭풍우', suit: '날씨', base: 8, text: '물 1장당 +10. 페널티. 모든 불 무효, 번개 예외.' },
    whirlwind: { name: '회오리바람', suit: '날씨', base: 13, text: '폭풍우가 있고, 눈보라, 대홍수 중 하나라도 있으면 +40.' },
    book_of_changes: { name: '변화의 책', suit: '유물', base: 3, text: '손에 있는 다른 카드 1장의 종류를 변경 가능. 이름, 기본 힘, 보너스, 페널티는 그대로 유지.' },
    collector: { name: '수집가', suit: '마법사', base: 7, text: '종류가 같고, 이름은 같지 않은 카드 3장이면 +10, 4장이면 +40, 5장이면 +100.' },
    empress: { name: '황후', suit: '지도자', base: 15, text: '군대 1장당 +10. 다른 지도자 1장당 -5.' },
    enchantress: { name: '여마도사', suit: '마법사', base: 5, text: '땅, 날씨, 물, 불 1장당 +5.' },
    unicorn: { name: '유니콘', suit: '야수', base: 9, text: '공주가 있으면 +30. 또는 황후, 여왕, 여마도사 중 하나라도 있으면 +15.' },
    sword_of_keth: { name: '케드의 검', suit: '무기', base: 7, text: '지도자가 하나라도 있으면 +10. 또는 지도자가 하나라도 있고, 케드의 방패가 있으면 +40.' },
    shield_of_keth: { name: '케드의 방패', suit: '유물', base: 4, text: '지도자가 하나라도 있으면 +15. 또는 지도자가 하나라도 있고, 케드의 검이 있으면 +40.' },
    king: { name: '왕', suit: '지도자', base: 8, text: '군대 1장당 +5. 또는 여왕이 있으면 군대 1장당 +20.' },
    queen: { name: '여왕', suit: '지도자', base: 6, text: '군대 1장당 +5. 또는 왕이 있으면 군대 1장당 +20.' }
  };

  for (const [id, expected] of Object.entries(expectedCards)) {
    const actual = cardsById[id];
    assert.ok(actual, `${id} should exist`);
    assert.deepEqual(
      { name: actual.name, suit: actual.suit, base: actual.base, text: actual.text },
      expected,
      id
    );
  }
});
