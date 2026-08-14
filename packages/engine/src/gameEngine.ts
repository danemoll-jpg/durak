import { dealFreshDeck } from './deck.js';
import {
  findValidDefends,
  firstUndefendedSlotIndex,
  getActivePlayers,
  getLegalActions,
  isActionLegal,
  nextActiveSeat,
  removeCardFromHand,
} from './rules.js';
import {
  EngineConfig,
  GameState,
  LegalActions,
  PlayerAction,
  PlayerState,
  RANK_VALUES,
  RoundOutcome,
  Suit,
} from './types.js';

const MAX_HAND = 6;

function findFirstAttacker(players: PlayerState[], trumpSuit: Suit): number {
  let bestSeat = 0;
  let bestValue = Infinity;
  players.forEach((p, i) => {
    for (const c of p.hand) {
      if (c.suit === trumpSuit && RANK_VALUES[c.rank] < bestValue) {
        bestValue = RANK_VALUES[c.rank];
        bestSeat = i;
      }
    }
  });
  return bestValue === Infinity ? 0 : bestSeat;
}

export function createGame(config: EngineConfig): GameState {
  const rng = config.rng ?? Math.random;
  const { deck, trumpCard, trumpSuit } = dealFreshDeck(rng);

  const players: PlayerState[] = config.playerConfigs.map((pc) => ({
    id: pc.id,
    name: pc.name,
    isBot: pc.isBot,
    personality: pc.personality,
    hand: [],
    isOut: false,
  }));

  for (let i = 0; i < MAX_HAND; i++) {
    for (const p of players) {
      if (deck.length > 0) p.hand.push(deck.pop()!);
    }
  }

  const attackerIndex = findFirstAttacker(players, trumpSuit);
  const defenderIndex = nextActiveSeatRaw(players.length, attackerIndex);

  const state: GameState = {
    players,
    deck,
    trumpCard,
    trumpSuit,
    discardPile: [],
    table: [],
    attackerIndex,
    defenderIndex,
    throwInQueue: [attackerIndex],
    actingSeat: attackerIndex,
    phase: 'awaitingThrowIn',
    maxTableSlots: Math.min(MAX_HAND, players[defenderIndex].hand.length),
    roundNumber: 1,
    log: [],
    durak: null,
    isDraw: false,
  };

  state.log.push({ type: 'gameStarted', trumpCard, playerOrder: players.map((p) => p.id) });
  return state;
}

function nextActiveSeatRaw(playerCount: number, from: number): number {
  return (from + 1) % playerCount;
}

export function getCurrentLegalActions(state: GameState): LegalActions | null {
  if (state.actingSeat === null) return null;
  return { seatIndex: state.actingSeat, actions: getLegalActions(state, state.actingSeat) };
}

export function applyAction(state: GameState, seatIndex: number, action: PlayerAction): GameState {
  if (!isActionLegal(state, seatIndex, action)) {
    throw new Error(`Illegal action ${JSON.stringify(action)} for seat ${seatIndex} in phase ${state.phase}`);
  }
  const next: GameState = structuredClone(state);
  const player = next.players[seatIndex];

  switch (action.type) {
    case 'throw': {
      const wasOpening = next.table.length === 0;
      player.hand = removeCardFromHand(player.hand, action.card);
      next.table.push({ attack: action.card });
      next.log.push({ type: 'cardThrown', by: player.id, card: action.card, isOpening: wasOpening });
      next.phase = 'awaitingDefense';
      next.actingSeat = next.defenderIndex;
      next.throwInQueue = [];
      break;
    }
    case 'pass': {
      next.log.push({ type: 'playerPassed', by: player.id });
      next.throwInQueue = next.throwInQueue.filter((s) => s !== seatIndex);
      advanceThrowInQueueOrResolve(next);
      break;
    }
    case 'defend': {
      const slotIndex = firstUndefendedSlotIndex(next);
      const attackCard = next.table[slotIndex].attack;
      player.hand = removeCardFromHand(player.hand, action.card);
      next.table[slotIndex].defend = action.card;
      next.log.push({ type: 'cardDefended', by: player.id, attackCard, defendCard: action.card });
      openThrowInLap(next);
      break;
    }
    case 'take': {
      const cardCount = next.table.reduce((n, slot) => n + 1 + (slot.defend ? 1 : 0), 0);
      for (const slot of next.table) {
        player.hand.push(slot.attack);
        if (slot.defend) player.hand.push(slot.defend);
      }
      next.log.push({ type: 'playerTook', by: player.id, cardCount });
      resolveRound(next, 'taken');
      break;
    }
  }

  return next;
}

