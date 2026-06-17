import { renderCard } from './cardView.js';

export function renderCardDetail(card) {
  return `
    <div class="detail-card-stage">
      ${renderCard(card, {
        className: 'detail-card-full',
        showActions: false
      })}
    </div>
  `;
}
