import { describe, expect, it } from 'vitest';
import { canBeat } from '../src/rules.js';
import { Card } from '../src/types.js';

const c = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit });

describe('canBeat', () => {
  it('higher card of the same suit beats a lower one', () => {
    expect(canBeat(c('7', 'S'), c('K', 'S'), 'H')).toBe(true);
    expect(canBeat(c('K', 'S'), c('7', 'S'), 'H')).toBe(false);
  });

  it('different non-trump suits never beat each other', () => {
    expect(canBeat(c('6', 'S'), c('A', 'C'), 'H')).toBe(false);
  });

  it('any trump beats any non-trump card', () => {
    expect(canBeat(c('A', 'S'), c('6', 'H'), 'H')).toBe(true);
  });

  it('a trump attack can only be beaten by a higher trump', () => {
    expect(canBeat(c('6', 'H'), c('7', 'H'), 'H')).toBe(true);
    expect(canBeat(c('9', 'H'), c('7', 'H'), 'H')).toBe(false);
    expect(canBeat(c('9', 'H'), c('A', 'S'), 'H')).toBe(false);
  });

  it('a card never beats itself in rank on a different non-trump suit', () => {
    expect(canBeat(c('Q', 'D'), c('Q', 'C'), 'H')).toBe(false);
  });
});
