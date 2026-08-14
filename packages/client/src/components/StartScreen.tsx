import { useState } from 'react';
import { unlockAudio } from '../lib/audio';

interface StartScreenProps {
  connected: boolean;
  onStart: (humanName: string, totalPlayers: number) => void;
  onBack: () => void;
}

export function StartScreen({ connected, onStart, onBack }: StartScreenProps) {
  const [name, setName] = useState('');
  const [totalPlayers, setTotalPlayers] = useState(3);

  function handleStart() {
    // Browsers require a real user gesture before audio can play — this click is it.
    unlockAudio();
    onStart(name, totalPlayers);
  }

  return (
    <div className="start-screen">
      <div className="start-screen__card">
        <button type="button" className="back-link" onClick={onBack}>
          ‹ Back
        </button>
        <h1>Durak</h1>
        <p className="start-screen__subtitle">
          The Russian card game where the loser isn't the one with the fewest points — it's the one still
          holding cards when everyone else has gone home. No pressure.
        </p>

        <label className="start-screen__label">
          What should the bots call you?
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dan"
            maxLength={20}
          />
        </label>

        <label className="start-screen__label">
          Table size
          <div className="start-screen__options">
            <button
              type="button"
              className={totalPlayers === 2 ? 'active' : ''}
              onClick={() => setTotalPlayers(2)}
            >
              You vs. 1 bot
            </button>
            <button
              type="button"
              className={totalPlayers === 3 ? 'active' : ''}
              onClick={() => setTotalPlayers(3)}
            >
              You vs. 2 bots
            </button>
          </div>
        </label>

        <button
          type="button"
          className="start-screen__submit"
          disabled={!connected}
          onClick={handleStart}
        >
          {connected ? 'Deal the cards 🃏' : 'Connecting to the server…'}
        </button>

        <details className="start-screen__rules">
          <summary>I don't really know how to play — quick rules?</summary>
          <ul>
            <li>Lowest trump goes first, attacking the next player.</li>
            <li>Beat an attack card with a higher card of the same suit, or any trump.</li>
            <li>Can't beat it? Take the whole pile into your hand.</li>
            <li>Beat it, and anyone can toss in more cards of a rank already on the table.</li>
            <li>Everyone refills to 6 cards after each round, lowest cards first.</li>
            <li>Once the deck runs out, whoever's still holding cards when everyone else is empty-handed is the Durak — the fool.</li>
          </ul>
          <p>Stuck mid-game? Hit the "What should I play?" button any time.</p>
        </details>
      </div>
    </div>
  );
}
