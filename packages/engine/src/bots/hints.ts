import { cardLabel, GameState, PlayerAction } from '../types.js';
import { chooseBestAction, ReasonTag } from './strategy.js';

export interface MoveHint {
  action: PlayerAction;
  headline: string;
  rationale: string;
}

function describeAction(action: PlayerAction): string {
  switch (action.type) {
    case 'throw':
      return `Play ${cardLabel(action.card)}`;
    case 'defend':
      return `Beat with ${cardLabel(action.card)}`;
    case 'take':
      return 'Take the cards';
    case 'pass':
      return "Say 'bito' (pass — nothing more to add)";
  }
}

const RATIONALE: Record<ReasonTag, string> = {
  lowestSafeCard: "It's a low card you don't need — cheap to lose, and it forces them to respond.",
  onlyOption: "It's your only legal move right now.",
  cheapestBeat: 'The cheapest card that still beats it — no need to overspend.',
  forcedTrumpBeat: "You'll have to spend a trump here — better to spend the smallest one you can.",
  noValidBeatMustTake: "Nothing in your hand beats that card, so you'll have to take the pile.",
  takeToPreserveTrumps: 'Taking now keeps your good trumps in hand for later instead of burning them here.',
  dumpDuplicateRank: "You've got more than one of this rank — good time to offload it while it's still useful for throw-ins.",
  openingLead: 'A safe opening card — low value, keeps your strong cards in reserve.',
  passNothingUseful: "You don't have anything worth adding to the table right now.",
  lastCard: "It's your last card — good luck!",
};

/** Suggests the best move for `seatIndex` using the same heuristic the bots use, in plain English. */
export function getHint(state: GameState, seatIndex: number): MoveHint | null {
  const best = chooseBestAction(state, seatIndex);
  if (!best) return null;
  return {
    action: best.action,
    headline: describeAction(best.action),
    rationale: RATIONALE[best.reason],
  };
}
