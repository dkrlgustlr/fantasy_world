import { renderCardDetail } from './cardDetail.js';
import { renderCard as renderStructuredCard } from './cardView.js';
import { BOOK_CHANGE_SUITS, buildScoreRows } from './scoreTransforms.js';
import { createCardSoundEffects } from './soundEffects.js';
import { specialChoicesForHand } from './specialCards.js';

const els = {
  connection: document.querySelector('#connection'),
  entry: document.querySelector('#entry'),
  lobby: document.querySelector('#lobby'),
  game: document.querySelector('#game'),
  score: document.querySelector('#score'),
  playerName: document.querySelector('#playerName'),
  roomCode: document.querySelector('#roomCode'),
  createRoom: document.querySelector('#createRoom'),
  joinRoom: document.querySelector('#joinRoom'),
  soloTest: document.querySelector('#soloTest'),
  openRules: document.querySelector('#openRules'),
  testControls: document.querySelector('#testControls'),
  seatButtons: [...document.querySelectorAll('[data-test-seat]')],
  roomActions: document.querySelector('#roomActions'),
  leaveRoom: document.querySelector('#leaveRoom'),
  lobbyCode: document.querySelector('#lobbyCode'),
  lobbyPlayers: document.querySelector('#lobbyPlayers'),
  startGame: document.querySelector('#startGame'),
  coinToss: document.querySelector('#coinToss'),
  coinImage: document.querySelector('#coinImage'),
  coinResult: document.querySelector('#coinResult'),
  coinPlayers: document.querySelector('#coinPlayers'),
  gameCode: document.querySelector('#gameCode'),
  deckCount: document.querySelector('#deckCount'),
  discardCount: document.querySelector('#discardCount'),
  turnText: document.querySelector('#turnText'),
  drawDeck: document.querySelector('#drawDeck'),
  discardPile: document.querySelector('#discardPile'),
  hand: document.querySelector('#hand'),
  handCount: document.querySelector('#handCount'),
  selectedCardActions: document.querySelector('#selectedCardActions'),
  selectedCardAction: document.querySelector('#selectedCardAction'),
  selectedCardDetail: document.querySelector('#selectedCardDetail'),
  opponentInfo: document.querySelector('#opponentInfo'),
  opponentHand: document.querySelector('#opponentHand'),
  scoreRows: document.querySelector('#scoreRows'),
  specialChoices: document.querySelector('#specialChoices'),
  scoreDiscardCards: document.querySelector('#scoreDiscardCards'),
  viewDiscardedCards: document.querySelector('#viewDiscardedCards'),
  submitScore: document.querySelector('#submitScore'),
  restartGame: document.querySelector('#restartGame'),
  scoreStatus: document.querySelector('#scoreStatus'),
  scoreSummary: document.querySelector('#scoreSummary'),
  cardOverlay: document.querySelector('#cardOverlay'),
  cardOverlayBody: document.querySelector('#cardOverlayBody'),
  closeCardOverlay: document.querySelector('#closeCardOverlay'),
  rulesOverlay: document.querySelector('#rulesOverlay'),
  closeRulesOverlay: document.querySelector('#closeRulesOverlay'),
  message: document.querySelector('#message')
};

let state = {
  code: localStorage.getItem('fw:code') || '',
  playerToken: localStorage.getItem('fw:token') || '',
  testTokens: readSavedTestTokens(),
  selectedCardId: '',
  scoreTransforms: {},
  scoreContextKey: '',
  view: null,
  events: null,
  coinRevealTimer: null,
  coinFinishTimer: null
};

const cardSounds = createCardSoundEffects();

