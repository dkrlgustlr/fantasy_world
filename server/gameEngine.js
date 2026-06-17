export function createGameStore(cards = [], options = {}) {
  const rooms = new Map();
  const shuffle = options.shuffle === false ? (deck) => deck : shuffleDeck;
  const random = options.random || Math.random;
  const coinDurationMs = Number(options.coinDurationMs || 1800);

  return {
    createRoom(playerName) {
      const code = createRoomCode(rooms);
      const room = {
        code,
        players: [
          {
            id: 'p1',
            name: playerName || 'Player 1',
            token: createToken()
          }
        ],
        deck: shuffle(cards.map((card) => ({ ...card }))),
        discardPile: [],
        phase: 'waiting',
        currentPlayerId: null,
        coinToss: null,
        drawnThisTurn: false,
        scores: {}
      };
      rooms.set(code, room);
      return {
        ...publicRoomSummary(room),
        playerToken: room.players[0].token
      };
    },

    joinRoom(code, playerName) {
      const room = requireRoom(rooms, code);
      if (room.players.length >= 2) {
        throw new Error('방이 가득 찼습니다.');
      }
      const player = {
        id: `p${room.players.length + 1}`,
        name: playerName || `Player ${room.players.length + 1}`,
        token: createToken()
      };
      room.players.push(player);
      return {
        ...publicRoomSummary(room),
        playerToken: player.token
      };
    },

    createSoloTestRoom(playerName) {
      const firstPlayerName = playerName || '테스터';
      const code = createRoomCode(rooms);
      const room = {
        code,
        players: [
          {
            id: 'p1',
            name: firstPlayerName,
            token: createToken()
          },
          {
            id: 'p2',
            name: `${firstPlayerName} 2P`,
            token: createToken()
          }
        ],
        deck: shuffle(cards.map((card) => ({ ...card }))),
        discardPile: [],
        phase: 'playing',
        currentPlayerId: 'p1',
        coinToss: null,
        drawnThisTurn: false,
        scores: {}
      };
      for (const player of room.players) {
        player.hand = room.deck.splice(0, 7);
      }
      rooms.set(code, room);
      return {
        ...publicRoomSummary(room),
        playerTokens: {
          p1: room.players[0].token,
          p2: room.players[1].token
        }
      };
    },

    getView(code, playerToken) {
      const room = requireRoom(rooms, code);
      const player = requirePlayer(room, playerToken);
      return playerView(room, player);
    },

    startGame(code, playerToken) {
      const room = requireRoom(rooms, code);
      const player = requirePlayer(room, playerToken);
      if (room.players.length !== 2) {
        throw new Error('두 명이 모여야 시작할 수 있습니다.');
      }
      if (room.phase !== 'waiting') {
        throw new Error('이미 시작한 게임입니다.');
      }
      for (const player of room.players) {
        player.hand = room.deck.splice(0, 7);
      }
      room.phase = 'flipping';
      room.currentPlayerId = null;
      room.coinToss = createCoinToss(room, random, coinDurationMs);
      room.drawnThisTurn = false;
      return playerView(room, player);
    },

    finishCoinToss(code, playerToken) {
      const room = requireRoom(rooms, code);
      const player = requirePlayer(room, playerToken);
      finishCoinTossRoom(room);
      return playerView(room, player);
    },

    restartGame(code, playerToken) {
      const room = requireRoom(rooms, code);
      const player = requirePlayer(room, playerToken);
      if (room.phase !== 'ended') {
        throw new Error('게임 종료 후 다시 시작할 수 있습니다.');
      }
      room.deck = shuffle(cards.map((card) => ({ ...card })));
      room.discardPile = [];
      room.scores = {};
      room.phase = 'flipping';
      room.currentPlayerId = null;
      room.coinToss = createCoinToss(room, random, coinDurationMs);
      room.drawnThisTurn = false;
      for (const roomPlayer of room.players) {
        roomPlayer.hand = room.deck.splice(0, 7);
      }
      return playerView(room, player);
    },

    leaveRoom(code, playerToken) {
      const room = requireRoom(rooms, code);
      requirePlayer(room, playerToken);
      removePlayerFromRoom(room, playerToken);
      if (room.players.length === 0) {
        rooms.delete(room.code);
        return { left: true, code: room.code, deleted: true };
      }
      resetRoomToLobby(room, cards, shuffle);
      return { left: true, code: room.code, deleted: false };
    },

    endGame(code, playerToken) {
      const room = requireRoom(rooms, code);
      const player = requirePlayer(room, playerToken);
      endGameRoom(room);
      return playerView(room, player);
    },

    drawFromDeck(code, playerToken) {
      const room = requireRoom(rooms, code);
      const player = requireTurnPlayer(room, playerToken);
      requireCanDraw(room);
      const card = room.deck.shift();
      if (!card) {
        throw new Error('덱에 카드가 없습니다.');
      }
      player.hand.push(card);
      room.drawnThisTurn = true;
      return playerView(room, player);
    },

    drawFromDiscard(code, playerToken, cardId) {
      const room = requireRoom(rooms, code);
      const player = requireTurnPlayer(room, playerToken);
      requireCanDraw(room);
      const cardIndex = room.discardPile.findIndex((card) => card.id === cardId);
      if (cardIndex === -1) {
        throw new Error('버린 카드 영역에 없는 카드입니다.');
      }
      const [card] = room.discardPile.splice(cardIndex, 1);
      player.hand.push(card);
      room.drawnThisTurn = true;
      return playerView(room, player);
    },

    discardCard(code, playerToken, cardId) {
      const room = requireRoom(rooms, code);
      const player = requireTurnPlayer(room, playerToken);
      if (!room.drawnThisTurn) {
        throw new Error('카드를 먼저 가져와야 합니다.');
      }
      const cardIndex = player.hand.findIndex((card) => card.id === cardId);
      if (cardIndex === -1) {
        throw new Error('손패에 없는 카드입니다.');
      }
      const [card] = player.hand.splice(cardIndex, 1);
      room.discardPile.push(card);
      room.drawnThisTurn = false;
      room.currentPlayerId = nextPlayerId(room, player.id);
      if (room.discardPile.length >= 10) {
        room.phase = 'ended';
      }
      return playerView(room, player);
    },

    submitScore(code, playerToken, rows) {
      const room = requireRoom(rooms, code);
      const player = requirePlayer(room, playerToken);
      if (room.phase !== 'ended') {
        throw new Error('게임 종료 후 점수를 입력할 수 있습니다.');
      }
      room.scores[player.id] = normalizeScoreRows(rows);
      return {
        ...playerView(room, player),
        winner: getWinner(room)
      };
    }
  };
}

