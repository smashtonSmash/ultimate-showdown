/**
 * Rules kernel for The Ultimate Showdown.
 *
 * Screens dispatch actions. A future room server can import this file and
 * apply the same actions. There is no React and no I/O in here.
 *
 * The full session includes hidden hands because local pass-and-play uses
 * one phone as the table. `projectForPlayer` is the view that is safe to
 * send to a single client.
 */
import { normalizeDeckIds, poolForDecks } from '../data/decks';
import type {
  Build,
  DeckId,
  Draft,
  GameAction,
  GameCard,
  GameSession,
  Hand,
  Phase,
  Player,
  PlayerView,
  RoundResult,
  Vote,
} from './types';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 8;
export const HAND_SIZE = 3;
export const MAX_NAME_LENGTH = 18;

export type Rng = () => number;

export function validateNames(names: readonly string[]): string | null {
  const cleaned = names.map((name) => name.trim());
  if (cleaned.some((name) => name.length === 0)) {
    return 'Every seat needs a name.';
  }
  if (cleaned.length < MIN_PLAYERS) {
    return `Add at least ${MIN_PLAYERS} players. Two fight, and someone has to judge.`;
  }
  if (cleaned.length > MAX_PLAYERS) {
    return `Keep the table to ${MAX_PLAYERS} players.`;
  }
  if (cleaned.some((name) => name.length > MAX_NAME_LENGTH)) {
    return `Keep each name to ${MAX_NAME_LENGTH} characters.`;
  }
  const folded = cleaned.map((name) => name.toLocaleLowerCase());
  if (new Set(folded).size !== folded.length) {
    return 'Two players cannot share a name.';
  }
  return null;
}

export function createSession(
  names: readonly string[],
  rng: Rng = Math.random,
  deckIds: readonly DeckId[] = ['house'],
): GameSession {
  const cleaned = names.map((name) => name.trim());
  const problem = validateNames(cleaned);
  if (problem) {
    throw new Error(problem);
  }
  const players = cleaned.map((name, index) => ({
    id: `player-${index + 1}`,
    name,
    score: 0,
  }));
  return openRound({ players, history: [], deckIds: normalizeDeckIds(deckIds) }, 0, rng);
}

export function reduce(
  state: GameSession,
  action: GameAction,
  rng: Rng = Math.random,
): GameSession {
  switch (action.type) {
    case 'acknowledge-pass':
      if (state.phase.type !== 'pass') return state;
      return {
        ...state,
        phase: { type: 'pick-character', fighterIndex: state.phase.fighterIndex },
      };
    case 'select-character':
      return selectFromHand(state, 'pick-character', 'characters', 'characterId', action.cardId);
    case 'confirm-character':
      return confirmPick(state, 'pick-character', 'characterId', 'pick-attribute');
    case 'select-attribute':
      return selectFromHand(state, 'pick-attribute', 'attributes', 'attributeId', action.cardId);
    case 'confirm-attribute':
      return confirmPick(state, 'pick-attribute', 'attributeId', 'confirm-build');
    case 'revise-build':
      if (state.phase.type !== 'confirm-build') return state;
      return {
        ...state,
        phase: { type: 'pick-character', fighterIndex: state.phase.fighterIndex },
      };
    case 'lock-build':
      return lockBuild(state);
    case 'call-vote':
      if (state.phase.type !== 'matchup') return state;
      if (!state.builds[state.fighterIds[0]] || !state.builds[state.fighterIds[1]]) return state;
      if (getJudges(state).length === 0) return state;
      return { ...state, votes: [], phase: { type: 'pass-judge', judgeIndex: 0 } };
    case 'acknowledge-judge':
      if (state.phase.type !== 'pass-judge') return state;
      return { ...state, phase: { type: 'vote', judgeIndex: state.phase.judgeIndex } };
    case 'cast-vote':
      return castVote(state, action.choiceId);
    case 'next-round':
      if (state.phase.type !== 'result') return state;
      return openRound(
        { players: state.players, history: state.history, deckIds: state.deckIds },
        state.roundNumber,
        rng,
      );
    default: {
      const unreachable: never = action;
      return unreachable;
    }
  }
}

export function getPlayer(state: GameSession, id: string): Player {
  const player = state.players.find((entry) => entry.id === id);
  if (!player) {
    throw new Error(`Unknown player ${id}`);
  }
  return player;
}

export function getJudges(state: GameSession): Player[] {
  return state.players.filter((player) => !state.fighterIds.includes(player.id));
}

export function getHand(state: GameSession, playerId: string): Hand {
  const hand = state.hands[playerId];
  if (!hand) {
    throw new Error(`No hand for ${playerId}`);
  }
  return hand;
}

export function getBuild(state: GameSession, playerId: string): Build {
  const build = state.builds[playerId];
  if (!build) {
    throw new Error(`No build for ${playerId}`);
  }
  return build;
}

