import { Card, cardsEqual, GameState, PlayerAction, PlayerState, RANK_VALUES } from './types.js';

/** True if `defendCard` legally beats `attackCard` given the trump suit. */
export function canBeat(attackCard: Card, defendCard: Card, trumpSuit: string): boolean {
  const attackIsTrump = attackCard.suit === trumpSuit;
  const defendIsTrump = defendCard.suit === trumpSuit;

  if (attackIsTrump && !defendIsTrump) return false;
  if (!attackIsTrump && defendIsTrump) return true; // any trump beats any non-trump
  if (attackCard.suit !== defendCard.suit) return false; // must follow suit unless trumping
  return RANK_VALUES[defendCard.rank] > RANK_VALUES[attackCard.rank];
}

export function getActivePlayers(state: GameState): PlayerState[] {
  return state.players.filter((p) => !p.isOut);
}

/** Next seat index (clockwise, wrapping) that is not `isOut`, starting the search after `from`. */
export function nextActiveSeat(state: GameState, from: number): number {
  const n = state.players.length;
  for (let step = 1; step <= n; step++) {
    const idx = (from + step) % n;
    if (!state.players[idx].isOut) return idx;
  }
  return from; // only reachable if every seat is out (game should already be over)
}

export function firstUndefendedSlotIndex(state: GameState): number {
  return state.table.findIndex((slot) => !slot.defend);
}

export function ranksOnTable(state: GameState): Set<string> {
  const ranks = new Set<string>();
  for (const slot of state.table) {
    ranks.add(slot.attack.rank);
    if (slot.defend) ranks.add(slot.defend.rank);
  }
  return ranks;
}

/** Cards that beat the earliest undefended slot, from a given hand. */
export function findValidDefends(state: GameState, hand: Card[]): Card[] {
  const slotIndex = firstUndefendedSlotIndex(state);
  if (slotIndex === -1) return [];
  const attackCard = state.table[slotIndex].attack;
  return hand.filter((card) => canBeat(attackCard, card, state.trumpSuit));
}

/** Cards from a hand that are legal to throw in right now (matching a rank already on the table). */
export function findValidThrowIns(state: GameState, hand: Card[], seatIndex: number): Card[] {
  if (state.table.length >= state.maxTableSlots) return [];
  const isOpening = state.table.length === 0;
  if (isOpening) {
    // Only the primary attacker may open the round, and with any card.
    return seatIndex === state.attackerIndex ? hand.slice() : [];
  }
  const ranks = ranksOnTable(state);
  return hand.filter((card) => ranks.has(card.rank));
}

/** Computes the legal actions for whichever seat is currently allowed to act, or an empty list. */
export function getLegalActions(state: GameState, seatIndex: number): PlayerAction[] {
  if (state.phase === 'gameOver' || state.actingSeat !== seatIndex) return [];
  const player = state.players[seatIndex];

  if (state.phase === 'awaitingDefense') {
    if (seatIndex !== state.defenderIndex) return [];
    const actions: PlayerAction[] = [{ type: 'take' }];
    for (const card of findValidDefends(state, player.hand)) {
      actions.push({ type: 'defend', card });
    }
    return actions;
  }

  // awaitingThrowIn
  const actions: PlayerAction[] = [];
  const isOpening = state.table.length === 0;
  for (const card of findValidThrowIns(state, player.hand, seatIndex)) {
    actions.push({ type: 'throw', card });
  }
  // The primary attacker cannot pass on an empty table — someone has to open the round.
  if (!isOpening) {
    actions.push({ type: 'pass' });
  }
  return actions;
}

export function isActionLegal(state: GameState, seatIndex: number, action: PlayerAction): boolean {
  const legal = getLegalActions(state, seatIndex);
  return legal.some((a) => {
    if (a.type !== action.type) return false;
    if (a.type === 'throw' && action.type === 'throw') return cardsEqual(a.card, action.card);
    if (a.type === 'defend' && action.type === 'defend') return cardsEqual(a.card, action.card);
    return true;
  });
}

export function removeCardFromHand(hand: Card[], card: Card): Card[] {
  const idx = hand.findIndex((c) => cardsEqual(c, card));
  if (idx === -1) throw new Error(`Card ${card.rank}${card.suit} not found in hand`);
  return [...hand.slice(0, idx), ...hand.slice(idx + 1)];
}