export function createPersistentGameStore(cards = [], options = {}) {
  const repository = options.repository;
  if (!repository) {
    throw new Error('A room repository is required for persistent game storage.');
  }
  const shuffle = options.shuffle === false ? (deck) => deck : shuffleDeck;
  const random = options.random || Math.random;
  const coinDurationMs = Number(options.coinDurationMs || 1800);
  const locks = new Map();

  return {
    async createRoom(playerName) {
      const code = await createRoomCodeAsync(repository);
      const room = {
        code,
        players: [
          {
            id: 'p1',
            name: playerName || 'Player 1',
            token: createToken()
          }
        ],
        deck: shuffle(cards.map((card) => ({ ...card }))),
        discardPile: [],
        phase: 'waiting',
        currentPlayerId: null,
        coinToss: null,
        drawnThisTurn: false,
        scores: {}
      };
      await repository.saveRoom(room);
      return {
        ...publicRoomSummary(room),
        playerToken: room.players[0].token
      };
    },

    async joinRoom(code, playerName) {
      return mutateRoom(repository, locks, code, (room) => {
        if (room.players.length >= 2) {
          throw new Error('방이 가득 찼습니다.');
        }
        const player = {
          id: `p${room.players.length + 1}`,
          name: playerName || `Player ${room.players.length + 1}`,
          token: createToken()
        };
        room.players.push(player);
        return {
          ...publicRoomSummary(room),
          playerToken: player.token
        };
      });
    },

    async createSoloTestRoom(playerName) {
      const firstPlayerName = playerName || '테스트';
      const code = await createRoomCodeAsync(repository);
      const room = {
        code,
        players: [
          {
            id: 'p1',
            name: firstPlayerName,
            token: createToken()
          },
          {
            id: 'p2',
            name: `${firstPlayerName} 2P`,
            token: createToken()
          }
        ],
        deck: shuffle(cards.map((card) => ({ ...card }))),
        discardPile: [],
        phase: 'playing',
        currentPlayerId: 'p1',
        coinToss: null,
        drawnThisTurn: false,
        scores: {}
      };
      for (const player of room.players) {
        player.hand = room.deck.splice(0, 7);
      }
      await repository.saveRoom(room);
      return {
        ...publicRoomSummary(room),
        playerTokens: {
          p1: room.players[0].token,
          p2: room.players[1].token
        }
      };
    },

    async getView(code, playerToken) {
      const room = await loadRoom(repository, code);
      const player = requirePlayer(room, playerToken);
      return playerView(room, player);
    },

    async startGame(code, playerToken) {
      return mutateRoom(repository, locks, code, (room) => {
        const player = requirePlayer(room, playerToken);
        if (room.players.length !== 2) {
          throw new Error('두 명이 모여야 시작할 수 있습니다.');
        }
        if (room.phase !== 'waiting') {
          throw new Error('이미 시작한 게임입니다.');
        }
        for (const roomPlayer of room.players) {
          roomPlayer.hand = room.deck.splice(0, 7);
        }
        room.phase = 'flipping';
        room.currentPlayerId = null;
        room.coinToss = createCoinToss(room, random, coinDurationMs);
        room.drawnThisTurn = false;
        return playerView(room, player);
      });
    },

    async finishCoinToss(code, playerToken) {
      return mutateRoom(repository, locks, code, (room) => {
        const player = requirePlayer(room, playerToken);
        finishCoinTossRoom(room);
        return playerView(room, player);
      });
    },

    async restartGame(code, playerToken) {
      return mutateRoom(repository, locks, code, (room) => {
        const player = requirePlayer(room, playerToken);
        if (room.phase !== 'ended') {
          throw new Error('게임 종료 후 다시 시작할 수 있습니다.');
        }
        room.deck = shuffle(cards.map((card) => ({ ...card })));
        room.discardPile = [];
        room.scores = {};
        room.phase = 'flipping';
        room.currentPlayerId = null;
        room.coinToss = createCoinToss(room, random, coinDurationMs);
        room.drawnThisTurn = false;
        for (const roomPlayer of room.players) {
          roomPlayer.hand = room.deck.splice(0, 7);
        }
        return playerView(room, player);
      });
    },

    async leaveRoom(code, playerToken) {
      const normalizedCode = String(code || '').toUpperCase();
      return withRoomLock(locks, normalizedCode, async () => {
        const room = await loadRoom(repository, normalizedCode);
        requirePlayer(room, playerToken);
        removePlayerFromRoom(room, playerToken);
        if (room.players.length === 0) {
          await repository.deleteRoom(normalizedCode);
          return { left: true, code: normalizedCode, deleted: true };
        }
        resetRoomToLobby(room, cards, shuffle);
        await repository.saveRoom(room);
        return { left: true, code: normalizedCode, deleted: false };
      });
    },

    async endGame(code, playerToken) {
      return mutateRoom(repository, locks, code, (room) => {
        const player = requirePlayer(room, playerToken);
        endGameRoom(room);
        return playerView(room, player);
      });
    },

    async drawFromDeck(code, playerToken) {
      return mutateRoom(repository, locks, code, (room) => {
        const player = requireTurnPlayer(room, playerToken);
        requireCanDraw(room);
        const card = room.deck.shift();
        if (!card) {
          throw new Error('덱에 카드가 없습니다.');
        }
        player.hand.push(card);
        room.drawnThisTurn = true;
        return playerView(room, player);
      });
    },

    async drawFromDiscard(code, playerToken, cardId) {
      return mutateRoom(repository, locks, code, (room) => {
        const player = requireTurnPlayer(room, playerToken);
        requireCanDraw(room);
        const cardIndex = room.discardPile.findIndex((card) => card.id === cardId);
        if (cardIndex === -1) {
          throw new Error('버린 카드 영역에 없는 카드입니다.');
        }
        const [card] = room.discardPile.splice(cardIndex, 1);
        player.hand.push(card);
        room.drawnThisTurn = true;
        return playerView(room, player);
      });
    },

    async discardCard(code, playerToken, cardId) {
      return mutateRoom(repository, locks, code, (room) => {
        const player = requireTurnPlayer(room, playerToken);
        if (!room.drawnThisTurn) {
          throw new Error('카드를 먼저 가져와야 합니다.');
        }
        const cardIndex = player.hand.findIndex((card) => card.id === cardId);
        if (cardIndex === -1) {
          throw new Error('손패에 없는 카드입니다.');
        }
        const [card] = player.hand.splice(cardIndex, 1);
        room.discardPile.push(card);
        room.drawnThisTurn = false;
        room.currentPlayerId = nextPlayerId(room, player.id);
        if (room.discardPile.length >= 10) {
          room.phase = 'ended';
        }
        return playerView(room, player);
      });
    },

    async submitScore(code, playerToken, rows) {
      return mutateRoom(repository, locks, code, (room) => {
        const player = requirePlayer(room, playerToken);
        if (room.phase !== 'ended') {
          throw new Error('게임 종료 후 점수를 입력할 수 있습니다.');
        }
        room.scores[player.id] = normalizeScoreRows(rows);
        return {
          ...playerView(room, player),
          winner: getWinner(room)
        };
      });
    }
  };
}

