import { Card as CardType, PublicGameState, RANK_VALUES } from '@durak/engine';
import { Card } from './Card';
import { canDefendWith, canThrowCard } from '../lib/legality';

interface HandProps {
  state: PublicGameState;
  hand: CardType[];
  onPlay: (card: CardType) => void;
}

export function Hand({ state, hand, onPlay }: HandProps) {
  const sorted = [...hand].sort((a, b) => {
    if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
    return RANK_VALUES[a.rank] - RANK_VALUES[b.rank];
  });

  return (
    <div className="hand">
      {sorted.map((card) => {
        const legal =
          state.phase === 'awaitingThrowIn' ? canThrowCard(state, card) : canDefendWith(state, card);
        return (
          <Card
            key={`${card.rank}${card.suit}`}
            card={card}
            playable={legal}
            faded={!legal}
            onClick={legal ? () => onPlay(card) : undefined}
          />
        );
      })}
      {sorted.length === 0 && <p className="hand__empty">Your hand is empty — you're safe! 🎉</p>}
    </div>
  );
}