export function playerForPhase(state: GameSession): Player | null {
  const phase = state.phase;
  switch (phase.type) {
    case 'pass':
    case 'pick-character':
    case 'pick-attribute':
    case 'confirm-build':
      return getPlayer(state, state.fighterIds[phase.fighterIndex]);
    case 'pass-judge':
    case 'vote':
      return getJudges(state)[phase.judgeIndex] ?? null;
    case 'matchup':
    case 'result':
      return null;
    default: {
      const unreachable: never = phase;
      return unreachable;
    }
  }
}

export function peekNextFighters(state: GameSession): [Player, Player] {
  const ids = pairForRound(state.players, state.roundNumber + 1);
  return [getPlayer(state, ids[0]), getPlayer(state, ids[1])];
}

export function latestResult(state: GameSession): RoundResult | null {
  return state.history[state.history.length - 1] ?? null;
}

export function tallyVotes(
  votes: readonly Vote[],
  fighterIds: readonly [string, string],
): Record<string, number> {
  const tally: Record<string, number> = {
    [fighterIds[0]]: 0,
    [fighterIds[1]]: 0,
  };
  for (const vote of votes) {
    if (Object.prototype.hasOwnProperty.call(tally, vote.choiceId)) {
      tally[vote.choiceId] += 1;
    }
  }
  return tally;
}

export function decideWinner(
  tally: Record<string, number>,
  fighterIds: readonly [string, string],
): string | null {
  const left = tally[fighterIds[0]] ?? 0;
  const right = tally[fighterIds[1]] ?? 0;
  if (left === right) return null;
  return left > right ? fighterIds[0] : fighterIds[1];
}

export function projectForPlayer(state: GameSession, viewerId: string): PlayerView {
  const youAreBuilding = isActiveBuilder(state, viewerId);
  const hand = youAreBuilding ? state.hands[viewerId] : undefined;
  const draft = youAreBuilding ? state.drafts[viewerId] : undefined;
  const publicBuilds = buildsArePublic(state.phase);
  const revealedBuilds: Partial<Record<string, Build>> = {};
  if (publicBuilds) {
    for (const id of state.fighterIds) {
      const build = state.builds[id];
      if (build) revealedBuilds[id] = build;
    }
  } else if (state.builds[viewerId]) {
    revealedBuilds[viewerId] = state.builds[viewerId];
  }

  const result = state.phase.type === 'result' ? latestResult(state) : null;

  return {
    youId: viewerId,
    players: state.players.map((player) => ({ ...player })),
    roundNumber: state.roundNumber,
    fighterIds: state.fighterIds,
    phase: state.phase,
    yourHand: hand
      ? {
          characters: hand.characters.map(cloneCard),
          attributes: hand.attributes.map(cloneCard),
        }
      : null,
    yourDraft: draft ? { ...draft } : null,
    revealedBuilds,
    revealedVotes: result ? result.votes.map((vote) => ({ ...vote })) : null,
    tally: result ? { ...result.tally } : null,
    history: state.history.slice(),
  };
}

function openRound(
  table: { players: Player[]; history: RoundResult[]; deckIds: readonly DeckId[] },
  completedRounds: number,
  rng: Rng,
): GameSession {
  const roundNumber = completedRounds + 1;
  const deckIds = normalizeDeckIds(table.deckIds);
  const pool = poolForDecks(deckIds);
  if (pool.characters.length < HAND_SIZE * 2 || pool.attributes.length < HAND_SIZE * 2) {
    throw new Error('The deal needs at least six characters and six powers.');
  }
  const fighterIds = pairForRound(table.players, roundNumber);
  const characters = shuffle(pool.characters, rng);
  const attributes = shuffle(pool.attributes, rng);
  const hands: Record<string, Hand> = {};
  const drafts: Record<string, Draft> = {};
  fighterIds.forEach((id, index) => {
    const start = index * HAND_SIZE;
    hands[id] = {
      characters: characters.slice(start, start + HAND_SIZE).map(cloneCard),
      attributes: attributes.slice(start, start + HAND_SIZE).map(cloneCard),
    };
    drafts[id] = {};
  });
  return {
    players: table.players,
    roundNumber,
    fighterIds,
    hands,
    drafts,
    builds: {},
    votes: [],
    history: table.history,
    phase: { type: 'pass', fighterIndex: 0 },
    deckIds,
  };
}

function pairForRound(players: readonly Player[], roundNumber: number): [string, string] {
  const count = players.length;
  const first = (roundNumber - 1) % count;
  const second = roundNumber % count;
  return [players[first].id, players[second].id];
}

/** Round 1 of a new table: the same pair `createSession` deals, and everyone else judging. */
export function openingLineup(names: readonly string[]): {
  fighters: readonly [string, string];
  judges: readonly string[];
} {
  const players = names.map((name, index) => ({
    id: `player-${index + 1}`,
    name: name.trim(),
    score: 0,
  }));
  const [leftId, rightId] = pairForRound(players, 1);
  const left = players.find((player) => player.id === leftId);
  const right = players.find((player) => player.id === rightId);
  if (!left || !right) {
    throw new Error('A showdown needs two fighters.');
  }
  return {
    fighters: [left.name, right.name],
    judges: players
      .filter((player) => player.id !== leftId && player.id !== rightId)
      .map((player) => player.name),
  };
}

