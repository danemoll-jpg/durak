import { useCallback, useRef, useState } from 'react';
import {
  applyAction,
  createGame,
  deriveSoundCues,
  GameEvent,
  GameState,
  getHint,
  MoveHint,
  PlayerAction,
  PublicGameState,
  redactState,
  TemplateCommentaryProvider,
} from '@durak/engine';
import { isBotTurn, stepBot } from '../lib/bot';
import { commentaryForEvents } from '../lib/commentary';
import { BOT_DISPLAY_NAMES, buildPlayerConfigs, MAX_SEATS, nextBotPersonality, SeatConfig } from '../lib/players';
import { isMuted, playSound, setMuted, SoundName } from '../lib/audio';
import { DEFAULT_PLAYER_ICON } from '../lib/icons';
import { CommentaryEntry } from './useOnlineRoom';

const HUMAN_ID = 'human';
const BOT_THINK_MIN_MS = 350;
const BOT_THINK_MAX_MS = 700;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveSoundName(cue: ReturnType<typeof deriveSoundCues>[number], state: GameState): SoundName {
  if (cue !== 'gameOver') return cue;
  if (state.isDraw) return 'gameOverDraw';
  return state.durak === HUMAN_ID ? 'gameOverLose' : 'gameOverWin';
}

let nextCommentaryId = 0;

export interface UseLocalGame {
  connected: true;
  publicState: PublicGameState | null;
  playerIcons: Record<string, string>;
  commentary: CommentaryEntry[];
  hint: MoveHint | null;
  error: string | null;
  muted: boolean;
  toggleMuted: () => void;
  startGame: (humanName: string, totalPlayers: number, icon: string) => void;
  sendAction: (action: PlayerAction) => void;
  requestHint: () => void;
  newGame: () => void;
  clearHint: () => void;
  dismissCommentary: (id: string) => void;
}

/** Runs a Durak match entirely in the browser — no server, no network. Same engine calls
 * (createGame/applyAction/stepBot) the old Express+ws server used to make on the human's
 * behalf, just called directly here instead of round-tripping over a socket. */
export function useLocalGame(): UseLocalGame {
  const [state, setState] = useState<GameState | null>(null);
  const [myIcon, setMyIcon] = useState(DEFAULT_PLAYER_ICON);
  const [commentary, setCommentary] = useState<CommentaryEntry[]>([]);
  const [hint, setHint] = useState<MoveHint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMutedState] = useState(() => isMuted());
  const commentaryProvider = useRef(new TemplateCommentaryProvider());
  // Remembered so "Deal me back in" (newGame) can redeal immediately with the same
  // settings instead of dumping the player back at a blank setup screen.
  const lastConfig = useRef<{ humanName: string; totalPlayers: number; icon: string } | null>(null);

  const notifyEvents = useCallback(async (events: GameEvent[], forState: GameState) => {
    if (events.length === 0) return;
    for (const cue of deriveSoundCues(events)) playSound(resolveSoundName(cue, forState));
    const lines = await commentaryForEvents(commentaryProvider.current, events, forState);
    if (lines.length > 0) {
      setCommentary((prev) =>
        [...prev, ...lines.map((line) => ({ ...line, id: `c${nextCommentaryId++}` }))].slice(-30),
      );
    }
  }, []);

  const runBotsToCompletion = useCallback(
    async (from: GameState): Promise<GameState> => {
      let current = from;
      while (isBotTurn(current)) {
        await delay(BOT_THINK_MIN_MS + Math.random() * (BOT_THINK_MAX_MS - BOT_THINK_MIN_MS));
        const { state: next, newEvents } = stepBot(current);
        current = next;
        setState(current);
        await notifyEvents(newEvents, current);
      }
      return current;
    },
    [notifyEvents],
  );

  const startGame = useCallback(
    (humanName: string, totalPlayers: number, icon: string) => {
      lastConfig.current = { humanName, totalPlayers, icon };
      setMyIcon(icon);
      const count = Math.min(MAX_SEATS, Math.max(2, Math.floor(totalPlayers) || 3));
      const seats: SeatConfig[] = [{ id: HUMAN_ID, name: humanName.trim() || 'You', isBot: false }];
      const used: SeatConfig['personality'][] = [];
      for (let i = 0; i < count - 1; i++) {
        const personality = nextBotPersonality(used);
        if (!personality) break;
        used.push(personality);
        seats.push({ id: `bot${i}`, name: BOT_DISPLAY_NAMES[personality], isBot: true, personality });
      }

      commentaryProvider.current = new TemplateCommentaryProvider();
      setCommentary([]);
      setHint(null);
      setError(null);

      const fresh = createGame({ playerConfigs: buildPlayerConfigs(seats) });
      setState(fresh);
      (async () => {
        await notifyEvents(fresh.log, fresh);
        await runBotsToCompletion(fresh);
      })();
    },
    [notifyEvents, runBotsToCompletion],
  );

  const sendAction = useCallback(
    (action: PlayerAction) => {
      if (!state) return;
      const seatIndex = state.players.findIndex((p) => p.id === HUMAN_ID);
      if (state.actingSeat !== seatIndex) {
        setError("It's not your turn.");
        return;
      }
      setError(null);
      setHint(null);
      (async () => {
        try {
          const prevLogLength = state.log.length;
          const next = applyAction(state, seatIndex, action);
          setState(next);
          await notifyEvents(next.log.slice(prevLogLength), next);
          await runBotsToCompletion(next);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'That move was rejected.');
        }
      })();
    },
    [state, notifyEvents, runBotsToCompletion],
  );

  const requestHint = useCallback(() => {
    if (!state) return;
    const seatIndex = state.players.findIndex((p) => p.id === HUMAN_ID);
    setHint(getHint(state, seatIndex));
  }, [state]);

  const clearHint = useCallback(() => setHint(null), []);

  const dismissCommentary = useCallback((id: string) => {
    setCommentary((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const newGame = useCallback(() => {
    // Redeal immediately with the same name/icon/table size — there's no "back to menu"
    // control during local play anyway, so falling through to a blank StartScreen here
    // would be a dead end, not a real choice.
    if (lastConfig.current) {
      const { humanName, totalPlayers, icon } = lastConfig.current;
      startGame(humanName, totalPlayers, icon);
      return;
    }
    setState(null);
    setCommentary([]);
    setHint(null);
    setError(null);
  }, [startGame]);

  const toggleMuted = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      setMuted(next);
      return next;
    });
  }, []);

  const publicState = state ? redactState(state, HUMAN_ID) : null;
  const playerIcons = { [HUMAN_ID]: myIcon };

  return {
    connected: true,
    publicState,
    playerIcons,
    commentary,
    hint,
    error,
    muted,
    toggleMuted,
    startGame,
    sendAction,
    requestHint,
    newGame,
    clearHint,
    dismissCommentary,
  };
}
