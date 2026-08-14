import { BotPersonalityId } from '../types.js';

export type CommentaryKey =
  | 'gameStart'
  | 'deckEmpty'
  | 'gameOverDraw'
  | 'tookSelf'
  | 'tookOther'
  | 'finishedSelf'
  | 'finishedOther'
  | 'gameOverDurakSelf'
  | 'gameOverDurakOther';

export interface Personality {
  id: BotPersonalityId;
  displayName: string;
  avatar: string;
  tagline: string;
  lines: Record<CommentaryKey, string[]>;
}

export const PERSONALITIES: Record<BotPersonalityId, Personality> = {
  boris: {
    id: 'boris',
    displayName: 'Boris "The Fence Post" Volkov',
    avatar: '🧔',
    tagline: 'Has been playing Durak since before the deck had corners.',
    lines: {
      gameStart: [
        'Trump is {trump}. Try to contain your excitement.',
        'Ah, {trump} is trump. My grandmother beat better trumps with a wet mitten.',
        'Cards are dealt. Now we find out who was raised properly.',
        '{trump} trump, eh? Bold choice, deck. Bold choice.',
      ],
      deckEmpty: [
        'Deck is empty. No more mercy cards coming, comrades.',
        'And the well runs dry. Now it is a fight, not a picnic.',
        'No more drawing. Whatever is in your hand is your whole life now.',
      ],
      gameOverDraw: [
        'Nobody is the fool this time. Suspiciously diplomatic of everyone.',
        'A draw. Somewhere, a grandmother is unimpressed.',
        'No Durak today. The universe remains chaotic and unresolved.',
      ],
      tookSelf: [
        'Bah. I take the cards. A tactical retreat, not a defeat.',
        'Fine, FINE, I take them. This is what generosity looks like.',
        'I take the pile. Consider it a donation to my collection.',
      ],
      tookOther: [
        '{player} takes the cards! Beautiful. Truly, a masterclass in disaster.',
        'Ohoho, {player} could not beat that? Sit down, watch a professional.',
        '{player} scoops up the pile like it owes them money.',
        'And {player} takes {count} cards. History will remember this fondly. Or not at all.',
      ],
      finishedSelf: [
        'I am out of cards! Free at last. Enjoy the trenches without me.',
        'Empty hands, clean conscience. I am done here.',
      ],
      finishedOther: [
        '{player} is out already? Show-off.',
        'Look at {player}, finished and smug about it.',
        '{player} escapes. The rest of us remain in this fine establishment.',
      ],
      gameOverDurakSelf: [
        'I am the Durak. I regret nothing. Well — one or two things.',
        'The fool, is me. Deal the next hand before I file a complaint.',
      ],
      gameOverDurakOther: [
        '{player} is the Durak! I will be telling this story for years.',
        'And there it is — {player} carries the fool\'s cards home tonight.',
        'The title of Durak goes to {player}. Wear it with dignity. Or don\'t, it\'s funnier that way.',
      ],
    },
  },
  natasha: {
    id: 'natasha',
    displayName: 'Natasha "The Grandmaster" Orlova',
    avatar: '👩‍💼',
    tagline: 'Treats every hand of Durak like a chess championship.',
    lines: {
      gameStart: [
        'Trump suit: {trump}. I already see three ways to win from here.',
        '{trump} trump. Adequate. I\'ve won with worse.',
        'Cards dealt, opening theory begins. Try to keep up.',
        'Trump is {trump} — noted, filed, and already part of my plan.',
      ],
      deckEmpty: [
        'The deck is empty. This is the endgame. This is where I shine.',
        'No more draws. Now it\'s pure calculation.',
        'Deck\'s dry — the amateurs panic here. I do not.',
      ],
      gameOverDraw: [
        'A draw? How refreshingly anticlimactic.',
        'No Durak. I suppose everyone gets a participation trophy.',
        'Even I didn\'t see a draw coming. Slow clap for chaos.',
      ],
      tookSelf: [
        'I take the cards — a strategic accumulation, not a mistake.',
        'Taking these on purpose. Definitely on purpose.',
        'A grandmaster sometimes sacrifices tempo. This is that.',
      ],
      tookOther: [
        '{player} takes the pile. Did you even look at your hand?',
        'Interesting choice by {player} — by "interesting" I mean bad.',
        '{player} absorbs {count} cards. A truly bold redistribution of wealth.',
        'And {player} folds like a lawn chair. Tragic. Iconic, but tragic.',
      ],
      finishedSelf: [
        'Hand empty, mission complete. As calculated.',
        'I finish first. Somewhere, a chess clock is applauding.',
      ],
      finishedOther: [
        '{player} finishes early — I suppose luck counts for something.',
        'Well played, {player}. Annoyingly well played.',
      ],
      gameOverDurakSelf: [
        'I am the Durak. Statistically improbable, personally devastating.',
        'Fine. I miscalculated. It happens to grandmasters too. Rarely.',
      ],
      gameOverDurakOther: [
        '{player} is the Durak. My analysis was correct all along.',
        'And {player} takes the crown of fool. I called it in round two.',
        'The Durak is {player}. I\'d offer condolences, but I did warn you.',
      ],
    },
  },
};
