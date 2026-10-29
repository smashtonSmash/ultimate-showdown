import raw from '../data/cards.json';
import type { Card, Contest, DeckId } from './types';

export type Deck = {
  id: DeckId;
  title: string;
  blurb: string;
  optional: boolean;
  characters: Card[];
  powers: Card[];
};

type RawCard = { id: string; title: string; detail: string };
type RawDeck = { id: string; title: string; blurb: string; optional: boolean; characters: RawCard[]; powers: RawCard[] };

/** House first, then the expansions in catalog order. */
export const DECKS: Deck[] = (raw.decks as RawDeck[]).map((d) => ({
  id: d.id as DeckId,
  title: d.title,
  blurb: d.blurb,
  optional: d.optional,
  characters: d.characters.map((c) => ({ ...c, kind: 'character' as const })),
  powers: d.powers.map((c) => ({ ...c, kind: 'power' as const })),
}));

export const CONTESTS: Contest[] = raw.tiebreakers;

const byId = new Map(DECKS.map((d) => [d.id, d]));
const contestById = new Map(CONTESTS.map((c) => [c.id, c]));

{
  const seen = new Set<string>();
  for (const deck of DECKS) {
    if (deck.characters.length < 20 || deck.powers.length < 20) {
      throw new Error(`${deck.title} needs at least 20 characters and 20 powers.`);
    }
    for (const card of [...deck.characters, ...deck.powers]) {
      if (seen.has(card.id)) throw new Error(`Duplicate card id ${card.id}`);
      seen.add(card.id);
    }
  }
}

export function getContest(id: string): Contest {
  const c = contestById.get(id);
  if (!c) throw new Error(`Unknown contest ${id}`);
  return c;
}

/** Adds the house deck, drops unknown ids, and sorts into catalog order. */
export function normalizeDecks(ids: readonly string[]): DeckId[] {
  const wanted = new Set<string>([...ids, 'house']);
  return DECKS.filter((d) => wanted.has(d.id)).map((d) => d.id);
}

export function cardPool(ids: readonly DeckId[]): { characters: Card[]; powers: Card[] } {
  const characters: Card[] = [];
  const powers: Card[] = [];
  for (const id of normalizeDecks(ids)) {
    const deck = byId.get(id)!;
    characters.push(...deck.characters);
    powers.push(...deck.powers);
  }
  return { characters, powers };
}

export function deckTitle(id: DeckId): string {
  return byId.get(id)?.title ?? id;
}
