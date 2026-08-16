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
  passSaveTrump: "Throwing in is optional, and the only card you could add is a trump — better to hang onto it and pass.",
  lastCard: "It's your last card — good luck!",
};

/** Suggests the best move for `seatIndex` using the same heuristic the bots use, in plain English. */
export function getHint(state: GameState, seatIndex: number): MoveHint | null {
  const best = chooseBestAction(state, seatIndex);
  if (!best) return null;
  let rationale = RATIONALE[best.reason];

  // The bots always defend over taking if they legally can — deliberately: an earlier
  // version that sometimes preferred taking (to protect a scarce trump) provably created
  // infinite loops in rare cases (taking keeps cards cycling forever; only a successful
  // defend retires them for good). Rather than risk that in real games, this stays a
  // suggestion left to the human, who — unlike a bot — can just look at the situation once
  // and click "Take the pile" instead if they agree, with no risk of stalling the game.
  if (best.action.type === 'defend' && best.action.card.suit === state.trumpSuit) {
    const trumpsLeft = state.players[seatIndex].hand.filter((c) => c.suit === state.trumpSuit).length;
    const deckEmpty = state.deck.length === 0;
    if (deckEmpty && trumpsLeft <= 1) {
      rationale =
        "This would be your very last trump, and the deck's empty — no more are coming. Seriously consider taking the pile instead so you're not defenseless against trumps for the rest of the game.";
    } else if (deckEmpty && trumpsLeft <= 2) {
      rationale += " You're down to your last couple of trumps with none left to draw, though — taking the pile instead is worth considering if you'd rather keep this one in reserve.";
    } else {
      rationale += ' Taking the pile is always a legal alternative too, if you\'d rather not spend it.';
    }
  }

  return {
    action: best.action,
    headline: describeAction(best.action),
    rationale,
  };
}
