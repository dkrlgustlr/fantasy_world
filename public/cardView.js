export function renderCard(card, options = {}) {
  const imageId = encodeURIComponent(card.id);
  const extraClass = options.className ? ` ${escapeHtml(options.className)}` : '';
  const showActions = options.showActions !== false;
  const detailCardImage = `
    <article class="card suit-${escapeHtml(card.suit)}${extraClass}">
      <img class="full-card-image" src="/assets/cards/full/${imageId}.png" alt="${escapeHtml(card.name)}" loading="lazy">
    </article>
  `;

  if (!showActions) {
    return detailCardImage;
  }

  const selectedClass = options.selected ? ' is-selected' : '';

  return `
    <article class="card-slot${selectedClass}" data-card-id="${escapeHtml(card.id)}">
      <button class="card-select" type="button" data-card-select="${escapeHtml(card.id)}" aria-label="${escapeHtml(card.name)} 선택">
        <span class="card suit-${escapeHtml(card.suit)}${extraClass}">
          <img class="full-card-image" src="/assets/cards/full/${imageId}.png" alt="${escapeHtml(card.name)}" loading="lazy">
        </span>
      </button>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
