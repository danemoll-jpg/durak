import { RoomDoc } from '../network/rooms';
import { MAX_SEATS } from '../lib/players';
import { unlockAudio } from '../lib/audio';

interface LobbyScreenProps {
  code: string;
  room: RoomDoc;
  isHost: boolean;
  mySeatIndex: number;
  error: string | null;
  onAddOpenSeat: () => void;
  onAddBotSeat: () => void;
  onRemoveSeat: (index: number) => void;
  onStart: () => void;
  onLeave: () => void;
}

export function LobbyScreen({
  code,
  room,
  isHost,
  mySeatIndex,
  error,
  onAddOpenSeat,
  onAddBotSeat,
  onRemoveSeat,
  onStart,
  onLeave,
}: LobbyScreenProps) {
  const hasOpenSeat = room.seats.some((s) => s.type === 'human' && s.clientId === null);
  const canStart = isHost && room.seats.length >= 2 && !hasOpenSeat;
  const tableFull = room.seats.length >= MAX_SEATS;

  function handleStart() {
    unlockAudio();
    onStart();
  }

  return (
    <div className="start-screen">
      <div className="start-screen__card">
        <button type="button" className="back-link" onClick={onLeave}>
          ‹ Leave
        </button>
        <h1>Room {code}</h1>
        <p className="start-screen__subtitle">Share this code with your friend — they'll enter it to join.</p>

        <ul className="lobby__seats">
          {room.seats.map((seat, i) => (
            <li key={seat.id} className="lobby__seat">
              <span className="lobby__seat-icon">{seat.type === 'bot' ? '🤖' : seat.clientId ? '🧑' : '⏳'}</span>
              <span className="lobby__seat-name">
                {seat.name}
                {i === mySeatIndex && ' (you)'}
              </span>
              {isHost && i !== mySeatIndex && (
                <button type="button" className="lobby__seat-remove" onClick={() => onRemoveSeat(i)} aria-label="Remove seat">
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>

        {isHost && (
          <div className="lobby__add-buttons">
            <button type="button" disabled={tableFull} onClick={onAddOpenSeat}>
              + Open seat (for a friend)
            </button>
            <button type="button" disabled={tableFull} onClick={onAddBotSeat}>
              + Add a bot
            </button>
          </div>
        )}

        {isHost ? (
          <button type="button" className="start-screen__submit" disabled={!canStart} onClick={handleStart}>
            {hasOpenSeat ? 'Waiting for everyone to join…' : 'Deal the cards 🃏'}
          </button>
        ) : (
          <p className="lobby__waiting">Waiting for the host to start the game…</p>
        )}

        {error && <div className="error-banner">{error}</div>}
      </div>
    </div>
  );
}