els.createRoom.addEventListener('click', createRoom);
els.joinRoom.addEventListener('click', joinRoom);
els.soloTest.addEventListener('click', startSoloTest);
els.openRules.addEventListener('click', openRulesOverlay);
els.seatButtons.forEach((button) => {
  button.addEventListener('click', () => switchTestSeat(button.dataset.testSeat));
});
els.startGame.addEventListener('click', () => postAction('start'));
els.drawDeck.addEventListener('click', () => postAction('draw-deck'));
els.leaveRoom.addEventListener('click', leaveRoom);
els.selectedCardAction.addEventListener('click', () => {
  const action = els.selectedCardAction.dataset.cardAction;
  const cardId = els.selectedCardAction.dataset.cardId;
  if (!action || !cardId) return;
  postAction(action, { cardId });
});
els.selectedCardDetail.addEventListener('click', () => {
  const cardId = els.selectedCardDetail.dataset.cardId;
  if (!cardId) return;
  openCardDetail(cardId);
});
els.scoreRows.addEventListener('click', (event) => {
  const detailButton = event.target.closest?.('[data-score-card-detail]');
  if (!detailButton) return;
  openCardDetail(detailButton.dataset.scoreCardDetail);
});
els.scoreDiscardCards.addEventListener('click', (event) => {
  const discardButton = event.target.closest?.('[data-score-discard-detail]');
  if (!discardButton) return;
  openCardDetail(discardButton.dataset.scoreDiscardDetail);
});
els.viewDiscardedCards.addEventListener('click', () => {
  els.scoreDiscardCards.classList.toggle('hidden');
  const visibleDiscardCount = scoreVisibleDiscardPile(state.view?.discardPile || []).length;
  els.viewDiscardedCards.textContent = els.scoreDiscardCards.classList.contains('hidden')
    ? `버린 카드 보기 (${visibleDiscardCount})`
    : '버린 카드 숨기기';
});
els.specialChoices.addEventListener('click', handleSpecialChoiceClick);
els.specialChoices.addEventListener('change', handleSpecialChoiceChange);
els.submitScore.addEventListener('click', submitScore);
els.restartGame.addEventListener('click', () => postAction('restart'));
els.closeCardOverlay.addEventListener('click', closeCardDetail);
els.closeRulesOverlay.addEventListener('click', closeRulesOverlay);
els.cardOverlay.addEventListener('click', (event) => {
  if (event.target.dataset.closeCardDetail !== undefined) {
    closeCardDetail();
  }
});
els.rulesOverlay.addEventListener('click', (event) => {
  if (event.target.dataset.closeRules !== undefined) {
    closeRulesOverlay();
  }
});
setupUserAudioUnlock();
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeCardDetail();
    closeRulesOverlay();
  }
});

if (state.code && state.playerToken) {
  connectEvents();
  refreshView();
}

async function createRoom() {
  clearTestMode();
  const result = await request('/api/rooms', {
    method: 'POST',
    body: { name: playerName() }
  });
  setSession(result.code, result.playerToken);
  connectEvents();
  await refreshView();
}

async function joinRoom() {
  clearTestMode();
  const code = els.roomCode.value.trim().toUpperCase();
  if (!code) {
    return showMessage('초대코드를 입력하세요.');
  }
  const result = await request(`/api/rooms/${code}/join`, {
    method: 'POST',
    body: { name: playerName() }
  });
  setSession(code, result.playerToken);
  connectEvents();
  await refreshView();
}

async function startSoloTest() {
  const result = await request('/api/test/solo-room', {
    method: 'POST',
    body: { name: playerName(), playerCount: 6 }
  });
  setTestTokens(result.playerTokens);
  setSession(result.code, result.playerTokens.p1);
  connectEvents();
  await refreshView();
  showMessage('혼자 테스트 모드입니다. 위에서 1P~6P를 바꿔가며 확인하세요.');
}

async function switchTestSeat(playerId) {
  const token = state.testTokens?.[playerId];
  if (!token || token === state.playerToken) return;
  setSession(state.code, token);
  connectEvents();
  await refreshView();
}

async function leaveRoom() {
  const code = state.code;
  const playerToken = state.playerToken;
  try {
    if (code && playerToken) {
      await request(`/api/rooms/${code}/leave`, {
        method: 'POST',
        body: { playerToken }
      });
    }
  } catch {
    // Local leave should still work even if the room already expired remotely.
  } finally {
    clearSession();
    clearCoinTimers();
    closeCardDetail();
    render();
    showMessage('방에서 나왔습니다.');
  }
}

async function postAction(action, body = {}) {
  playActionSound(action);
  const result = await request(`/api/rooms/${state.code}/${action}`, {
    method: 'POST',
    body: { ...body, playerToken: state.playerToken }
  });
  if (action === 'restart') {
    state.selectedCardId = '';
    resetScoreTransforms();
    closeCardDetail();
  }
  if (state.testTokens?.[result.currentPlayerId] && result.currentPlayerId !== result.you?.id) {
    await switchTestSeat(result.currentPlayerId);
    return;
  }
  state.view = result;
  render();
}

