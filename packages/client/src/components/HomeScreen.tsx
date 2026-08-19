import { GAME_HUB_URL } from '../lib/hub';

interface HomeScreenProps {
  onSelectLocal: () => void;
  onSelectOnline: () => void;
}

export function HomeScreen({ onSelectLocal, onSelectOnline }: HomeScreenProps) {
  return (
    <div className="start-screen">
      <a className="back-link back-link--floating" href={GAME_HUB_URL}>
        🎮 All Games
      </a>
      <div className="start-screen__card">
        <h1>Durak</h1>
        <p className="start-screen__subtitle">
          The Russian card game where the loser isn't the one with the fewest points — it's the one still
          holding cards when everyone else has gone home. No pressure.
        </p>

        <div className="home-screen__choices">
          <button type="button" className="home-screen__choice" onClick={onSelectLocal}>
            <span className="home-screen__choice-emoji">🤖</span>
            <span className="home-screen__choice-title">Play locally vs. bots</span>
            <span className="home-screen__choice-sub">Just you and this browser — no one else needed.</span>
          </button>
          <button type="button" className="home-screen__choice" onClick={onSelectOnline}>
            <span className="home-screen__choice-emoji">🌐</span>
            <span className="home-screen__choice-title">Play online vs. a friend</span>
            <span className="home-screen__choice-sub">Create a room, share the code, play from anywhere.</span>
          </button>
        </div>
      </div>
    </div>
  );
}
