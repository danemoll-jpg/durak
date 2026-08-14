import { BotPersonalityId, Card, GameState, RoundPhase, Suit, TableSlot } from './types.js';

/** What one player is allowed to see about another (or themselves) at any given moment. */
export interface PublicPlayerView {
  id: string;
  name: string;
  isBot: boolean;
  personality?: BotPersonalityId;
  handCount: number;
  /** Only populated for the viewer's own seat — or for everyone once the game is over. */
  hand?: Card[];
  isOut: boolean;
  finishPlace?: number;
}

export interface PublicGameState {
  players: PublicPlayerView[];
  trumpCard: Card;
  trumpSuit: Suit;
  deckCount: number;
  discardCount: number;
  table: TableSlot[];
  attackerIndex: number;
  defenderIndex: number;
  actingSeat: number | null;
  phase: RoundPhase;
  maxTableSlots: number;
  roundNumber: number;
  durak: string | null;
  isDraw: boolean;
  /** Which seat this redacted view was built for. -1 if the viewer isn't seated (spectator). */
  viewerSeatIndex: number;
}

/** Builds the view of `state` that `viewerId` is allowed to see — hides other players' hands. */
export function redactState(state: GameState, viewerId: string): PublicGameState {
  const viewerSeatIndex = state.players.findIndex((p) => p.id === viewerId);
  const revealAll = state.phase === 'gameOver';

  return {
    players: state.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      isBot: p.isBot,
      personality: p.personality,
      handCount: p.hand.length,
      hand: i === viewerSeatIndex || revealAll ? p.hand : undefined,
      isOut: p.isOut,
      finishPlace: p.finishPlace,
    })),
    trumpCard: state.trumpCard,
    trumpSuit: state.trumpSuit,
    deckCount: state.deck.length,
    discardCount: state.discardPile.length,
    table: state.table,
    attackerIndex: state.attackerIndex,
    defenderIndex: state.defenderIndex,
    actingSeat: state.actingSeat,
    phase: state.phase,
    maxTableSlots: state.maxTableSlots,
    roundNumber: state.roundNumber,
    durak: state.durak,
    isDraw: state.isDraw,
    viewerSeatIndex,
  };
}