function openThrowInLap(state: GameState): void {
  if (state.table.length >= state.maxTableSlots) {
    resolveRound(state, 'defended');
    return;
  }
  const active = state.players.map((_, i) => i).filter((i) => !state.players[i].isOut);
  const startPos = active.indexOf(state.defenderIndex);
  const queue = [...active.slice(startPos + 1), ...active.slice(0, startPos)];
  state.throwInQueue = queue;
  advanceThrowInQueueOrResolve(state);
}

function advanceThrowInQueueOrResolve(state: GameState): void {
  if (state.throwInQueue.length === 0) {
    resolveRound(state, 'defended');
    return;
  }
  state.phase = 'awaitingThrowIn';
  state.actingSeat = state.throwInQueue[0];
}

function buildDrawOrder(state: GameState, attackerIdx: number, defenderIdx: number): number[] {
  const active = state.players.map((_, i) => i).filter((i) => !state.players[i].isOut);
  const startPos = active.indexOf(attackerIdx);
  const rotated = startPos === -1 ? active : [...active.slice(startPos), ...active.slice(0, startPos)];
  const withoutDefender = rotated.filter((i) => i !== defenderIdx);
  return active.includes(defenderIdx) ? [...withoutDefender, defenderIdx] : withoutDefender;
}

function markFinishedPlayers(state: GameState): void {
  if (state.deck.length > 0) return;
  let place = state.players.filter((p) => p.isOut).length;
  for (const p of state.players) {
    if (!p.isOut && p.hand.length === 0) {
      p.isOut = true;
      p.finishPlace = place;
      state.log.push({ type: 'playerFinished', playerId: p.id, place });
      place += 1;
    }
  }
}

function finishGame(state: GameState, durakId: string | null): void {
  state.phase = 'gameOver';
  state.actingSeat = null;
  state.durak = durakId;
  state.isDraw = durakId === null;
  state.log.push({ type: 'gameOver', durak: durakId });
}

function resolveRound(state: GameState, outcome: RoundOutcome): void {
  const oldAttackerIndex = state.attackerIndex;
  const oldDefenderIndex = state.defenderIndex;
  const oldAttackerId = state.players[oldAttackerIndex].id;
  const oldDefenderId = state.players[oldDefenderIndex].id;

  if (outcome === 'defended') {
    for (const slot of state.table) {
      state.discardPile.push(slot.attack);
      if (slot.defend) state.discardPile.push(slot.defend);
    }
  }
  state.table = [];
  state.throwInQueue = [];

  const deckWasNonEmpty = state.deck.length > 0;
  const drawOrder = buildDrawOrder(state, oldAttackerIndex, oldDefenderIndex);
  for (const seatIdx of drawOrder) {
    const p = state.players[seatIdx];
    while (p.hand.length < MAX_HAND && state.deck.length > 0) {
      p.hand.push(state.deck.pop()!);
    }
  }
  if (deckWasNonEmpty && state.deck.length === 0) {
    state.log.push({ type: 'deckEmpty' });
  }

  markFinishedPlayers(state);

  let newAttackerIndex = outcome === 'defended' ? oldDefenderIndex : nextActiveSeat(state, oldDefenderIndex);
  if (state.players[newAttackerIndex].isOut) {
    newAttackerIndex = nextActiveSeat(state, newAttackerIndex);
  }
  const newDefenderIndex = nextActiveSeat(state, newAttackerIndex);

  const active = getActivePlayers(state);
  if (active.length <= 1) {
    finishGame(state, active[0]?.id ?? null);
    state.log.push({
      type: 'roundResolved',
      outcome,
      attacker: oldAttackerId,
      defender: oldDefenderId,
      newAttacker: active[0]?.id ?? '',
      newDefender: '',
    });
    return;
  }

  state.attackerIndex = newAttackerIndex;
  state.defenderIndex = newDefenderIndex;
  state.roundNumber += 1;
  state.maxTableSlots = Math.min(MAX_HAND, state.players[newDefenderIndex].hand.length);
  state.phase = 'awaitingThrowIn';
  state.actingSeat = newAttackerIndex;
  state.throwInQueue = [newAttackerIndex];

  state.log.push({
    type: 'roundResolved',
    outcome,
    attacker: oldAttackerId,
    defender: oldDefenderId,
    newAttacker: state.players[newAttackerIndex].id,
    newDefender: state.players[newDefenderIndex].id,
  });
}

export { findValidDefends };
