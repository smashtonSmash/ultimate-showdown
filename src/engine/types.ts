/** Plain JSON data. Everything here survives JSON.stringify for saving the table. */

export type DeckId = 'house' | 'fantasy' | 'sci-fi' | 'horror' | 'anime' | 'everyday' | 'absurd';
export type MatchMode = '1v1' | '1v1v1' | '2v2';
export type PlayStyle = 'free' | 'tournament' | 'king';

export type Card = { id: string; kind: 'character' | 'power'; title: string; detail: string };
export type Contest = { id: string; title: string; detail: string };

export type Player = { id: string; name: string; score: number };

/** One fighter or one team. Solo side ids are the player id. */
export type Side = { id: string; playerIds: string[] };

export type Hand = { characters: Card[]; powers: Card[] };
export type Picks = { character?: string; power?: string };
export type Build = { playerId: string; character: Card; power: Card };

export type RoundResult = {
  round: number;
  mode: MatchMode;
  sides: Side[];
  builds: Build[];
  /** judgeId -> sideId, for the vote that settled it. */
  votes: Record<string, string>;
  tally: Record<string, number>;
  winnerId: string;
  /** Every contest drawn this round, in order. */
  contests: Contest[];
  satOut: string[];
};

export type BracketMatch = {
  id: string;
  round: number;
  index: number;
  playerIds: [string | null, string | null];
  winnerId: string | null;
  bye: boolean;
};
export type Bracket = { matches: BracketMatch[]; currentId: string | null };

export type Phase =
  | { type: 'handoff'; fighter: number }
  | { type: 'build'; fighter: number; step: 'character' | 'power' | 'review' }
  | { type: 'matchup' }
  | { type: 'judge-handoff'; judge: number }
  | { type: 'ballot'; judge: number }
  | { type: 'contest' }
  | { type: 'result' }
  | { type: 'lineup' }
  | { type: 'announce' }
  | { type: 'champion' };

export type Game = {
  players: Player[];
  decks: DeckId[];
  mode: MatchMode;
  style: PlayStyle;
  round: number;
  fighters: string[];
  sides: Side[];
  hands: Record<string, Hand>;
  picks: Record<string, Picks>;
  builds: Record<string, Build>;
  /** Judges for the current ballot, in seat order. */
  queue: string[];
  votes: Record<string, string>;
  /** Tied sides on a revote. Empty means every side is on the ballot. */
  contenders: string[];
  /** Judges skipped this round. They stay out of revotes too. */
  satOut: string[];
  contests: Contest[];
  contestPile: string[];
  kingId: string | null;
  kingStreak: number;
  hillCursor: number;
  bracket: Bracket | null;
  suggested: string[];
  history: RoundResult[];
  phase: Phase;
};

export type Action =
  | { type: 'ready' } // handoff -> build
  | { type: 'pick'; cardId: string }
  | { type: 'next-step' } // character -> power -> review
  | { type: 'back-step' } // power -> character, review -> character
  | { type: 'lock' }
  | { type: 'call-vote' }
  | { type: 'judge-ready' }
  | { type: 'vote'; sideId: string }
  | { type: 'skip-judge' }
  | { type: 'revote' }
  | { type: 'continue' } // result -> lineup / announce / champion
  | { type: 'set-lineup'; fighterIds: string[] }
  | { type: 'begin-match' };
