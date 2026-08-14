import { describe, expect, it } from 'vitest';
import { applyAction, createGame, getCurrentLegalActions } from '../src/gameEngine.js';
import { chooseBestAction } from '../src/bots/strategy.js';
import { Card, GameState, Suit } from '../src/types.js';

function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const c = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit });

function twoPlayerState(overrides: Partial<GameState> = {}): GameState {
  const trumpSuit: Suit = 'H';
  const base: GameState = {
    players: [
      { id: 'p0', name: 'P0', isBot: true, hand: [], isOut: false },
      { id: 'p1', name: 'P1', isBot: true, hand: [], isOut: false },
    ],
    deck: [],
    trumpCard: c('6', trumpSuit),
    trumpSuit,
    discardPile: [],
    table: [],
    attackerIndex: 0,
    defenderIndex: 1,
    throwInQueue: [0],
    actingSeat: 0,
    phase: 'awaitingThrowIn',
    maxTableSlots: 2,
    roundNumber: 1,
    log: [],
    durak: null,
    isDraw: false,
  };
  return { ...base, ...overrides };
}

function totalCards(state: GameState): number {
  const inHands = state.players.reduce((n, p) => n + p.hand.length, 0);
  const inTable = state.table.reduce((n, slot) => n + 1 + (slot.defend ? 1 : 0), 0);
  return inHands + state.deck.length + state.discardPile.length + inTable;
}

describe('turn rotation', () => {
  it('a successful defense makes the defender the next attacker', () => {
    let state = twoPlayerState({
      players: [
        { id: 'p0', name: 'P0', isBot: true, hand: [c('6', 'S'), c('8', 'C')], isOut: false },
        { id: 'p1', name: 'P1', isBot: true, hand: [c('7', 'S'), c('9', 'C')], isOut: false },
      ],
    });

    state = applyAction(state, 0, { type: 'throw', card: c('6', 'S') });
    expect(state.phase).toBe('awaitingDefense');
    expect(state.actingSeat).toBe(1);

    state = applyAction(state, 1, { type: 'defend', card: c('7', 'S') });
    expect(state.phase).toBe('awaitingThrowIn');
    expect(state.actingSeat).toBe(0);

    state = applyAction(state, 0, { type: 'pass' });

    expect(state.attackerIndex).toBe(1);
    expect(state.defenderIndex).toBe(0);
    expect(state.discardPile).toHaveLength(2);
    expect(state.table).toHaveLength(0);
  });

  it('taking the cards means the same attacker attacks again', () => {
    // p0 keeps a spare card so emptying one throw doesn't end the game — isolates
    // the rotation rule from the "last card escapes" endgame rule (tested below).
    let state = twoPlayerState({
      players: [
        { id: 'p0', name: 'P0', isBot: true, hand: [c('A', 'H'), c('6', 'C')], isOut: false },
        { id: 'p1', name: 'P1', isBot: true, hand: [c('6', 'S')], isOut: false },
      ],
      maxTableSlots: 1,
    });

    state = applyAction(state, 0, { type: 'throw', card: c('A', 'H') });
    expect(state.phase).toBe('awaitingDefense');

    const legal = getCurrentLegalActions(state);
    expect(legal?.actions.some((a) => a.type === 'defend')).toBe(false);
    expect(legal?.actions.some((a) => a.type === 'take')).toBe(true);

    state = applyAction(state, 1, { type: 'take' });

    expect(state.attackerIndex).toBe(0);
    expect(state.defenderIndex).toBe(1);
    expect(state.players[1].hand).toHaveLength(2);
    expect(state.phase).not.toBe('gameOver');
  });

  it('a player who throws their last card safely escapes if it goes undefended and the deck is empty — the taker becomes Durak', () => {
    let state = twoPlayerState({
      players: [
        { id: 'p0', name: 'P0', isBot: true, hand: [c('A', 'H')], isOut: false },
        { id: 'p1', name: 'P1', isBot: true, hand: [c('6', 'S')], isOut: false },
      ],
      maxTableSlots: 1,
    });

    state = applyAction(state, 0, { type: 'throw', card: c('A', 'H') });
    state = applyAction(state, 1, { type: 'take' });

    expect(state.phase).toBe('gameOver');
    expect(state.players[0].isOut).toBe(true);
    expect(state.durak).toBe('p1');
    expect(state.isDraw).toBe(false);
  });
});

function playFullGame(seed: number, playerCount: number): GameState {
  const rng = mulberry32(seed);
  let state = createGame({
    playerConfigs: Array.from({ length: playerCount }, (_, i) => ({
      id: `p${i}`,
      name: `Player ${i}`,
      isBot: true,
      personality: i % 2 === 0 ? ('boris' as const) : ('natasha' as const),
    })),
    rng,
  });

  expect(totalCards(state)).toBe(36);

  let iterations = 0;
  while (state.phase !== 'gameOver') {
    iterations++;
    if (iterations > 3000) throw new Error('Game did not terminate — likely a stuck state');
    const legal = getCurrentLegalActions(state);
    if (!legal || legal.actions.length === 0) {
      throw new Error(`No legal actions for acting seat ${state.actingSeat} in phase ${state.phase}`);
    }
    const best = chooseBestAction(state, legal.seatIndex);
    if (!best) throw new Error('chooseBestAction returned null despite legal actions existing');
    state = applyAction(state, legal.seatIndex, best.action);
    expect(totalCards(state)).toBe(36);
  }
  return state;
}

describe('full game simulation (bots vs bots)', () => {
  it('conserves all 36 cards and terminates for 2 players', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const final = playFullGame(seed, 2);
      expect(final.phase).toBe('gameOver');
    }
  });

  it('conserves all 36 cards and terminates for 3 players', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const final = playFullGame(seed, 3);
      expect(final.phase).toBe('gameOver');
    }
  });

  it('conserves all 36 cards and terminates for 4 players', () => {
    for (let seed = 1; seed <= 15; seed++) {
      const final = playFullGame(seed, 4);
      expect(final.phase).toBe('gameOver');
    }
  });

  it('always ends with exactly one durak or a clean draw, never an inconsistent state', () => {
    for (let seed = 1; seed <= 15; seed++) {
      const final = playFullGame(seed, 3);
      const activeCount = final.players.filter((p) => !p.isOut).length;
      if (final.isDraw) {
        expect(final.durak).toBeNull();
        expect(activeCount).toBe(0);
      } else {
        expect(final.durak).not.toBeNull();
        expect(activeCount).toBe(1);
      }
    }
  });
});