function setupUserAudioUnlock() {
  const unlock = () => cardSounds.unlock();
  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
  window.addEventListener('keydown', unlock, { once: true });
}

function playActionSound(action) {
  switch (action) {
    case 'draw-deck':
    case 'draw-discard':
      cardSounds.playDraw();
      break;
    case 'discard':
      cardSounds.playDiscard();
      break;
  }
}

async function refreshView() {
  if (!state.code || !state.playerToken) return;
  state.view = await request(`/api/rooms/${state.code}?token=${encodeURIComponent(state.playerToken)}`);
  render();
}

function connectEvents() {
  if (state.events) {
    state.events.close();
  }
  state.events = new EventSource(`/api/rooms/${state.code}/events?token=${encodeURIComponent(state.playerToken)}`);
  state.events.onopen = () => {
    els.connection.textContent = '연결됨';
  };
  state.events.onerror = () => {
    els.connection.textContent = '재연결';
  };
  state.events.onmessage = (event) => {
    state.view = JSON.parse(event.data);
    render();
  };
}

function render() {
  const view = state.view;
  if (!view) {
    renderTestControls(null);
    renderRoomActions(null);
    showOnly('entry');
    return;
  }
  renderTestControls(view);
  renderRoomActions(view);
  els.connection.textContent = view.phase === 'ended' ? '종료' : '연결됨';
  if (view.phase === 'waiting') {
    clearCoinTimers();
    renderLobby(view);
    showOnly('lobby');
    return;
  }
  if (view.phase === 'flipping') {
    renderCoinToss(view);
    showOnly('coinToss');
    return;
  }
  clearCoinTimers();
  renderGame(view);
  showOnly(view.phase === 'ended' ? 'score' : 'game');
}

function renderLobby(view) {
  els.lobbyCode.textContent = view.code;
  els.lobbyPlayers.innerHTML = view.players
    .map((player) => `<div class="player-row"><span>${escapeHtml(player.name)}</span><strong>${player.isYou ? '나' : player.isHost ? '방장' : '참가자'}</strong></div>`)
    .join('');
  const canStart = view.you?.isHost && view.players.length >= 2 && view.players.length <= 6;
  els.startGame.disabled = !canStart;
  els.startGame.textContent = view.players.length < 2
    ? '2명부터 시작 가능'
    : view.you?.isHost ? `선 정하기 (${view.players.length}인)` : '방장만 시작 가능';
}

function renderCoinToss(view) {
  const coin = view.coinToss || {};
  const revealDelay = Math.max(0, Number(coin.revealAt || Date.now()) - Date.now());
  const winnerName = coin.winnerName || playerNameById(view, coin.winnerPlayerId) || '선공 플레이어';

  clearCoinTimers();
  els.coinImage.classList.add('is-spinning');
  els.coinResult.textContent = '동전이 돌고 있습니다.';
  renderCoinPlayers(view, false);

  state.coinRevealTimer = window.setTimeout(() => {
    els.coinImage.classList.remove('is-spinning');
    els.coinResult.textContent = `${winnerName} 선공!`;
    renderCoinPlayers(view, true);
    state.coinFinishTimer = window.setTimeout(() => {
      postAction('finish-coin');
    }, 700);
  }, revealDelay);
}

function renderCoinPlayers(view, revealed) {
  const winnerPlayerId = view.coinToss?.winnerPlayerId;
  els.coinPlayers.innerHTML = view.players
    .map((player) => {
      const isWinner = revealed && player.id === winnerPlayerId;
      const label = isWinner ? '선공' : player.isYou ? '나' : '상대';
      return `<div class="player-row${isWinner ? ' is-first-player' : ''}"><span>${escapeHtml(player.name)}</span><strong>${label}</strong></div>`;
    })
    .join('');
}

function clearCoinTimers() {
  if (state.coinRevealTimer) {
    window.clearTimeout(state.coinRevealTimer);
    state.coinRevealTimer = null;
  }
  if (state.coinFinishTimer) {
    window.clearTimeout(state.coinFinishTimer);
    state.coinFinishTimer = null;
  }
}

function playerNameById(view, playerId) {
  return view.players.find((player) => player.id === playerId)?.name || '';
}

