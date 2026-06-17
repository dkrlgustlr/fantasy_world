const HIGHLIGHT_TERMS = [
  ['마법사', 'wizard'],
  ['지도자', 'leader'],
  ['날씨', 'weather'],
  ['군대', 'army'],
  ['야수', 'beast'],
  ['무기', 'weapon'],
  ['유물', 'artifact'],
  ['불명', 'wild'],
  ['땅', 'land'],
  ['물', 'water'],
  ['불', 'fire']
];

const RULE_WORDS = ['페널티', '무효', '제거', '복사', '예외'];

export function formatCardText(value) {
  const text = String(value || '');
  const parts = [];
  let index = 0;

  while (index < text.length) {
    const scoreMatch = text.slice(index).match(/^[+-]\d+/);
    if (scoreMatch) {
      parts.push(`<span class="score-word">${escapeHtml(scoreMatch[0])}</span>`);
      index += scoreMatch[0].length;
      continue;
    }

    const term = HIGHLIGHT_TERMS.find(([word]) => text.startsWith(word, index));
    if (term) {
      const [word, className] = term;
      parts.push(`<span class="term term-${className}">${escapeHtml(word)}</span>`);
      index += word.length;
      continue;
    }

    const ruleWord = RULE_WORDS.find((word) => text.startsWith(word, index));
    if (ruleWord) {
      parts.push(`<span class="rule-word">${escapeHtml(ruleWord)}</span>`);
      index += ruleWord.length;
      continue;
    }

    parts.push(escapeHtml(text[index]));
    index += 1;
  }

  return parts.join('');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
