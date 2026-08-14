// Runs one bot turn using the shared heuristic strategy. Used identically by local
// (vs-bots) games and, in online rooms, by the host's browser stepping a bot seat —
// moved here (unchanged) from the old server's botController.ts.
import { applyAction, chooseBestAction, GameEvent, GameState } from '@durak/engine';

export interface BotStepResult {
  state: GameState;
  newEvents: GameEvent[];
}

export function isBotTurn(state: GameState): boolean {
  return state.phase !== 'gameOver' && state.actingSeat !== null && state.players[state.actingSeat].isBot;
}

/** Applies exactly one bot decision using the shared heuristic strategy. */
export function stepBot(state: GameState): BotStepResult {
  const seatIndex = state.actingSeat;
  if (seatIndex === null) throw new Error('No acting seat to step');
  const decision = chooseBestAction(state, seatIndex);
  if (!decision) throw new Error(`Bot at seat ${seatIndex} has no legal action available`);
  const prevLogLength = state.log.length;
  const next = applyAction(state, seatIndex, decision.action);
  return { state: next, newEvents: next.log.slice(prevLogLength) };
}
