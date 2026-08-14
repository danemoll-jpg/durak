import { cardLabel, GameEvent, GameState, PlayerState } from '../types.js';
import { CommentaryKey, PERSONALITIES } from './personalities.js';
import { CommentaryLine, CommentaryProvider } from './types.js';

type BaseKey = 'gameStart' | 'deckEmpty' | 'gameOverDraw' | 'took' | 'finished' | 'gameOverDurak';

interface BaseEvent {
  key: BaseKey;
  actorId?: string;
}

function baseEventFor(event: GameEvent): BaseEvent | null {
  switch (event.type) {
    case 'gameStarted':
      return { key: 'gameStart' };
    case 'deckEmpty':
      return { key: 'deckEmpty' };
    case 'playerTook':
      return { key: 'took', actorId: event.by };
    case 'playerFinished':
      return { key: 'finished', actorId: event.playerId };
    case 'gameOver':
      return event.durak ? { key: 'gameOverDurak', actorId: event.durak } : { key: 'gameOverDraw' };
    default:
      return null;
  }
}

function resolveKey(base: BaseEvent, speakerId: string): CommentaryKey {
  if (base.key === 'gameStart' || base.key === 'deckEmpty' || base.key === 'gameOverDraw') {
    return base.key;
  }
  const isSelf = base.actorId === speakerId;
  return `${base.key}${isSelf ? 'Self' : 'Other'}` as CommentaryKey;
}

function fillTemplate(template: string, event: GameEvent, state: GameState): string {
  const nameOf = (id: string) => state.players.find((p) => p.id === id)?.name ?? id;
  let text = template;
  if (event.type === 'playerTook') {
    text = text.replaceAll('{player}', nameOf(event.by)).replaceAll('{count}', String(event.cardCount));
  } else if (event.type === 'playerFinished') {
    text = text.replaceAll('{player}', nameOf(event.playerId));
  } else if (event.type === 'gameOver' && event.durak) {
    text = text.replaceAll('{player}', nameOf(event.durak));
  } else if (event.type === 'gameStarted') {
    text = text.replaceAll('{trump}', cardLabel(event.trumpCard));
  }
  return text;
}

/**
 * Default commentary source: randomized templated one-liners, keyed off engine events.
 * No network calls, no API key required. Implements {@link CommentaryProvider}, so a
 * future Claude-powered provider can be swapped in without touching game logic.
 */
export class TemplateCommentaryProvider implements CommentaryProvider {
  private lastLineByPersonality = new Map<string, string>();

  onEvent(event: GameEvent, state: GameState): CommentaryLine[] {
    const base = baseEventFor(event);
    if (!base) return [];

    const bots = state.players.filter((p): p is PlayerState & { personality: NonNullable<PlayerState['personality']> } =>
      p.isBot && !!p.personality,
    );
    if (bots.length === 0) return [];
    const speaker = bots[Math.floor(Math.random() * bots.length)];

    const key = resolveKey(base, speaker.id);
    const pool = PERSONALITIES[speaker.personality].lines[key];
    if (!pool || pool.length === 0) return [];

    const last = this.lastLineByPersonality.get(speaker.personality);
    const candidates = pool.length > 1 ? pool.filter((l) => l !== last) : pool;
    const template = candidates[Math.floor(Math.random() * candidates.length)];
    this.lastLineByPersonality.set(speaker.personality, template);

    return [{ speakerId: speaker.id, personality: speaker.personality, text: fillTemplate(template, event, state) }];
  }
}
