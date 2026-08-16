import { getLegalActions } from '../rules.js';
import { Card, DefendAction, GameState, PlayerAction, RANK_VALUES, ThrowAction } from '../types.js';

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
  | 'passSaveTrump'
  | 'lastCard';

function isTrump(card: Card, trumpSuit: string): boolean {
  return card.suit === trumpSuit;
}

function countRank(hand: Card[], rank: string): number {
  return hand.filter((c) => c.rank === rank).length;
}

function isDefendAction(a: PlayerAction): a is DefendAction {
  return a.type === 'defend';
}

function isThrowAction(a: PlayerAction): a is ThrowAction {
  return a.type === 'throw';
}

/** Rough "how precious is this card to spend" — used to find the single cheapest card
 * among a set of candidates (e.g. which available defend, or throw-in, costs least). */
function cardCost(card: Card, trumpSuit: string): number {
  return RANK_VALUES[card.rank] + (isTrump(card, trumpSuit) ? 100 : 0);
}

function cheapest(cards: Card[], trumpSuit: string): Card | null {
  return cards.length === 0 ? null : cards.reduce((best, c) => (cardCost(c, trumpSuit) < cardCost(best, trumpSuit) ? c : best));
}

// A normal hand tops out at 6 (see gameEngine.ts's MAX_HAND, not imported here to avoid a
// cross-module coupling for one constant) — this is the backstop that keeps trump
// conservation from letting a player stall indefinitely by repeatedly choosing to take.
const STALL_GUARD_HAND_SIZE = 8;

/** Scores every legal action for `seatIndex` and returns them best-first. */
export function scoreActions(state: GameState, seatIndex: number): ScoredAction[] {
  const actions = getLegalActions(state, seatIndex);
  const hand = state.players[seatIndex].hand;
  const trumpSuit = state.trumpSuit;
  const deckEmpty = state.deck.length === 0;
  const myTrumpCount = hand.filter((c) => isTrump(c, trumpSuit)).length;

  // Whether a card is genuinely "the cheap, low-value choice" only makes sense relative to
  // alternatives — with a single legal card of a given type, there's no real choice being
  // made at all, so that gets its own honest "onlyOption" reason instead of implying a
  // deliberate low-value pick (e.g. throwing your only Ace because it's the only legal rank
  // to add isn't "safe and cheap", it's just forced).
  const throwCount = actions.filter((a) => a.type === 'throw').length;
  const defendCount = actions.filter((a) => a.type === 'defend').length;

  // What defending — or throwing in — would actually cost at best, so "take"/"pass" can be
  // judged against a real alternative instead of assumed to always be the worse choice.
  // Throwing in is always optional (unlike the mandatory opening lead), so bestThrowIn is
  // only considered once there's actually a table to add to.
  const bestDefend = cheapest(actions.filter(isDefendAction).map((a) => a.card), trumpSuit);
  const bestThrowIn = state.table.length > 0 ? cheapest(actions.filter(isThrowAction).map((a) => a.card), trumpSuit) : null;

  const scored: ScoredAction[] = actions.map((action) => {
    // Trump conservation only overrides the normal "defend/throw is best" logic in the
    // genuinely dire case: trumps are down to your last one or two AND the deck is empty,
    // so there's no more coming — burning your last trump here means you have no way to
    // beat a trump attack for the rest of the game. Outside that narrow case, spending a
    // trump (or throwing one in) to keep a round moving is still normal, healthy play —
    // this was deliberately kept narrow (and capped by hand size below) after broader
    // versions of this rule made bots take the pile so often that games stopped reliably
    // terminating: taking keeps cards cycling in play, only a successful defend retires
    // them to the discard pile for good, and once the deck's empty everyone's trumps run
    // low at once, so an ungated version of this rule fires constantly late-game and can
    // stall two similarly trump-poor players indefinitely. The hand-size cap is the actual
    // backstop — never keep preferring "take" once your hand's already grown past a normal
    // one, so a player can't stall forever accumulating cards to protect one trump.
    const trumpsRunningOut = deckEmpty && myTrumpCount <= 2 && hand.length < STALL_GUARD_HAND_SIZE;

    if (action.type === 'pass') {
      let score = 1;
      let reason: ReasonTag = 'passNothingUseful';
      if (bestThrowIn && isTrump(bestThrowIn, trumpSuit) && trumpsRunningOut) {
        score = 45 + (myTrumpCount === 1 ? 15 : 0);
        reason = 'passSaveTrump';
      }
      return { action, score, reason };
    }

    if (action.type === 'take') {
      // Taking is only ever offered as an option alongside real defends, or alone.
      // DELIBERATELY left at the old, always-deprioritized-when-a-defend-exists scoring —
      // an experiment making this trump-aware (mirroring the pass/throw-in logic above)
      // provably created infinite loops: taking keeps cards cycling in play instead of
      // retiring to the discard pile, and once several players are simultaneously
      // trump-poor (the deck-empty endgame is exactly when that's common), an eager taker
      // can stall the whole game rotating cards between hands forever. Confirmed by
      // fingerprinting full random-seed games for exact repeated states — one seed cycled
      // with a period of 18 moves. Left as a known limitation rather than risking a hang in
      // a real game.
      const hasDefendOption = !!bestDefend;
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