function playerView(room, player) {
  return {
    code: room.code,
    phase: room.phase,
    deckCount: room.deck.length,
    discardPile: [...room.discardPile],
    currentPlayerId: room.currentPlayerId,
    coinToss: publicCoinToss(room),
    drawnThisTurn: room.drawnThisTurn,
    you: {
      id: player.id,
      name: player.name,
      hand: player.hand ? [...player.hand] : []
    },
    players: room.players.map((roomPlayer) => ({
      id: roomPlayer.id,
      name: roomPlayer.name,
      handCount: roomPlayer.hand ? roomPlayer.hand.length : 0,
      isYou: roomPlayer.id === player.id
    })),
    scores: room.scores
  };
}

function publicRoomSummary(room) {
  return {
    code: room.code,
    phase: room.phase,
    deckCount: room.deck.length,
    discardCount: room.discardPile.length,
    currentPlayerId: room.currentPlayerId,
    coinToss: publicCoinToss(room),
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name
    }))
  };
}

function createCoinToss(room, random, durationMs) {
  const winnerIndex = Math.floor(random() * room.players.length);
  const winner = room.players[Math.min(winnerIndex, room.players.length - 1)] || room.players[0];
  const startedAt = Date.now();
  return {
    startedAt,
    revealAt: startedAt + durationMs,
    durationMs,
    winnerPlayerId: winner.id
  };
}