function renderGame(view) {
  els.gameCode.textContent = view.code;
  els.deckCount.textContent = view.deckCount;
  els.discardCount.textContent = view.discardPile.length;
  const visibleCardIds = new Set([
    ...view.you.hand.map((card) => card.id),
    ...view.discardPile.map((card) => card.id)
  ]);
  if (!visibleCardIds.has(state.selectedCardId)) {
    state.selectedCardId = '';
  }
  const isMyTurn = view.currentPlayerId === view.you.id;
  els.turnText.textContent = isMyTurn
    ? view.drawnThisTurn ? '버릴 카드 선택' : '카드 가져오기'
    : '상대 턴';
  els.drawDeck.disabled = !isMyTurn || view.drawnThisTurn || view.phase !== 'playing';
  els.handCount.textContent = `${view.you.hand.length}장`;
  els.hand.innerHTML = view.you.hand.map((card) => renderStructuredCard(card, {
    buttonText: '버리기',
    disabled: !isMyTurn || !view.drawnThisTurn || view.phase !== 'playing',
    action: `discard:${card.id}`,
    selected: state.selectedCardId === card.id
  })).join('');
  els.discardPile.innerHTML = view.discardPile.length
    ? view.discardPile.map((card) => renderStructuredCard(card, {
      buttonText: '가져오기',
      disabled: !isMyTurn || view.drawnThisTurn || view.phase !== 'playing',
      action: `draw-discard:${card.id}`,
      selected: state.selectedCardId === card.id
    })).join('')
    : '<p>아직 버린 카드가 없습니다.</p>';
  renderOpponentPlayers(view);
  bindCardButtons();
  renderSelectedCardActions(view, isMyTurn);
  renderScore(view);
}

function renderOpponentPlayers(view) {
  if (!els.opponentHand) return;
  const opponents = view.players.filter((player) => !player.isYou);
  const currentTurnName = playerNameById(view, view.currentPlayerId);
  els.opponentInfo.textContent = opponents.length
    ? `${opponents.length}명 / 현재 턴: ${currentTurnName || '-'}`
    : '-';
  els.opponentHand.innerHTML = opponents.map((opponent) => {
    const isCurrentTurn = opponent.id === view.currentPlayerId;
    const backs = Array.from({ length: opponent.handCount || 0 }, (_, index) => `
      <span class="opponent-card-back" aria-hidden="true" style="--card-index: ${index}"></span>
    `).join('');
    return `
      <article class="opponent-player-card ${isCurrentTurn ? 'is-current-turn' : ''}">
        <div class="opponent-player-head">
          <strong>${escapeHtml(opponent.name)}</strong>
          <span>${opponent.handCount || 0}장</span>
        </div>
        <div class="opponent-mini-hand">${backs}</div>
      </article>
    `;
  }).join('');
}

function renderScore(view) {
  const handKey = view.you.hand.map((card) => card.id).join('|');
  const scoreContextKey = `${view.code}:${view.you.id}:${handKey}`;
  if (state.scoreContextKey !== scoreContextKey) {
    state.scoreContextKey = scoreContextKey;
    state.scoreTransforms = {};
  }
  const transformKey = JSON.stringify(state.scoreTransforms);
  if (els.scoreRows.dataset.playerId !== view.you.id || els.scoreRows.dataset.handKey !== handKey || els.scoreRows.dataset.transformKey !== transformKey) {
    const scoreDrafts = readScoreDrafts();
    const scoreRows = buildScoreRows(view.you.hand, view.discardPile, state.scoreTransforms);
    els.scoreRows.innerHTML = scoreRows.map((scoreRow) => {
      const card = scoreRow.sourceCard;
      const displayCard = scoreRow.displayCard;
      const imageId = encodeURIComponent(displayCard.id);
      const draft = scoreDrafts[scoreRow.cardId];
      const baseValue = scoreRow.note ? scoreRow.defaultBase : (draft?.base ?? scoreRow.defaultBase);
      const bonusValue = draft?.bonus ?? 0;
      return `
        <div class="score-row ${scoreRow.note ? 'is-transformed' : ''}" data-card-id="${escapeHtml(scoreRow.cardId)}">
          <button class="score-card-preview" type="button" data-score-card-detail="${escapeHtml(scoreRow.detailCardId)}" aria-label="${escapeHtml(displayCard.name)} 자세히 보기">
            <img class="score-card-image" src="${scoreCardImageSrc(displayCard)}" data-fallback-src="/assets/cards/generated/${imageId}.png" alt="${escapeHtml(displayCard.name)}" loading="lazy">
          </button>
          <div class="score-card-fields">
            <div>
              <strong>${renderScoreRowName(card, displayCard)}</strong>
              ${renderScoreTransformNote(scoreRow)}
            </div>
            <label>기본 힘<input type="number" class="base" value="${baseValue}"></label>
            <label>보너스/페널티<input type="number" class="bonus" value="${bonusValue}"></label>
          </div>
        </div>
      `;
    }).join('');
    bindImageFallbacks(els.scoreRows);
    els.scoreRows.dataset.playerId = view.you.id;
    els.scoreRows.dataset.handKey = handKey;
    els.scoreRows.dataset.transformKey = transformKey;
  }
  renderSpecialChoices(view);
  renderScoreDiscardCards(view);
  const score = view.scores?.[view.you.id];
  els.scoreStatus.textContent = score ? `내 제출 점수: ${score.total}` : '카드별 보너스/페널티를 직접 입력하세요.';
  renderScoreSummary(view);
}

