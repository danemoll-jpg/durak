import { ReactNode } from 'react';
import { Card as CardType, PlayerAction, PublicGameState, MoveHint } from '@durak/engine';
import { CommentaryFeed } from './CommentaryFeed';
import { GameOverScreen } from './GameOverScreen';
import { Hand } from './Hand';
import { HintPanel } from './HintPanel';
import { PlayerBadge } from './PlayerBadge';
import { SoundToggle } from './SoundToggle';
import { Table } from './Table';
import { CommentaryEntry } from '../hooks/useOnlineRoom';
import { canPass, canTake, isMyTurn } from '../lib/legality';

interface GameViewProps {
  publicState: PublicGameState;
  commentary: CommentaryEntry[];
  hint: MoveHint | null;
  error: string | null;
  connected: boolean;
  muted: boolean;
  toggleMuted: () => void;
  sendAction: (action: PlayerAction) => void;
  requestHint: () => void;
  clearHint: () => void;
  dismissCommentary: (id: string) => void;
  newGame: () => void;
  headerExtra?: ReactNode;
}

/** The actual card-table screen — shared by local (vs-bots) and online (Firestore room)
 * play, since both hooks expose the same PublicGameState-shaped view of the game. */
export function GameView({
  publicState,
  commentary,
  hint,
  error,
  connected,
  muted,
  toggleMuted,
  sendAction,
  requestHint,
  clearHint,
  dismissCommentary,
  newGame,
  headerExtra,
}: GameViewProps) {
  const me = publicState.players[publicState.viewerSeatIndex];
  const opponents = publicState.players.filter((_, i) => i !== publicState.viewerSeatIndex);
  const myTurn = isMyTurn(publicState);

  function handlePlay(card: CardType) {
    if (publicState.phase === 'awaitingThrowIn') {
      sendAction({ type: 'throw', card });
    } else if (publicState.phase === 'awaitingDefense') {
      sendAction({ type: 'defend', card });
    }
  }

  return (
    <div className="app">
      <SoundToggle muted={muted} onToggle={toggleMuted} />
      {headerExtra}
      {!connected && <div className="error-banner">Disconnected — try refreshing.</div>}
      {error && <div className="error-banner">{error}</div>}

      <div className="opponents-row">
        {opponents.map((p) => (
          <PlayerBadge
            key={p.id}
            player={p}
            isAttacker={publicState.players[publicState.attackerIndex]?.id === p.id}
            isDefender={publicState.players[publicState.defenderIndex]?.id === p.id}
            isActing={publicState.actingSeat !== null && publicState.players[publicState.actingSeat]?.id === p.id}
          />
        ))}
      </div>

      <Table state={publicState} />

      <div className="status-bar">
        {myTurn ? (
          <span className="status-bar__prompt">
            {publicState.phase === 'awaitingDefense' ? "It's your move — beat it or take the pile." : "It's your move — throw a card or pass."}
          </span>
        ) : publicState.actingSeat !== null ? (
          <span className="status-bar__prompt">
            Waiting on {publicState.players[publicState.actingSeat]?.name}…
          </span>
        ) : null}
      </div>

      <div className="action-bar">
        <button type="button" disabled={!canTake(publicState)} onClick={() => sendAction({ type: 'take' })}>
          Take the pile
        </button>
        <button type="button" disabled={!canPass(publicState)} onClick={() => sendAction({ type: 'pass' })}>
          Bito (pass)
        </button>
        <HintPanel hint={hint} canRequest={myTurn} onRequest={requestHint} onDismiss={clearHint} />
      </div>

      <div className="my-area">
        <PlayerBadge
          player={me}
          isAttacker={publicState.attackerIndex === publicState.viewerSeatIndex}
          isDefender={publicState.defenderIndex === publicState.viewerSeatIndex}
          isActing={myTurn}
        />
        <Hand state={publicState} hand={me.hand ?? []} onPlay={handlePlay} />
      </div>

      <CommentaryFeed entries={commentary} onDismiss={dismissCommentary} />

      {publicState.phase === 'gameOver' && <GameOverScreen state={publicState} onPlayAgain={newGame} />}
    </div>
  );
}
