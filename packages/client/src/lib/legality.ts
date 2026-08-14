// Lightweight client-side "can I play this card right now?" checks, used only for
// highlighting/disabling cards in the UI. The server is still the sole source of truth —
// it re-validates every action via @durak/engine's rules before applying it — so nothing
// here needs to be exhaustively airtight, just a good-faith mirror of the real rules.
import { Card, canBeat, PublicGameState } from '@durak/engine';

function ranksOnTable(state: PublicGameState): Set<string> {
  const ranks = new Set<string>();
  for (const slot of state.table) {
    ranks.add(slot.attack.rank);
    if (slot.defend) ranks.add(slot.defend.rank);
  }
  return ranks;
}

export function isMyTurn(state: PublicGameState): boolean {
  return state.actingSeat !== null && state.actingSeat === state.viewerSeatIndex;
}

export function canThrowCard(state: PublicGameState, card: Card): boolean {
  if (state.phase !== 'awaitingThrowIn' || !isMyTurn(state)) return false;
  if (state.table.length >= state.maxTableSlots) return false;
  if (state.table.length === 0) return state.attackerIndex === state.viewerSeatIndex;
  return ranksOnTable(state).has(card.rank);
}

export function canDefendWith(state: PublicGameState, card: Card): boolean {
  if (state.phase !== 'awaitingDefense' || !isMyTurn(state)) return false;
  const slot = state.table.find((s) => !s.defend);
  if (!slot) return false;
  return canBeat(slot.attack, card, state.trumpSuit);
}

export function canPass(state: PublicGameState): boolean {
  return state.phase === 'awaitingThrowIn' && isMyTurn(state) && state.table.length > 0;
}

export function canTake(state: PublicGameState): boolean {
  return state.phase === 'awaitingDefense' && isMyTurn(state);
}
