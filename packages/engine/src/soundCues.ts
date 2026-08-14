import { GameEvent } from './types.js';

/**
 * Semantic sound cue names, derived from raw engine events server-side so the client
 * doesn't need to infer "what just happened" from state diffs. Deliberately independent
 * of commentary (which is gated on a bot existing to "speak") — sound cues fire for every
 * player, every time, regardless of personalities.
 */
export type SfxCue = 'deal' | 'cardThrow' | 'cardDefend' | 'take' | 'deckEmpty' | 'safe' | 'gameOver';

const CUE_BY_EVENT: Partial<Record<GameEvent['type'], SfxCue>> = {
  gameStarted: 'deal',
  cardThrown: 'cardThrow',
  cardDefended: 'cardDefend',
  playerTook: 'take',
  deckEmpty: 'deckEmpty',
  playerFinished: 'safe',
  gameOver: 'gameOver',
};

/** Maps a batch of raw engine events to the sound cues the client should play, in order. */
export function deriveSoundCues(events: GameEvent[]): SfxCue[] {
  const cues: SfxCue[] = [];
  for (const event of events) {
    const cue = CUE_BY_EVENT[event.type];
    if (cue) cues.push(cue);
  }
  return cues;
}
