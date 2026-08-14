import { Card as CardType, SUIT_SYMBOLS } from '@durak/engine';

interface CardProps {
  card?: CardType; // undefined = face-down back
  playable?: boolean;
  faded?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  style?: React.CSSProperties;
  title?: string;
}

export function Card({ card, playable, faded, size = 'md', onClick, style, title }: CardProps) {
  const isRed = card && (card.suit === 'H' || card.suit === 'D');
  const classNames = ['card', `card--${size}`];
  if (!card) classNames.push('card--back');
  if (playable) classNames.push('card--playable');
  if (faded) classNames.push('card--faded');
  if (onClick) classNames.push('card--clickable');

  return (
    <button
      type="button"
      className={classNames.join(' ')}
      onClick={onClick}
      disabled={!onClick}
      style={{ color: isRed ? 'var(--suit-red)' : 'var(--suit-black)', ...style }}
      title={title}
    >
      {card ? (
        <>
          <span className="card__corner card__corner--top">
            {card.rank}
            <br />
            {SUIT_SYMBOLS[card.suit]}
          </span>
          <span className="card__pip">{SUIT_SYMBOLS[card.suit]}</span>
          <span className="card__corner card__corner--bottom">
            {card.rank}
            <br />
            {SUIT_SYMBOLS[card.suit]}
          </span>
        </>
      ) : (
        <span className="card__back-pattern">🂠</span>
      )}
    </button>
  );
}
