import type { TiebreakerCard } from '../game/types';

/**
 * Drawn only when a judge vote splits. Each card is a contest, not a fight.
 * The deck is always in the box. It is not an expansion you toggle.
 */
const cards: readonly (readonly [string, string, string])[] = [
  ['basketball', 'A team of your character vs. a team of theirs in basketball', 'Five of each. The hoop has agreed to stay neutral.'],
  ['baseball', 'A team of your character vs. a team of theirs in baseball', 'Nine innings. The mascot is also them.'],
  ['soccer', 'A team of your character vs. a team of theirs in soccer', 'The ball is round. The grudge is not.'],
  ['hockey', 'Your character vs. theirs in a hockey game', 'The ice is fair. The elbows are only a rumor.'],
  ['tennis', 'Your character vs. theirs in a tennis match', 'Love means zero, and it feels personal.'],
  ['golf', 'Your character vs. theirs in golf', 'Eighteen holes. A whisper still counts as trash talk.'],
  ['bowling', 'Your character vs. theirs in bowling', 'Ten pins. The gutter is a personality test.'],
  ['race', 'Your character vs. theirs in a foot race', 'First to the cone. Nobody may tackle the cone.'],
  ['swim', 'Your character vs. theirs in a swimming race', 'The lane is straight. The splash is an opinion.'],
  ['marathon', 'Your character vs. theirs in a marathon', 'Twenty-six miles of refusing to look tired.'],
  ['cooking', 'Your character vs. theirs in a cooking contest', 'One stove, two egos, and judges who are hungry.'],
  ['baking', 'Your character vs. theirs in a baking contest', 'The timer dings. The frosting tells the truth.'],
  ['dance', 'Your character vs. theirs in a dance-off', 'The floor is the argument. Nobody may punch it.'],
  ['karaoke', 'Your character vs. theirs in karaoke', 'One microphone. The key is a fight about pitch.'],
  ['chess', 'Your character vs. theirs in chess', 'Quiet pieces. Extremely loud regrets.'],
  ['hotdogs', 'Your character vs. theirs in a hot dog eating contest', 'The buns are the clock. Chewing is the strategy.'],
  ['spelling', 'Your character vs. theirs in a spelling bee', 'The word is long. The pride is longer.'],
  ['trivia', 'Your character vs. theirs in a trivia contest', 'The buzzer rewards whoever actually read the plaque.'],
  ['poetry', 'Your character vs. theirs in a poetry slam', 'Two minutes. The metaphor may not throw hands.'],
  ['talent', 'Your character vs. theirs in a talent show', 'One act each. The crowd came hoping for a disaster.'],
];

export const TIEBREAKERS: readonly TiebreakerCard[] = cards.map(([id, title, detail]) => ({
  id: `tiebreaker.${id}`,
  title,
  detail,
}));

const byId = new Map(TIEBREAKERS.map((card) => [card.id, card]));

export function tiebreakerById(id: string): TiebreakerCard {
  const card = byId.get(id);
  if (!card) {
    throw new Error(`Unknown tiebreaker ${id}`);
  }
  return card;
}
