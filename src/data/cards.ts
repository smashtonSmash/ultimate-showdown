import type { GameCard } from '../game/types';
import { houseCharacterAdditions, housePowerAdditions } from './decks/ashton';

/**
 * House deck for local play. Themed expansions live in src/data/decks.
 * These titles are original placeholders for The Ultimate Showdown.
 */

function character(id: string, title: string, detail: string): GameCard {
  return { id: `house.character.${id}`, kind: 'character', title, detail };
}

function attribute(id: string, title: string, detail: string): GameCard {
  return { id: `house.attribute.${id}`, kind: 'attribute', title, detail };
}

export const CHARACTERS: readonly GameCard[] = [
  character(
    'lighthouse',
    'Retired lighthouse keeper',
    'Left the lamp lit, just in case.',
  ),
  character(
    'raccoon',
    'Night-market raccoon',
    'Opens the stalls after the humans go home.',
  ),
  character(
    'cellist',
    'Traffic-cone cellist',
    'On tour. The venue is wherever the cone fits.',
  ),
  character(
    'mayor',
    'Thursday mayor',
    'Their town exists one day a week, and they never miss it.',
  ),
  character(
    'intern',
    'Sleep-clinic intern',
    'Hour nineteen. The clinic has not clocked the irony.',
  ),
  character(
    'pianist',
    'Elevator pianist',
    'Perfect pitch. The building has opinions.',
  ),
  character(
    'librarian',
    'Floating librarian',
    'Last clerk on a library that refuses to dock.',
  ),
  character(
    'retriever',
    'Witness-protection retriever',
    'New name. Same urge to greet every stranger.',
  ),
  character(
    'chaser',
    'Puddle-shy storm chaser',
    'Drives toward thunder, as long as it stays off the pavement.',
  ),
  character(
    'understudy',
    'Dragon understudy',
    'Knows the role. Waiting for the real dragon to call out sick.',
  ),
  character(
    'pastry',
    'Buttercream negotiator',
    'Settles every dispute in frosting.',
  ),
  character(
    'janitor',
    'Space-museum janitor',
    'Night shift, mopping around the meteorites.',
  ),
  character(
    'napper',
    'Coached competitive napper',
    'Trains for sleep the way other people train for races.',
  ),
  character(
    'ghost',
    'Ghost of a missed train',
    'Still running for the 6:12.',
  ),
  character(
    'crossword',
    'Crossword diplomat',
    'Talks in clues and expects the room to answer.',
  ),
  character(
    'beekeeper',
    'Beekeeper of named bees',
    'Keeps a roll call. The bees keep one too.',
  ),
  character(
    'captain',
    'Accidental captain',
    'Hired as an intern. The ship had other plans.',
  ),
  character(
    'mime',
    'Filing-cabinet mime',
    'Silent, except for the paperwork.',
  ),
  character(
    'cook',
    'Practice-pool cook',
    'Feeds a submarine crew that has never left the training tank.',
  ),
  character(
    'referee',
    'Playground referee',
    'Unofficial, unpaid, and somehow always in charge.',
  ),
  character(
    'stuntman',
    'A kung fu movie stuntman',
    'Does the fall, then asks for another take.',
  ),
  character(
    'roundhouse',
    'A roundhouse-kicking action legend',
    'The kick arrives before the introduction.',
  ),
  character(
    'jumpsuit',
    'A martial arts master in a yellow jumpsuit',
    'The suit is the whole plan.',
  ),
  character(
    'wrestler',
    'A wrestler-turned-movie-star',
    'Enters every room like the lights just hit.',
  ),
  character(
    'pencil',
    'A famously nice action hero with a pencil',
    'Says please. The pencil does the rest.',
  ),
  character(
    'bat',
    'A billionaire bat vigilante',
    'Funds the night shift personally.',
  ),
  character(
    'crawler',
    'A wall-crawling teen hero',
    'Late for class, early to the ledge.',
  ),
  character('ninja', 'Ninja', 'Already in the room. Has been.'),
  character('pirate', 'Pirate', 'Keeps a map, a grudge, and decent manners aboard.'),
  character('cowboy', 'Cowboy', 'Tips the hat, then settles it.'),
  ...houseCharacterAdditions.map(([id, title, detail]) => character(id, title, detail)),
];

export const ATTRIBUTES: readonly GameCard[] = [
  attribute(
    'borrow',
    'Borrowed skill',
    'May borrow one talent from the person they are arguing with.',
  ),
  attribute(
    'pigeons',
    'Pigeon escort',
    'A loyal flock of city pigeons takes their side.',
  ),
  attribute(
    'doubt',
    'Doubt engine',
    'Grows stronger every time someone says they cannot.',
  ),
  attribute(
    'shoelace',
    'Shoelace pause',
    'Can stop a moment long enough to retie their shoes.',
  ),
  attribute(
    'vending',
    'Vending handshake',
    'Knows the secret handshake of every snack machine.',
  ),
  attribute(
    'compliment',
    'Compliment mend',
    'Recovers when praised, and stalls when ignored.',
  ),
  attribute(
    'dance',
    'Sudden ballroom',
    'Can turn any floor into a surprisingly good dance floor.',
  ),
  attribute(
    'spoon',
    'Correct spoon',
    'Carries a toolbox that always contains the right spoon.',
  ),
  attribute(
    'invisible',
    'Polite invisibility',
    'Invisible until they introduce themselves.',
  ),
  attribute(
    'weather',
    'Weather fluent',
    'Speaks fluent weather, and the weather answers.',
  ),
  attribute(
    'recruit',
    'Good-day recruit',
    'Can enlist one bystander who is having a great day.',
  ),
  attribute(
    'stare',
    'Statue stare',
    'Never loses a staring contest, including with statues.',
  ),
  attribute(
    'mail',
    'Mail-route strength',
    'Arms built by finishing the whole route.',
  ),
  attribute(
    'rewind',
    'Sentence rewind',
    'Can rewind the last sentence anyone said.',
  ),
  attribute(
    'bread',
    'Fresh-bread aura',
    'Smells like bread just out of the oven. It is very distracting.',
  ),
  attribute(
    'ferry',
    'Ferry whistle',
    'A whistle that summons a very punctual ferry.',
  ),
  attribute(
    'pockets',
    'Pocket swap',
    'Can trade pockets with someone across the room.',
  ),
  attribute(
    'monday',
    'Monday immunity',
    'Contractually unharmed by Mondays.',
  ),
  attribute(
    'glitter',
    'Selective glitter',
    'Leaves glitter that only the other fighter can see.',
  ),
  attribute(
    'question',
    'Honest question',
    'May ask the room one question that must be answered honestly.',
  ),
  attribute('fly', 'Can fly', 'Leaves the ground when the argument needs air.'),
  attribute('strength', 'Super strength', 'Lifts the heavy part, including the mood.'),
  attribute('lasers', 'Shoots lasers from their eyes', 'Looks at the problem until it glows.'),
  attribute('bazooka', 'Has a bazooka', 'Brought the loud option.'),
  ...housePowerAdditions.map(([id, title, detail]) => attribute(id, title, detail)),
];
