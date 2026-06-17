import { renderCardDetail } from './cardDetail.js';
import { renderCard as renderStructuredCard } from './cardView.js';
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
  testControls: document.querySelector('#testControls'),
  seatP1: document.querySelector('#seatP1'),
  seatP2: document.querySelector('#seatP2'),
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
  endGame: document.querySelector('#endGame'),
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
  submitScore: document.querySelector('#submitScore'),
  restartGame: document.querySelector('#restartGame'),
  scoreStatus: document.querySelector('#scoreStatus'),
  scoreSummary: document.querySelector('#scoreSummary'),
  cardOverlay: document.querySelector('#cardOverlay'),
  cardOverlayBody: document.querySelector('#cardOverlayBody'),
  closeCardOverlay: document.querySelector('#closeCardOverlay'),
  message: document.querySelector('#message')
};

let state = {
  code: localStorage.getItem('fw:code') || '',
  playerToken: localStorage.getItem('fw:token') || '',
  testTokens: readSavedTestTokens(),
  selectedCardId: '',
  view: null,
  events: null,
  coinRevealTimer: null,
  coinFinishTimer: null
};

const cardSounds = createCardSoundEffects();

els.createRoom.addEventListener('click', createRoom);
els.joinRoom.addEventListener('click', joinRoom);
els.soloTest.addEventListener('click', startSoloTest);
els.seatP1.addEventListener('click', () => switchTestSeat('p1'));
els.seatP2.addEventListener('click', () => switchTestSeat('p2'));
els.startGame.addEventListener('click', () => postAction('start'));
els.drawDeck.addEventListener('click', () => postAction('draw-deck'));
els.endGame.addEventListener('click', () => postAction('end'));
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
els.submitScore.addEventListener('click', submitScore);
els.restartGame.addEventListener('click', () => postAction('restart'));
els.closeCardOverlay.addEventListener('click', closeCardDetail);
els.cardOverlay.addEventListener('click', (event) => {
  if (event.target.dataset.closeCardDetail !== undefined) {
    closeCardDetail();
  }
});
setupUserAudioUnlock();
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeCardDetail();
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
    body: { name: playerName() }
  });
  setTestTokens(result.playerTokens);
  setSession(result.code, result.playerTokens.p1);
  connectEvents();
  await refreshView();
  showMessage('혼자 테스트 모드입니다. 위에서 1P/2P를 바꿔가며 확인하세요.');
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
    .map((player) => `<div class="player-row"><span>${escapeHtml(player.name)}</span><strong>${player.isYou ? '나' : '상대'}</strong></div>`)
    .join('');
  els.startGame.disabled = view.players.length !== 2;
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
  els.endGame.disabled = view.phase !== 'playing';
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
  const opponent = view.players.find((player) => !player.isYou);
  els.opponentInfo.textContent = opponent ? `${opponent.name}: ${opponent.handCount}장` : '-';
  renderOpponentHand(opponent);
  bindCardButtons();
  renderSelectedCardActions(view, isMyTurn);
  renderScore(view);
}

function renderOpponentHand(opponent) {
  if (!els.opponentHand) return;
  const handCount = opponent?.handCount || 0;
  els.opponentHand.innerHTML = Array.from({ length: handCount }, (_, index) => `
    <span class="opponent-card-back" aria-hidden="true" style="--card-index: ${index}"></span>
  `).join('');
}

function renderScore(view) {
  const handKey = view.you.hand.map((card) => card.id).join('|');
  if (els.scoreRows.dataset.playerId !== view.you.id || els.scoreRows.dataset.handKey !== handKey) {
    els.scoreRows.innerHTML = view.you.hand.map((card) => {
      const imageId = encodeURIComponent(card.id);
      return `
        <div class="score-row" data-card-id="${card.id}">
          <button class="score-card-preview" type="button" data-score-card-detail="${escapeHtml(card.id)}" aria-label="${escapeHtml(card.name)} 자세히 보기">
            <img class="score-card-image" src="${scoreCardImageSrc(card)}" data-fallback-src="/assets/cards/generated/${imageId}.png" alt="${escapeHtml(card.name)}" loading="lazy">
          </button>
          <div class="score-card-fields">
            <strong>${escapeHtml(card.name)}</strong>
            <label>기본 힘<input type="number" class="base" value="${card.base}"></label>
            <label>보너스/페널티<input type="number" class="bonus" value="0"></label>
          </div>
        </div>
      `;
    }).join('');
    bindImageFallbacks(els.scoreRows);
    els.scoreRows.dataset.playerId = view.you.id;
    els.scoreRows.dataset.handKey = handKey;
  }
  renderSpecialChoices(view);
  const score = view.scores?.[view.you.id];
  els.scoreStatus.textContent = score ? `내 제출 점수: ${score.total}` : '카드별 보너스/페널티를 직접 입력하세요.';
  const entries = Object.entries(view.scores || {});
  els.scoreSummary.innerHTML = entries.map(([playerId, result]) => {
    const player = view.players.find((candidate) => candidate.id === playerId);
    return `<div>${escapeHtml(player?.name || playerId)}: ${result.total}점</div>`;
  }).join('');
}

function scoreCardImageSrc(card) {
  const imageId = encodeURIComponent(card.id);
  return `/assets/cards/full/${imageId}.png`;
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
  return `
    <article class="special-choice">
      <strong>${escapeHtml(choice.name)}</strong>
      <p>${escapeHtml(choice.prompt)}</p>
      <small>후보: ${escapeHtml(targetText)}</small>
    </article>
  `;
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
  els.seatP1.classList.toggle('active', view.you.id === 'p1');
  els.seatP2.classList.toggle('active', view.you.id === 'p2');
  els.seatP1.disabled = view.you.id === 'p1';
  els.seatP2.disabled = view.you.id === 'p2';
}

function renderRoomActions(view) {
  const isInRoom = Boolean(view?.you);
  els.roomActions.classList.toggle('hidden', !isInRoom);
  els.endGame.hidden = !isInRoom || view.phase !== 'playing';
  els.endGame.disabled = !isInRoom || view.phase !== 'playing';
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
