import { Card, RANKS, SUITS, Suit } from './types.js';

/** Builds a standard 36-card Durak deck (6 through Ace, all 4 suits), unshuffled. */
export function buildDeck(): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({ suit, rank });
    }
  }
  return cards;
}

/** Fisher-Yates shuffle. Accepts a custom RNG (0-1 range) so tests can be deterministic. */
export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Deals a fresh, shuffled deck. Returns the draw pile (with the trump card placed at
 * the bottom / index 0, so it's the last card drawn) plus the trump card/suit for display.
 */
export function dealFreshDeck(rng: () => number = Math.random): { deck: Card[]; trumpCard: Card; trumpSuit: Suit } {
  const shuffled = shuffle(buildDeck(), rng);
  // Traditionally the trump card is cut to the bottom of the deck and stays face-up
  // there until it's the last card drawn. We model the draw pile so deck.pop() draws
  // the next card, meaning the trump card belongs at index 0.
  const trumpCard = shuffled[shuffled.length - 1];
  const rest = shuffled.slice(0, shuffled.length - 1);
  const deck = [trumpCard, ...rest];
  return { deck, trumpCard, trumpSuit: trumpCard.suit };
}