function renderScoreSummary(view) {
  const rows = view.players.map((player) => {
    const result = view.scores?.[player.id];
    return {
      player,
      result,
      submitted: Boolean(result)
    };
  });
  const allSubmitted = rows.length > 0 && rows.every((row) => row.submitted);
  const orderedRows = allSubmitted
    ? [...rows].sort((a, b) => b.result.total - a.result.total)
    : rows;
  const winnerLine = view.winner
    ? `<div class="score-summary-winner">${view.winner.playerId ? `${escapeHtml(view.winner.name)} 승리` : '무승부'} · ${view.winner.total}점</div>`
    : '';

  els.scoreSummary.innerHTML = `
    ${winnerLine}
    ${orderedRows.map((row, index) => `
      <div class="score-summary-row ${row.submitted ? 'is-submitted' : 'is-pending'}">
        <span>${allSubmitted ? `${index + 1}위 · ` : ''}${escapeHtml(row.player.name)}${row.player.isYou ? ' · 나' : ''}</span>
        <strong>${row.submitted ? `제출 완료 · ${row.result.total}점` : '계산 중'}</strong>
      </div>
    `).join('')}
  `;
}

function readScoreDrafts() {
  return [...els.scoreRows.querySelectorAll('.score-row')].reduce((drafts, row) => {
    drafts[row.dataset.cardId] = {
      base: Number(row.querySelector('.base')?.value || 0),
      bonus: Number(row.querySelector('.bonus')?.value || 0)
    };
    return drafts;
  }, {});
}

function renderScoreRowName(sourceCard, displayCard) {
  if (sourceCard.id === displayCard.id && sourceCard.suit === displayCard.suit) {
    return `${escapeHtml(displayCard.name)} <span class="score-row-suit">${escapeHtml(displayCard.suit)}</span>`;
  }
  return `${escapeHtml(sourceCard.name)} -> ${escapeHtml(displayCard.name)} <span class="score-row-suit">${escapeHtml(displayCard.suit)}</span>`;
}

function renderScoreTransformNote(scoreRow) {
  if (!scoreRow.note) return '';
  return `<p class="score-transform-note">${escapeHtml(scoreRow.note)}</p>`;
}

function scoreCardImageSrc(card) {
  const imageId = encodeURIComponent(card.id);
  return `/assets/cards/full/${imageId}.png`;
}

function claimedNecromancerDiscardId() {
  const necromancer = state.scoreTransforms.necromancer;
  return necromancer?.source === 'discard' ? necromancer.targetId : '';
}

function scoreVisibleDiscardPile(discardPile = []) {
  const claimedNecromancerCardId = claimedNecromancerDiscardId();
  return claimedNecromancerCardId
    ? discardPile.filter((card) => card.id !== claimedNecromancerCardId)
    : discardPile;
}

