// WebSocket message contract shared by the server and client so the two never drift apart.
import { MoveHint } from './bots/hints.js';
import { CommentaryLine } from './commentary/types.js';
import { PlayerAction } from './types.js';
import { PublicGameState } from './publicState.js';
import { SfxCue } from './soundCues.js';

export interface StartGameMessage {
  type: 'startGame';
  humanName: string;
  /** Total seats at the table, including the human (2-4). Remaining seats are filled with bots. */
  totalPlayers: number;
}
export interface ActionMessage {
  type: 'action';
  action: PlayerAction;
}
export interface RequestHintMessage {
  type: 'requestHint';
}
export interface NewGameMessage {
  type: 'newGame';
}
export type ClientMessage = StartGameMessage | ActionMessage | RequestHintMessage | NewGameMessage;

export interface StateMessage {
  type: 'state';
  state: PublicGameState;
}
export interface CommentaryMessage {
  type: 'commentary';
  lines: CommentaryLine[];
}
export interface HintMessage {
  type: 'hint';
  hint: MoveHint | null;
}
export interface ErrorMessage {
  type: 'error';
  message: string;
}
export interface ResetMessage {
  type: 'reset';
}
export interface SfxMessage {
  type: 'sfx';
  cues: SfxCue[];
}
export type ServerMessage = StateMessage | CommentaryMessage | HintMessage | ErrorMessage | ResetMessage | SfxMessage;
