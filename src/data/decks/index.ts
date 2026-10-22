import { ATTRIBUTES, CHARACTERS } from '../cards';
import { absurdDeck } from './absurd';
import { animeDeck } from './anime';
import { everydayDeck } from './everyday';
import { fantasyDeck } from './fantasy';
import { horrorDeck } from './horror';
import { scifiDeck } from './scifi';
import type { DeckId, GameCard } from '../../game/types';

export type CardDeck = {
  id: DeckId;
  title: string;
  blurb: string;
  /** Expansions can be switched off. The house deck stays in the deal. */
  optional: boolean;
  characters: readonly GameCard[];
  attributes: readonly GameCard[];
};

export const houseDeck: CardDeck = {
  id: 'house',
  title: 'House deck',
  blurb: "The table's own cards. Always shuffled in.",
  optional: false,
  characters: CHARACTERS,
  attributes: ATTRIBUTES,
};

export const DECKS: readonly CardDeck[] = [
  houseDeck,
  fantasyDeck,
  scifiDeck,
  horrorDeck,
  animeDeck,
  everydayDeck,
  absurdDeck,
];

const deckById = new Map(DECKS.map((deck) => [deck.id, deck]));

for (const deck of DECKS) {
  if (deck.characters.length < 20 || deck.attributes.length < 20) {
    throw new Error(`${deck.title} needs at least 20 characters and 20 powers.`);
  }
}

const seenIds = new Set<string>();
for (const deck of DECKS) {
  for (const card of [...deck.characters, ...deck.attributes]) {
    if (seenIds.has(card.id)) {
      throw new Error(`Duplicate card id ${card.id}`);
    }
    seenIds.add(card.id);
  }
}

export function isDeckId(value: string): value is DeckId {
  return deckById.has(value as DeckId);
}

/** House deck first, then expansions in catalog order. Unknown ids throw. */
export function normalizeDeckIds(ids: readonly DeckId[]): DeckId[] {
  for (const id of ids) {
    if (!deckById.has(id)) {
      throw new Error(`Unknown deck: ${id}`);
    }
  }
  const wanted = new Set<DeckId>(ids);
  wanted.add('house');
  return DECKS.filter((deck) => wanted.has(deck.id)).map((deck) => deck.id);
}

export function poolForDecks(ids: readonly DeckId[]): {
  characters: GameCard[];
  attributes: GameCard[];
} {
  const enabled = normalizeDeckIds(ids);
  const characters: GameCard[] = [];
  const attributes: GameCard[] = [];
  for (const id of enabled) {
    const deck = deckById.get(id);
    if (!deck) continue;
    characters.push(...deck.characters);
    attributes.push(...deck.attributes);
  }
  return { characters, attributes };
}

export function deckSummary(ids: readonly DeckId[]): string {
  const enabled = normalizeDeckIds(ids);
  const extras = enabled
    .filter((id) => id !== 'house')
    .map((id) => deckById.get(id)?.title)
    .filter((title): title is string => Boolean(title));
  if (extras.length === 0) return 'House deck';
  return `House + ${extras.join(', ')}`;
}
