import type { DeckId, GameCard } from '../../game/types';

type CardTuple = readonly [id: string, title: string, detail: string];

export function deckCards(
  deckId: DeckId,
  characters: readonly CardTuple[],
  powers: readonly CardTuple[],
): { characters: GameCard[]; attributes: GameCard[] } {
  return {
    characters: characters.map(([id, title, detail]) => ({
      id: `${deckId}.character.${id}`,
      kind: 'character',
      title,
      detail,
    })),
    attributes: powers.map(([id, title, detail]) => ({
      id: `${deckId}.attribute.${id}`,
      kind: 'attribute',
      title,
      detail,
    })),
  };
}