function finishCoinTossRoom(room) {
  if (room.phase === 'playing') {
    return;
  }
  if (room.phase !== 'flipping') {
    throw new Error('선 정하기 중인 게임이 아닙니다.');
  }
  room.phase = 'playing';
  room.currentPlayerId = room.coinToss?.winnerPlayerId || room.players[0]?.id || null;
  room.drawnThisTurn = false;
}

function endGameRoom(room) {
  if (room.phase === 'ended') {
    return;
  }
  if (room.phase !== 'playing') {
    throw new Error('진행 중인 게임만 종료할 수 있습니다.');
  }
  room.phase = 'ended';
  room.currentPlayerId = null;
  room.drawnThisTurn = false;
}

function removePlayerFromRoom(room, playerToken) {
  room.players = room.players.filter((player) => player.token !== playerToken);
}

function resetRoomToLobby(room, cards, shuffle) {
  room.players = room.players.map((player, index) => ({
    id: `p${index + 1}`,
    name: player.name,
    token: player.token
  }));
  room.deck = shuffle(cards.map((card) => ({ ...card })));
  room.discardPile = [];
  room.phase = 'waiting';
  room.currentPlayerId = null;
  room.coinToss = null;
  room.drawnThisTurn = false;
  room.scores = {};
}

function publicCoinToss(room) {
  if (!room.coinToss) {
    return null;
  }
  const winner = room.players.find((player) => player.id === room.coinToss.winnerPlayerId);
  return {
    ...room.coinToss,
    winnerName: winner?.name || ''
  };
}

