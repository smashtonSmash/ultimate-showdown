import { animeCharacterAdditions } from './ashton';
import { deckCards } from './build';

const characters = [
  ['transfer', 'Transfer student with a soundtrack', 'The speakers are unplugged. The melody arrives anyway.'],
  ['president', 'Club president of one', 'The roster is a promise and a snack budget.'],
  ['rival', 'Lunch-break rival', 'Trains between bites. The score is personal and kind.'],
  ['intern', 'Magical-girl intern', 'The transformation is still in beta. The bow is sincere.'],
  ['pilot', 'Escalator-shy mecha pilot', 'Fine with cockpit ladders. Escalators feel like a betrayal.'],
  ['chef', 'Broth-stand mediator', 'Serves bowls until both sides remember they were hungry.'],
  ['monitor', 'Hall monitor of destiny', 'Writes people up for running, including fate.'],
  ['friend', 'Map-keeping childhood friend', 'The map is of a summer that has not finished.'],
  ['alternate', 'Tournament alternate', 'Listed as maybe. Shows up in full uniform anyway.'],
  ['fox', 'Spirit-fox errand runner', 'Delivers packages, plus unsolicited life advice.'],
  ['philosopher', 'Rooftop philosopher', 'Eats bread and explains the sky to anyone who sits.'],
  ['manager', 'Manager of a tiny duo', 'Believes in the chorus. The chorus believes back.'],
  ['assistant', 'Dojo plant assistant', 'Waters the plants. The plants are undefeated.'],
  ['hero', 'Weekend-pass hero', 'Saves the day, then catches the last train.'],
  ['prodigy', 'Notebook prodigy', 'Strategies in the margins. Doodles in the plan.'],
  ['mascot', 'Mascot who lifts', 'The costume has pockets. The pockets have resolve.'],
  ['keeper', 'Alley shrine keeper', 'Sweeps the steps. The steps remember.'],
  ['sibling', "Rival's younger sibling", 'Came to watch, then stayed to win.'],
  ['summoner', 'Art-club summoner', 'Draws a helper. It climbs off the page, cranky and loyal.'],
  ['runner', 'Closing-credits runner', 'Always in frame when the music swells, even at a bus stop.'],
  ['spiky', 'A spiky-haired anime fighter', 'The hair enters the fight first.'],
  ['spark', 'An electric pocket monster', 'Fits in a pocket. The pocket regrets it.'],
  ...animeCharacterAdditions,
] as const;

const powers = [
  ['song', 'Theme-song pocket', 'May start a chorus. Allies stand up straighter.'],
  ['crumb', 'Montage crumb', 'One bite contains a summer of practice.'],
  ['clipboard', 'Friendship clipboard', 'Names on the list fight harder when read aloud.'],
  ['pin', 'Transformation hairpin', 'A click, a glow, and slightly more confident shoes.'],
  ['band', 'Spare headband', 'Worn, it refuses to quit before the other person does.'],
  ['mallet', 'Speech-bubble mallet', 'Emphasis only. It bonks pride, not people.'],
  ['bento', 'Typed bento', 'Each compartment answers a different kind of problem.'],
  ['leap', 'Slow-motion leap', 'Time stretches for the cool part, then sends a bill.'],
  ['stamp', 'Catchphrase stamp', 'Saying it once makes the next try count double in spirit.'],
  ['pager', 'Spirit pager', 'Something fluffy arrives. Breaks are in the contract.'],
  ['wind', 'Recap wind', 'A breeze that retells the situation more kindly.'],
  ['showing', 'Power of showing up', 'Being present helps. Leaving early cancels it.'],
  ['pose', 'Duo pose', 'Two people, one stance. The stance is the argument.'],
  ['ticket', 'Flashback ticket', 'May replay one kinder memory and borrow its nerve.'],
  ['pencil', 'Bracket pencil', 'Can redraw a single matchup, once, in graphite.'],
  ['echo', 'Monologue echo', 'The quiet plan becomes audible to allies.'],
  ['scarf', 'Long-arc scarf', 'Frays a little each fight and still holds.'],
  ['can', 'Lucky vending can', 'The right drink drops. It is almost what you wanted.'],
  ['courtesy', 'Announced finisher', 'Calls the big moment early enough for everyone to brace.'],
  ['umbrella', 'Credits umbrella', 'When it opens, the scene agrees to end well.'],
] as const;

export const animeDeck = {
  id: 'anime' as const,
  title: 'Anime',
  blurb: 'Rivals, theme songs, and one more training arc.',
  optional: true,
  ...deckCards('anime', characters, powers),
};
