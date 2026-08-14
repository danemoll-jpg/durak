import { PublicPlayerView, PERSONALITIES } from '@durak/engine';

interface PlayerBadgeProps {
  player: PublicPlayerView;
  isAttacker: boolean;
  isDefender: boolean;
  isActing: boolean;
}

export function PlayerBadge({ player, isAttacker, isDefender, isActing }: PlayerBadgeProps) {
  const avatar = player.personality ? PERSONALITIES[player.personality].avatar : '🙂';
  const role = isDefender ? 'Defending' : isAttacker ? 'Attacking' : null;

  return (
    <div className={`player-badge ${isActing ? 'player-badge--active' : ''} ${player.isOut ? 'player-badge--out' : ''}`}>
      <div className="player-badge__avatar">{avatar}</div>
      <div className="player-badge__info">
        <div className="player-badge__name">{player.name}</div>
        <div className="player-badge__meta">
          {player.isOut ? (
            <span className="player-badge__safe">safe 🎉</span>
          ) : (
            <>
              <span>{player.handCount} card{player.handCount === 1 ? '' : 's'}</span>
              {role && <span className={`player-badge__role player-badge__role--${role.toLowerCase()}`}>{role}</span>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
