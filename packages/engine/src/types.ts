// Core types for the Durak engine. Kept framework-free so this package can be
// used identically by the server (authoritative state), the bots, and the
// hint generator.

export type Suit = 'S' | 'H' | 'D' | 'C';
export const SUITS: readonly Suit[] = ['S', 'H', 'D', 'C'];
export const SUIT_SYMBOLS: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
export const SUIT_NAMES: Record<Suit, string> = {
  S: 'Spades',
  H: 'Hearts',
  D: 'Diamonds',
  C: 'Clubs',
};

export type Rank = '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export const RANKS: readonly Rank[] = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
export const RANK_VALUES: Record<Rank, number> = {
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export interface Card {
  suit: Suit;
  rank: Rank;
}

export function cardId(card: Card): string {
  return `${card.rank}${card.suit}`;
}

export function cardsEqual(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

export function cardLabel(card: Card): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}

/** A single attack/defend pairing sitting on the table this round. */
export interface TableSlot {
  attack: Card;
  defend?: Card;
}

export type BotPersonalityId = 'boris' | 'natasha';

export interface PlayerState {
  id: string;
  name: string;
  isBot: boolean;
  personality?: BotPersonalityId;
  hand: Card[];
  /** Set once a player has emptied their hand with no deck left to draw from — they're safe. */
  isOut: boolean;
  /** Finish order among safe players; 0 = first out. Undefined while still playing. */
  finishPlace?: number;
}

export type RoundPhase = 'awaitingThrowIn' | 'awaitingDefense' | 'gameOver';

export type RoundOutcome = 'defended' | 'taken';

/** Structured events emitted by the engine as it plays — the seam commentary hooks into. */
export type GameEvent =
  | { type: 'gameStarted'; trumpCard: Card; playerOrder: string[] }
  | { type: 'cardThrown'; by: string; card: Card; isOpening: boolean }
  | { type: 'cardDefended'; by: string; attackCard: Card; defendCard: Card }
  | { type: 'playerPassed'; by: string }
  | { type: 'playerTook'; by: string; cardCount: number }
  | { type: 'roundResolved'; outcome: RoundOutcome; attacker: string; defender: string; newAttacker: string; newDefender: string }
  | { type: 'deckEmpty' }
  | { type: 'playerFinished'; playerId: string; place: number }
  | { type: 'gameOver'; durak: string | null };

export interface GameState {
  players: PlayerState[];
  /** Draw pile; draw from the end (pop). */
  deck: Card[];
  trumpCard: Card;
  trumpSuit: Suit;
  /** "Bita" — cards that were successfully defended and are out of play. */
  discardPile: Card[];
  table: TableSlot[];
  attackerIndex: number;
  defenderIndex: number;
  /** Seat indices still eligible to throw in this "lap"; front of queue acts next. */
  throwInQueue: number[];
  /** Whose turn it is to act right now (throw-in or defense). Null only when phase is gameOver. */
  actingSeat: number | null;
  phase: RoundPhase;
  /** Max cards this round: min(6, defender's hand size when the round began). */
  maxTableSlots: number;
  roundNumber: number;
  log: GameEvent[];
  durak: string | null;
  isDraw: boolean;
}

export interface EngineConfig {
  playerConfigs: Array<{ id: string; name: string; isBot: boolean; personality?: BotPersonalityId }>;
  /** Optional seeded RNG for deterministic tests. */
  rng?: () => number;
}

export type ThrowAction = { type: 'throw'; card: Card };
export type PassAction = { type: 'pass' };
export type DefendAction = { type: 'defend'; card: Card };
export type TakeAction = { type: 'take' };

export type PlayerAction = ThrowAction | PassAction | DefendAction | TakeAction;

export interface LegalActions {
  seatIndex: number;
  actions: PlayerAction[];
}
