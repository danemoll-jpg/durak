// Shared seat/personality bookkeeping used by both local (vs-bots) and online (Firestore
// room) game setup, so the two don't drift — this replaces the old server's Room.startGame.
import { BotPersonalityId, EngineConfig, PERSONALITIES } from '@durak/engine';
import { DEFAULT_PLAYER_ICON } from './icons';

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

/** Single source of truth for "what avatar does this seat show" — used by both the lobby
 * (packages/client/src/components/LobbyScreen.tsx) and the in-game player badges
 * (GameView.tsx), so the two can never disagree the way they used to (lobby showed a
 * generic icon, the game screen showed a different one). Bots always show their
 * personality's fixed avatar; humans show whatever they picked (see lib/icons.ts),
 * falling back to the default if unset (e.g. an unclaimed open seat). */
export function seatAvatar(seat: { type: 'human' | 'bot'; personality?: BotPersonalityId; icon?: string }): string {
  if (seat.type === 'bot') return seat.personality ? PERSONALITIES[seat.personality].avatar : '🤖';
  return seat.icon || DEFAULT_PLAYER_ICON;
}
