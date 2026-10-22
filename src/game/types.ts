/** Plain, JSON-safe shapes. A future room server can store and broadcast these. */

export type CardKind = 'character' | 'attribute';

/** `attribute` cards are the powers dealt beside characters. */
export type DeckId =
  | 'house'
  | 'fantasy'
  | 'sci-fi'
  | 'horror'
  | 'anime'
  | 'everyday'
  | 'absurd';

export type GameCard = {
  id: string;
  kind: CardKind;
  title: string;
  detail: string;
};

export type Player = {
  id: string;
  name: string;
  score: number;
};

export type Hand = {
  characters: GameCard[];
  attributes: GameCard[];
};

export type Draft = {
  characterId?: string;
  attributeId?: string;
};

export type Build = {
  playerId: string;
  character: GameCard;
  attribute: GameCard;
};

export type Vote = {
  judgeId: string;
  choiceId: string;
};

export type RoundResult = {
  roundNumber: number;
  fighterIds: [string, string];
  builds: [Build, Build];
  votes: Vote[];
  /** Null when the judges split and nobody scores. */
  winnerId: string | null;
  tally: Record<string, number>;
};

export type Phase =
  | { type: 'pass'; fighterIndex: 0 | 1 }
  | { type: 'pick-character'; fighterIndex: 0 | 1 }
  | { type: 'pick-attribute'; fighterIndex: 0 | 1 }
  | { type: 'confirm-build'; fighterIndex: 0 | 1 }
  | { type: 'matchup' }
  | { type: 'pass-judge'; judgeIndex: number }
  | { type: 'vote'; judgeIndex: number }
  | { type: 'result' };

/**
 * Everything the phone knows about the table.
 * Local play keeps hidden hands here. Do not send this object to other
 * clients; send `PlayerView` from `projectForPlayer` instead.
 */
export type GameSession = {
  players: Player[];
  roundNumber: number;
  fighterIds: [string, string];
  hands: Record<string, Hand>;
  drafts: Record<string, Draft>;
  builds: Partial<Record<string, Build>>;
  votes: Vote[];
  history: RoundResult[];
  phase: Phase;
  /** House deck plus any expansions switched on before the game. */
  deckIds: DeckId[];
};

/** What one player is allowed to know. Safe to send over the network later. */
export type PlayerView = {
  youId: string;
  players: Player[];
  roundNumber: number;
  fighterIds: [string, string];
  phase: Phase;
  yourHand: Hand | null;
  yourDraft: Draft | null;
  revealedBuilds: Partial<Record<string, Build>>;
  revealedVotes: Vote[] | null;
  tally: Record<string, number> | null;
  history: RoundResult[];
};

export type GameAction =
  | { type: 'acknowledge-pass' }
  | { type: 'select-character'; cardId: string }
  | { type: 'confirm-character' }
  | { type: 'select-attribute'; cardId: string }
  | { type: 'confirm-attribute' }
  | { type: 'revise-build' }
  | { type: 'lock-build' }
  | { type: 'call-vote' }
  | { type: 'acknowledge-judge' }
  | { type: 'cast-vote'; choiceId: string }
  | { type: 'next-round' };
