import { PublicGameState } from '@durak/engine';
import { GAME_HUB_URL } from '../lib/hub';

interface GameOverScreenProps {
  state: PublicGameState;
  onPlayAgain: () => void;
}

export function GameOverScreen({ state, onPlayAgain }: GameOverScreenProps) {
  const durak = state.players.find((p) => p.id === state.durak);
  // Whether the viewer themselves is the one who lost (this used to be equivalent to
  // "!durak.isBot" back when there was only ever one non-bot player, but that broke once two
  // real humans could play each other — compare against the viewer's own seat instead).
  const humanIsDurak = !!durak && state.players[state.viewerSeatIndex]?.id === state.durak;

  return (
    <div className="game-over">
      <div className="game-over__card">
        {state.isDraw ? (
          <>
            <div className="game-over__emoji">🤝</div>
            <h2>Nobody's the fool this time</h2>
            <p>The deck ran out and everyone emptied their hands together. Suspiciously diplomatic.</p>
          </>
        ) : (
          <>
            <div className="game-over__emoji">🤡</div>
            <h2>{humanIsDurak ? 'You are the Durak!' : `${durak?.name ?? 'Someone'} is the Durak!`}</h2>
            <p>Everyone else escaped clean. There is no dignity left to salvage here.</p>
          </>
        )}
        <div className="game-over__actions">
          <button type="button" className="game-over__button" onClick={onPlayAgain}>
            Deal me back in
          </button>
          <a className="game-over__button game-over__button--secondary" href={GAME_HUB_URL}>
            🎮 Game Hub
          </a>
        </div>
      </div>
    </div>
  );
}
