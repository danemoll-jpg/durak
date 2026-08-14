// Shared seat/personality bookkeeping used by both local (vs-bots) and online (Firestore
// room) game setup, so the two don't drift — this replaces the old server's Room.startGame.
import { BotPersonalityId, EngineConfig } from '@durak/engine';

export const BOT_PERSONALITIES: BotPersonalityId[] = ['boris', 'natasha'];
export const BOT_DISPLAY_NAMES: Record<BotPersonalityId, string> = { boris: 'Boris', natasha: 'Natasha' };

/** Capped at 4 seats total — the engine itself is tested up to 4 players (see
 * packages/engine/tests/gameEngine.test.ts), but only two bot personalities exist today
 * (Boris, Natasha), so a room can have at most 2 bot seats regardless of this cap
 * (nextBotPersonality below returns null once both are taken). Add more entries to
 * PERSONALITIES in @durak/engine and raise this cap further to support bigger all-bot
 * tables. */
export const MAX_SEATS = 4;

export interface SeatConfig {
  id: string;
  name: string;
  isBot: boolean;
  personality?: BotPersonalityId;
}

export function buildPlayerConfigs(seats: SeatConfig[]): EngineConfig['playerConfigs'] {
  return seats.map((s) => ({
    id: s.id,
    name: s.name.trim() || 'Player',
    isBot: s.isBot,
    personality: s.personality,
  }));
}

/** Picks the first bot personality not already sitting at the table, or null if the two
 * available personalities are both taken. */
export function nextBotPersonality(used: Array<BotPersonalityId | undefined>): BotPersonalityId | null {
  return BOT_PERSONALITIES.find((p) => !used.includes(p)) ?? null;
}