function renderScoreDiscardCards(view) {
  if (!els.scoreDiscardCards || !els.viewDiscardedCards) return;

  const discardPile = view.discardPile || [];
  const claimedNecromancerCardId = claimedNecromancerDiscardId();
  const visibleDiscardPile = scoreVisibleDiscardPile(discardPile);
  const discardKey = `${discardPile.map((card) => card.id).join('|')}|claimed:${claimedNecromancerCardId || ''}`;
  const isOpen = !els.scoreDiscardCards.classList.contains('hidden');
  els.viewDiscardedCards.disabled = visibleDiscardPile.length === 0;
  els.viewDiscardedCards.textContent = visibleDiscardPile.length
    ? (isOpen ? '버린 카드 숨기기' : `버린 카드 보기 (${visibleDiscardPile.length})`)
    : '버린 카드 없음';

  if (els.scoreDiscardCards.dataset.discardKey === discardKey) return;

  els.scoreDiscardCards.innerHTML = visibleDiscardPile.length
    ? visibleDiscardPile.map((card) => {
      const imageId = encodeURIComponent(card.id);
      return `
        <button class="score-discard-card" type="button" data-score-discard-detail="${escapeHtml(card.id)}" aria-label="${escapeHtml(card.name)} 자세히 보기">
          <img class="score-discard-card-image" src="${scoreCardImageSrc(card)}" data-fallback-src="/assets/cards/generated/${imageId}.png" alt="${escapeHtml(card.name)}" loading="lazy">
          <span>${escapeHtml(card.name)}</span>
        </button>
      `;
    }).join('')
    : '<p>버린 카드가 없습니다.</p>';
  bindImageFallbacks(els.scoreDiscardCards);
  els.scoreDiscardCards.dataset.discardKey = discardKey;
}

function renderSpecialChoices(view) {
  if (!els.specialChoices) return;
  const choices = specialChoicesForHand(view.you.hand, view.discardPile);
  els.specialChoices.innerHTML = choices.length
    ? `
      <section class="special-choice-panel" aria-label="특수카드 선택 도우미">
        <h3>특수카드 선택 도우미</h3>
        ${choices.map(renderSpecialChoice).join('')}
      </section>
    `
    : '';
}

function renderSpecialChoice(choice) {
  const targetText = choice.targets.length
    ? choice.targets.map((target) => `${target.name}(${target.suit})`).join(', ')
    : '현재 보이는 후보 없음';
  const transform = state.scoreTransforms[choice.cardId];
  const canTransform = isScoreTransformChoice(choice.cardId);
  return `
    <article class="special-choice">
      <div class="special-choice-title">
        <strong>${escapeHtml(choice.name)}</strong>
        ${transform?.targetId ? `<button class="special-clear" type="button" data-clear-special="${escapeHtml(choice.cardId)}">선택 해제</button>` : ''}
      </div>
      <p>${escapeHtml(choice.prompt)}</p>
      ${canTransform ? renderSpecialTargetControls(choice, transform) : `<small>후보: ${escapeHtml(targetText)}</small>`}
    </article>
  `;
}

function isScoreTransformChoice(cardId) {
  return ['doppelganger', 'mirage', 'shapeshifter', 'book_of_changes', 'necromancer'].includes(cardId);
}

