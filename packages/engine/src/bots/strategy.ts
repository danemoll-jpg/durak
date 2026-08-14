import { getLegalActions } from '../rules.js';
import { Card, GameState, PlayerAction, RANK_VALUES } from '../types.js';

/**
 * Heuristic move scorer shared by the bots and the human hint generator, so a
 * hint always matches what a competent bot would actually do — and a bot
 * never has access to information or moves the rules engine wouldn't allow.
 */
export interface ScoredAction {
  action: PlayerAction;
  score: number;
  reason: ReasonTag;
}

/** Machine-readable reason tags — hints.ts turns these into plain-English rationale. */
export type ReasonTag =
  | 'lowestSafeCard'
  | 'onlyOption'
  | 'cheapestBeat'
  | 'forcedTrumpBeat'
  | 'noValidBeatMustTake'
  | 'takeToPreserveTrumps'
  | 'dumpDuplicateRank'
  | 'openingLead'
  | 'passNothingUseful'
  | 'lastCard';

function isTrump(card: Card, trumpSuit: string): boolean {
  return card.suit === trumpSuit;
}

function countRank(hand: Card[], rank: string): number {
  return hand.filter((c) => c.rank === rank).length;
}

/** Scores every legal action for `seatIndex` and returns them best-first. */
export function scoreActions(state: GameState, seatIndex: number): ScoredAction[] {
  const actions = getLegalActions(state, seatIndex);
  const hand = state.players[seatIndex].hand;
  const trumpSuit = state.trumpSuit;
  const deckEmpty = state.deck.length === 0;

  // Whether a card is genuinely "the cheap, low-value choice" only makes sense relative to
  // alternatives — with a single legal card of a given type, there's no real choice being
  // made at all, so that gets its own honest "onlyOption" reason instead of implying a
  // deliberate low-value pick (e.g. throwing your only Ace because it's the only legal rank
  // to add isn't "safe and cheap", it's just forced).
  const throwCount = actions.filter((a) => a.type === 'throw').length;
  const defendCount = actions.filter((a) => a.type === 'defend').length;

  const scored: ScoredAction[] = actions.map((action) => {
    if (action.type === 'pass') {
      return { action, score: 1, reason: 'passNothingUseful' };
    }

    if (action.type === 'take') {
      // Taking is only ever offered as an option alongside real defends, or alone.
      const hasDefendOption = actions.some((a) => a.type === 'defend');
      return { action, score: hasDefendOption ? -5 : 50, reason: hasDefendOption ? 'takeToPreserveTrumps' : 'noValidBeatMustTake' };
    }

    if (action.type === 'defend') {
      const card = action.card;
      let score = 100 - RANK_VALUES[card.rank]; // prefer cheapest card
      let reason: ReasonTag = 'cheapestBeat';
      if (isTrump(card, trumpSuit)) {
        score -= 40; // strongly prefer not to burn trumps defending
        reason = 'forcedTrumpBeat';
      }
      if (defendCount === 1) reason = 'onlyOption';
      if (hand.length === 1) reason = 'lastCard';
      return { action, score, reason };
    }

    // throw
    const card = action.card;
    let score = 100 - RANK_VALUES[card.rank]; // low cards first
    let reason: ReasonTag = 'lowestSafeCard';
    if (isTrump(card, trumpSuit)) {
      score -= 60; // hold trumps back
      reason = 'forcedTrumpBeat';
    }
    if (countRank(hand, card.rank) >= 2) {
      score += 8; // thin out duplicate ranks — keeps future throw-ins flexible
      reason = 'dumpDuplicateRank';
    }
    if (state.table.length === 0) {
      reason = 'openingLead';
    }
    // Late game (deck empty): hoard trumps even harder, prefer emptying hand of junk.
    if (deckEmpty && isTrump(card, trumpSuit)) {
      score -= 20;
    }
    if (throwCount === 1) reason = 'onlyOption';
    if (hand.length === 1) reason = 'lastCard';
    return { action, score, reason };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export function chooseBestAction(state: GameState, seatIndex: number): ScoredAction | null {
  const scored = scoreActions(state, seatIndex);
  return scored[0] ?? null;
}
