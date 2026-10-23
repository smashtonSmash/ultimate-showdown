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

/** 1v1 is two fighters. 1v1v1 is a free-for-all. 2v2 is two teams of two. */
export type MatchMode = '1v1' | '1v1v1' | '2v2';

/** A vote target. Solo modes use the player id. A team shares one id. */
export type Side = {
  id: string;
  playerIds: string[];
};

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

/** A non-fighting contest drawn when a judge vote splits. */
export type TiebreakerCard = {
  id: string;
  title: string;
  detail: string;
};

export type RoundResult = {
  roundNumber: number;
  mode: MatchMode;
  fighterIds: string[];
  sides: Side[];
  builds: Build[];
  votes: Vote[];
  /** The deciding ballot's winning side. A split draws another contest instead of ending here. */
  winnerId: string | null;
  tally: Record<string, number>;
  /** Contests drawn after a split, in the order they were played. */
  tiebreakers: TiebreakerCard[];
};

export type Phase =
  | { type: 'pass'; fighterIndex: number }
  | { type: 'pick-character'; fighterIndex: number }
  | { type: 'pick-attribute'; fighterIndex: number }
  | { type: 'confirm-build'; fighterIndex: number }
  | { type: 'matchup' }
  | { type: 'tiebreaker' }
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
  mode: MatchMode;
  /** Fighters in rotation order. In 2v2 the first pair is Team A and the second is Team B. */
  fighterIds: string[];
  sides: Side[];
  /**
   * Side ids still on a tiebreak ballot. Empty means every side is eligible,
   * which is also the state of the opening vote.
   */
  contenderIds: string[];
  hands: Record<string, Hand>;
  drafts: Record<string, Draft>;
  builds: Partial<Record<string, Build>>;
  votes: Vote[];
  history: RoundResult[];
  phase: Phase;
  /** House deck plus any expansions switched on before the game. */
  deckIds: DeckId[];
  /** Remaining tiebreaker card ids, in draw order. */
  tiebreakerPile: string[];
  /** Contests drawn during the current showdown. The last one is on the table. */
  tiebreakers: TiebreakerCard[];
};

/** What one player is allowed to know. Safe to send over the network later. */
export type PlayerView = {
  youId: string;
  players: Player[];
  roundNumber: number;
  mode: MatchMode;
  fighterIds: string[];
  sides: Side[];
  contenderIds: string[];
  phase: Phase;
  yourHand: Hand | null;
  yourDraft: Draft | null;
  revealedBuilds: Partial<Record<string, Build>>;
  revealedVotes: Vote[] | null;
  tally: Record<string, number> | null;
  history: RoundResult[];
  tiebreakers: TiebreakerCard[];
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
  | { type: 'start-tiebreak-vote' }
  | { type: 'next-round' };