function selectFromHand(
  state: GameSession,
  phaseType: 'pick-character' | 'pick-attribute',
  pile: 'characters' | 'attributes',
  field: 'characterId' | 'attributeId',
  cardId: string,
): GameSession {
  if (state.phase.type !== phaseType) return state;
  const fighterId = state.fighterIds[state.phase.fighterIndex];
  const hand = state.hands[fighterId];
  if (!hand?.[pile].some((card) => card.id === cardId)) return state;
  return {
    ...state,
    drafts: {
      ...state.drafts,
      [fighterId]: { ...state.drafts[fighterId], [field]: cardId },
    },
  };
}

function confirmPick(
  state: GameSession,
  phaseType: 'pick-character' | 'pick-attribute',
  field: 'characterId' | 'attributeId',
  next: 'pick-attribute' | 'confirm-build',
): GameSession {
  if (state.phase.type !== phaseType) return state;
  const fighterId = state.fighterIds[state.phase.fighterIndex];
  const selected = state.drafts[fighterId]?.[field];
  const pile = field === 'characterId' ? 'characters' : 'attributes';
  const hand = state.hands[fighterId];
  if (!selected || !hand?.[pile].some((card) => card.id === selected)) return state;
  return {
    ...state,
    phase: { type: next, fighterIndex: state.phase.fighterIndex },
  };
}

function lockBuild(state: GameSession): GameSession {
  if (state.phase.type !== 'confirm-build') return state;
  const fighterIndex = state.phase.fighterIndex;
  const fighterId = state.fighterIds[fighterIndex];
  const draft = state.drafts[fighterId];
  const hand = state.hands[fighterId];
  const character = hand?.characters.find((card) => card.id === draft?.characterId);
  const attribute = hand?.attributes.find((card) => card.id === draft?.attributeId);
  if (!character || !attribute) return state;
  const builds: Partial<Record<string, Build>> = {
    ...state.builds,
    [fighterId]: {
      playerId: fighterId,
      character: cloneCard(character),
      attribute: cloneCard(attribute),
    },
  };
  if (fighterIndex === 0) {
    return { ...state, builds, phase: { type: 'pass', fighterIndex: 1 } };
  }
  return { ...state, builds, phase: { type: 'matchup' } };
}

function castVote(state: GameSession, choiceId: string): GameSession {
  if (state.phase.type !== 'vote') return state;
  if (!state.fighterIds.includes(choiceId)) return state;
  const judges = getJudges(state);
  const judge = judges[state.phase.judgeIndex];
  if (!judge) return state;
  const votes = [
    ...state.votes.filter((vote) => vote.judgeId !== judge.id),
    { judgeId: judge.id, choiceId },
  ];
  const nextIndex = state.phase.judgeIndex + 1;
  if (nextIndex < judges.length) {
    return { ...state, votes, phase: { type: 'pass-judge', judgeIndex: nextIndex } };
  }
  return finishRound({ ...state, votes });
}

function finishRound(state: GameSession): GameSession {
  const tally = tallyVotes(state.votes, state.fighterIds);
  const winnerId = decideWinner(tally, state.fighterIds);
  const result: RoundResult = {
    roundNumber: state.roundNumber,
    fighterIds: state.fighterIds,
    builds: [getBuild(state, state.fighterIds[0]), getBuild(state, state.fighterIds[1])],
    votes: state.votes.map((vote) => ({ ...vote })),
    winnerId,
    tally,
  };
  return {
    ...state,
    players: state.players.map((player) =>
      player.id === winnerId ? { ...player, score: player.score + 1 } : player,
    ),
    history: [...state.history, result],
    phase: { type: 'result' },
  };
}

function buildsArePublic(phase: Phase): boolean {
  return (
    phase.type === 'matchup' ||
    phase.type === 'pass-judge' ||
    phase.type === 'vote' ||
    phase.type === 'result'
  );
}

function isActiveBuilder(state: GameSession, viewerId: string): boolean {
  const phase = state.phase;
  if (
    phase.type !== 'pick-character' &&
    phase.type !== 'pick-attribute' &&
    phase.type !== 'confirm-build'
  ) {
    return false;
  }
  return state.fighterIds[phase.fighterIndex] === viewerId;
}

function cloneCard(card: GameCard): GameCard {
  return { id: card.id, kind: card.kind, title: card.title, detail: card.detail };
}

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.min(index, Math.floor(rng() * (index + 1)));
    const current = copy[index];
    copy[index] = copy[swap] as T;
    copy[swap] = current as T;
  }
  return copy;
}
