import { PublicGameState } from '@durak/engine';
import { Card } from './Card';

interface TableProps {
  state: PublicGameState;
}

export function Table({ state }: TableProps) {
  return (
    <div className="table">
      <div className="table__deck-area">
        <div className="deck-stack">
          {state.deckCount > 0 ? (
            <>
              <Card card={state.trumpCard} size="sm" style={{ transform: 'rotate(90deg)', marginRight: '-1.6rem' }} />
              <Card size="sm" />
            </>
          ) : (
            <Card card={state.trumpCard} size="sm" faded title="Trump (deck is empty)" />
          )}
          <span className="deck-stack__count">{state.deckCount} left</span>
        </div>
        <div className="discard-stack" title={`${state.discardCount} cards in the bita`}>
          <span className="discard-stack__label">Bita</span>
          <span className="discard-stack__count">{state.discardCount}</span>
        </div>
      </div>

      <div className="table__slots">
        {state.table.length === 0 && <p className="table__empty">The table is clear. Someone throw a card already.</p>}
        {state.table.map((slot, i) => (
          <div className="table-slot" key={i}>
            <Card card={slot.attack} size="lg" />
            {slot.defend && <Card card={slot.defend} size="lg" style={{ marginLeft: '-2.2rem', marginTop: '1.2rem' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