function requireRoom(rooms, code) {
  const room = rooms.get(String(code || '').toUpperCase());
  if (!room) {
    throw new Error('방을 찾을 수 없습니다.');
  }
  return room;
}

async function loadRoom(repository, code) {
  const room = await repository.getRoom(String(code || '').toUpperCase());
  if (!room) {
    throw new Error('방을 찾을 수 없습니다.');
  }
  return room;
}

async function mutateRoom(repository, locks, code, mutator) {
  const normalizedCode = String(code || '').toUpperCase();
  return withRoomLock(locks, normalizedCode, async () => {
    const room = await loadRoom(repository, normalizedCode);
    const result = mutator(room);
    await repository.saveRoom(room);
    return result;
  });
}

async function withRoomLock(locks, code, task) {
  const previous = locks.get(code) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  const queue = previous.catch(() => {}).then(() => current);
  locks.set(code, queue);
  await previous.catch(() => {});
  try {
    return await task();
  } finally {
    release();
    if (locks.get(code) === queue) {
      locks.delete(code);
    }
  }
}

function requirePlayer(room, playerToken) {
  const player = room.players.find((candidate) => candidate.token === playerToken);
  if (!player) {
    throw new Error('플레이어를 찾을 수 없습니다.');
  }
  return player;
}

function requireTurnPlayer(room, playerToken) {
  if (room.phase !== 'playing') {
    throw new Error('진행 중인 게임이 아닙니다.');
  }
  const player = requirePlayer(room, playerToken);
  if (player.id !== room.currentPlayerId) {
    throw new Error('현재 턴이 아닙니다.');
  }
  return player;
}

function requireCanDraw(room) {
  if (room.drawnThisTurn) {
    throw new Error('이미 카드를 가져왔습니다.');
  }
}

function nextPlayerId(room, currentPlayerId) {
  const currentIndex = room.players.findIndex((player) => player.id === currentPlayerId);
  return room.players[(currentIndex + 1) % room.players.length].id;
}

function normalizeScoreRows(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const normalizedRows = safeRows.map((row) => {
    const base = Number(row.base || 0);
    const bonusPenalty = Number(row.bonusPenalty || 0);
    return {
      cardId: String(row.cardId || ''),
      base,
      bonusPenalty,
      total: base + bonusPenalty
    };
  });
  return {
    rows: normalizedRows,
    total: normalizedRows.reduce((sum, row) => sum + row.total, 0)
  };
}

function getWinner(room) {
  if (room.players.some((player) => !room.scores[player.id])) {
    return null;
  }
  const ranked = room.players
    .map((player) => ({
      playerId: player.id,
      name: player.name,
      total: room.scores[player.id].total
    }))
    .sort((a, b) => b.total - a.total);
  if (ranked[0].total === ranked[1].total) {
    return { playerId: null, name: '무승부', total: ranked[0].total };
  }
  return ranked[0];
}

function createRoomCode(rooms) {
  let code = '';
  do {
    code = Math.random().toString(36).slice(2, 8).toUpperCase();
  } while (rooms.has(code));
  return code;
}

async function createRoomCodeAsync(repository) {
  let code = '';
  do {
    code = Math.random().toString(36).slice(2, 8).toUpperCase();
  } while (await repository.hasRoom(code));
  return code;
}

function createToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