function renderSpecialTargetControls(choice, transform) {
  if (!choice.targets.length) {
    return '<small>현재 보이는 후보 없음</small>';
  }
  const suitPicker = choice.cardId === 'book_of_changes'
    ? renderBookSuitPicker(transform?.suit)
    : '';
  return `
    ${suitPicker}
    <div class="special-targets">
      ${choice.targets.map((target) => {
        const isActive = transform?.targetId === target.id && transform?.source === target.source;
        return `
          <button class="special-target-button ${isActive ? 'is-active' : ''}" type="button" data-special-target="${escapeHtml(choice.cardId)}" data-target-card="${escapeHtml(target.id)}" data-target-source="${escapeHtml(target.source)}">
            ${escapeHtml(target.name)}
            <span>${escapeHtml(target.suit)} · ${target.source === 'discard' ? '버림' : '손패'}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function renderBookSuitPicker(selectedSuit = BOOK_CHANGE_SUITS[0]) {
  return `
    <label class="special-suit-picker">
      바꿀 종류
      <select data-book-suit="book_of_changes">
        ${BOOK_CHANGE_SUITS.map((suit) => `<option value="${escapeHtml(suit)}" ${suit === selectedSuit ? 'selected' : ''}>${escapeHtml(suit)}</option>`).join('')}
      </select>
    </label>
  `;
}

function handleSpecialChoiceClick(event) {
  const clearButton = event.target.closest?.('[data-clear-special]');
  if (clearButton) {
    delete state.scoreTransforms[clearButton.dataset.clearSpecial];
    render();
    return;
  }

  const targetButton = event.target.closest?.('[data-special-target]');
  if (!targetButton) return;

  const specialCardId = targetButton.dataset.specialTarget;
  const previous = state.scoreTransforms[specialCardId] || {};
  state.scoreTransforms[specialCardId] = {
    ...previous,
    targetId: targetButton.dataset.targetCard,
    source: targetButton.dataset.targetSource
  };
  if (specialCardId === 'book_of_changes') {
    state.scoreTransforms[specialCardId].suit = previous.suit || BOOK_CHANGE_SUITS[0];
  }
  render();
}

function handleSpecialChoiceChange(event) {
  const suitSelect = event.target.closest?.('[data-book-suit]');
  if (!suitSelect) return;
  const previous = state.scoreTransforms.book_of_changes || {};
  state.scoreTransforms.book_of_changes = {
    ...previous,
    suit: suitSelect.value
  };
  render();
}

function renderCard(card, options = {}) {
  const button = options.buttonText
    ? `<button data-action="${options.action}" ${options.disabled ? 'disabled' : ''}>${options.buttonText}</button>`
    : '';
  const imageId = encodeURIComponent(card.id);
  return `
    <article class="card suit-${card.suit}">
      <div class="card-art">
        <img src="/assets/cards/generated/${imageId}.png" data-fallback-src="/assets/cards/${imageId}.svg" alt="" loading="lazy">
      </div>
      <div class="meta"><span>${escapeHtml(card.suit)}</span><strong>${card.base}</strong></div>
      <h3>${escapeHtml(card.name)}</h3>
      <p class="card-text">${formatCardText(card.text)}</p>
      <div class="card-actions">
        ${button}
        <button class="detail-button" type="button" data-card-detail="${escapeHtml(card.id)}">자세히</button>
      </div>
    </article>
  `;
}

function bindCardButtons() {
  bindImageFallbacks(document);
  document.querySelectorAll('[data-card-select]').forEach((button) => {
    button.addEventListener('click', () => {
      selectCard(button.dataset.cardSelect);
    });
  });
  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const [action, cardId] = button.dataset.action.split(':');
      postAction(action, { cardId });
    });
  });
  document.querySelectorAll('[data-card-detail]').forEach((button) => {
    button.addEventListener('click', () => {
      openCardDetail(button.dataset.cardDetail);
    });
  });
}

function selectCard(cardId) {
  state.selectedCardId = state.selectedCardId === cardId ? '' : cardId;
  document.querySelectorAll('.card-slot').forEach((slot) => {
    slot.classList.toggle('is-selected', slot.dataset.cardId === state.selectedCardId);
  });
  if (state.view) {
    renderSelectedCardActions(state.view, state.view.currentPlayerId === state.view.you.id);
  }
}

function renderSelectedCardActions(view, isMyTurn) {
  const selected = selectedVisibleCard(view);
  els.selectedCardActions.classList.toggle('has-selection', Boolean(selected));
  els.selectedCardAction.dataset.cardAction = '';
  els.selectedCardAction.dataset.cardId = '';
  els.selectedCardDetail.dataset.cardId = '';

  if (!selected) {
    els.selectedCardAction.textContent = '버리기';
    els.selectedCardAction.disabled = true;
    els.selectedCardDetail.disabled = true;
    return;
  }

  const isDiscardCard = selected.source === 'discard';
  const action = isDiscardCard ? 'draw-discard' : 'discard';
  const canAct = isDiscardCard
    ? isMyTurn && !view.drawnThisTurn && view.phase === 'playing'
    : isMyTurn && view.drawnThisTurn && view.phase === 'playing';

  els.selectedCardAction.textContent = isDiscardCard ? '가져오기' : '버리기';
  els.selectedCardAction.disabled = !canAct;
  els.selectedCardAction.dataset.cardAction = action;
  els.selectedCardAction.dataset.cardId = selected.card.id;
  els.selectedCardDetail.disabled = false;
  els.selectedCardDetail.dataset.cardId = selected.card.id;
}

function selectedVisibleCard(view) {
  if (!view || !state.selectedCardId) return null;
  const handCard = view.you.hand.find((card) => card.id === state.selectedCardId);
  if (handCard) {
    return { card: handCard, source: 'hand' };
  }
  const discardCard = view.discardPile.find((card) => card.id === state.selectedCardId);
  if (discardCard) {
    return { card: discardCard, source: 'discard' };
  }
  return null;
}

