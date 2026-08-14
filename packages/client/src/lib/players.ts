// Shared seat/personality bookkeeping used by both local (vs-bots) and online (Firestore
// room) game setup, so the two don't drift — this replaces the old server's Room.startGame.
import { BotPersonalityId, EngineConfig } from '@durak/engine';

export const BOT_PERSONALITIES: BotPersonalityId[] = ['boris', 'natasha'];
export const BOT_DISPLAY_NAMES: Record<BotPersonalityId, string> = { boris: 'Boris', natasha: 'Natasha' };

/** Capped at 3 seats total because only two bot personalities exist today — add more
 * entries to PERSONALITIES in @durak/engine and raise this cap to support bigger tables. */
export const MAX_SEATS = 3;

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