function bindImageFallbacks(root) {
  root.querySelectorAll('img[data-fallback-src]').forEach((image) => {
    image.addEventListener('error', () => {
      const fallbackSrc = image.dataset.fallbackSrc;
      if (!fallbackSrc) return;
      image.removeAttribute('data-fallback-src');
      image.src = fallbackSrc;
    }, { once: true });
  });
}

function openCardDetail(cardId) {
  const card = findVisibleCard(cardId);
  if (!card) {
    return showMessage('지금 볼 수 있는 카드가 아닙니다.');
  }
  els.cardOverlayBody.innerHTML = renderCardDetail(card);
  bindImageFallbacks(els.cardOverlayBody);
  els.cardOverlay.classList.remove('hidden');
}

function closeCardDetail() {
  els.cardOverlay.classList.add('hidden');
  els.cardOverlayBody.innerHTML = '';
}

function openRulesOverlay() {
  els.rulesOverlay.classList.remove('hidden');
}

function closeRulesOverlay() {
  els.rulesOverlay.classList.add('hidden');
}

function resetScoreTransforms() {
  state.scoreTransforms = {};
  state.scoreContextKey = '';
}

function findVisibleCard(cardId) {
  const view = state.view;
  if (!view) return null;
  return [...(view.you?.hand || []), ...(view.discardPile || [])]
    .find((card) => card.id === cardId) || null;
}

async function submitScore() {
  const rows = [...els.scoreRows.querySelectorAll('.score-row')].map((row) => ({
    cardId: row.dataset.cardId,
    base: Number(row.querySelector('.base').value || 0),
    bonusPenalty: Number(row.querySelector('.bonus').value || 0)
  }));
  const result = await request(`/api/rooms/${state.code}/score`, {
    method: 'POST',
    body: { playerToken: state.playerToken, rows }
  });
  state.view = result;
  render();
  if (result.winner) {
    showMessage(result.winner.playerId ? `${result.winner.name} 승리` : '무승부');
  }
}

async function request(url, options = {}) {
  showMessage('');
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : {},
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(payload.error || '요청 실패');
  }
  return payload;
}

window.addEventListener('unhandledrejection', (event) => {
  showMessage(event.reason?.message || '오류가 발생했습니다.');
});

function setSession(code, playerToken) {
  state.code = code;
  state.playerToken = playerToken;
  localStorage.setItem('fw:code', code);
  localStorage.setItem('fw:token', playerToken);
}

function clearSession() {
  if (state.events) {
    state.events.close();
    state.events = null;
  }
  state.code = '';
  state.playerToken = '';
  state.selectedCardId = '';
  resetScoreTransforms();
  state.view = null;
  localStorage.removeItem('fw:code');
  localStorage.removeItem('fw:token');
  clearTestMode();
}

function setTestTokens(testTokens) {
  state.testTokens = testTokens;
  localStorage.setItem('fw:testTokens', JSON.stringify(testTokens));
}

function clearTestMode() {
  state.testTokens = null;
  localStorage.removeItem('fw:testTokens');
}

function readSavedTestTokens() {
  try {
    return JSON.parse(localStorage.getItem('fw:testTokens')) || null;
  } catch {
    return null;
  }
}

function renderTestControls(view) {
  const isTestMode = Boolean(state.testTokens && view?.you);
  els.testControls.classList.toggle('hidden', !isTestMode);
  if (!isTestMode) return;
  els.seatButtons.forEach((button) => {
    const playerId = button.dataset.testSeat;
    const hasToken = Boolean(state.testTokens?.[playerId]);
    button.hidden = !hasToken;
    button.classList.toggle('active', view.you.id === playerId);
    button.disabled = !hasToken || view.you.id === playerId;
  });
}

function renderRoomActions(view) {
  const isInRoom = Boolean(view?.you);
  els.roomActions.classList.toggle('hidden', !isInRoom);
  els.leaveRoom.disabled = !isInRoom;
}

function playerName() {
  return els.playerName.value.trim() || '플레이어';
}

function showOnly(section) {
  document.body.dataset.screen = section;
  for (const key of ['entry', 'lobby', 'coinToss', 'game', 'score']) {
    els[key].classList.toggle('hidden', key !== section);
  }
}

function showMessage(message) {
  els.message.textContent = message;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
