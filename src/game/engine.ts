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
import { TIEBREAKERS, tiebreakerById } from '../data/tiebreakers';
import type {
  Build,
  DeckId,
  Draft,
  GameAction,
  GameCard,
  GameSession,
  Hand,
  MatchMode,
  Phase,
  Player,
  PlayerView,
  RoundResult,
  Side,
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
    return `Add at least ${MIN_PLAYERS} players. Someone has to judge.`;
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

export type OpeningPick = {
  mode: MatchMode;
  fighters: readonly string[];
};

/** A 1v1 name pair, or a mode plus the fighters in team order. */
export type OpeningRequest = OpeningPick | readonly string[];

export function fighterCount(mode: MatchMode): number {
  if (mode === '1v1v1') return 3;
  if (mode === '2v2') return 4;
  return 2;
}

/** Fighters plus one judge who is not in the fight. */
export function minimumPlayers(mode: MatchMode): number {
  return fighterCount(mode) + 1;
}

export function modeAvailable(mode: MatchMode, playerCount: number): boolean {
  return playerCount >= minimumPlayers(mode) && playerCount <= MAX_PLAYERS;
}

export function isMatchMode(value: string | undefined): value is MatchMode {
  return value === '1v1' || value === '1v1v1' || value === '2v2';
}

export function matchupLabel(names: readonly string[], mode: MatchMode): string {
  if (mode === '2v2') {
    return `${names[0]} & ${names[1]} vs. ${names[2]} & ${names[3]}`;
  }
  if (mode === '1v1v1') {
    return `${names[0]} vs. ${names[1]} vs. ${names[2]}`;
  }
  return `${names[0]} vs. ${names[1]}`;
}

export function createSession(
  names: readonly string[],
  rng: Rng = Math.random,
  deckIds: readonly DeckId[] = ['house'],
  opening?: OpeningRequest,
): GameSession {
  const cleaned = names.map((name) => name.trim());
  const problem = validateNames(cleaned);
  if (problem) {
    throw new Error(problem);
  }
  const resolved = resolveOpening(cleaned, opening);
  const seated = seatOpening(cleaned, resolved.fighters);
  const players = seated.map((name, index) => ({
    id: `player-${index + 1}`,
    name,
    score: 0,
  }));
  return openRound(
    { players, history: [], deckIds: normalizeDeckIds(deckIds), mode: resolved.mode },
    0,
    rng,
  );
}

/** Put the chosen fighters first, in the order they fight. The rest keep their seats. */
export function seatOpening(names: readonly string[], fighters: readonly string[]): string[] {
  if (
    new Set(fighters).size !== fighters.length ||
    fighters.some((name) => !names.includes(name))
  ) {
    throw new Error('Pick fighters who are at the table.');
  }
  const fighting = new Set(fighters);
  return [...fighters, ...names.filter((name) => !fighting.has(name))];
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
      if (!state.fighterIds.every((id) => state.builds[id])) return state;
      if (getJudges(state).length === 0) return state;
      return { ...state, votes: [], contenderIds: [], phase: { type: 'pass-judge', judgeIndex: 0 } };
    case 'acknowledge-judge':
      if (state.phase.type !== 'pass-judge') return state;
      return { ...state, phase: { type: 'vote', judgeIndex: state.phase.judgeIndex } };
    case 'cast-vote':
      return castVote(state, action.choiceId, rng);
    case 'start-tiebreak-vote':
      if (state.phase.type !== 'tiebreaker' || state.tiebreakers.length === 0) return state;
      return { ...state, votes: [], phase: { type: 'pass-judge', judgeIndex: 0 } };
    case 'next-round':
      if (state.phase.type !== 'result') return state;
      return openRound(
        {
          players: state.players,
          history: state.history,
          deckIds: state.deckIds,
          tiebreakerPile: state.tiebreakerPile,
          mode: state.mode,
        },
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
    case 'tiebreaker':
    case 'result':
      return null;
    default: {
      const unreachable: never = phase;
      return unreachable;
    }
  }
}

export function peekNextFighters(state: GameSession): Player[] {
  const ids = fightersForRound(state.players, state.roundNumber + 1, state.mode);
  return ids.map((id) => getPlayer(state, id));
}

/** Sides on the current ballot. A tiebreak drops anyone who was already behind. */
export function ballotSides(state: GameSession): Side[] {
  if (state.contenderIds.length === 0) return state.sides;
  const allowed = new Set(state.contenderIds);
  return state.sides.filter((side) => allowed.has(side.id));
}

export function latestResult(state: GameSession): RoundResult | null {
  return state.history[state.history.length - 1] ?? null;
}

export function tallyVotes(
  votes: readonly Vote[],
  sideIds: readonly string[],
): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const id of sideIds) tally[id] = 0;
  for (const vote of votes) {
    if (Object.prototype.hasOwnProperty.call(tally, vote.choiceId)) {
      tally[vote.choiceId] += 1;
    }
  }
  return tally;
}

export function decideWinner(
  tally: Record<string, number>,
  sideIds: readonly string[],
): string | null {
  const leaders = leadingSideIds(tally, sideIds);
  return leaders.length === 1 ? leaders[0] : null;
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
    mode: state.mode,
    fighterIds: state.fighterIds.slice(),
    sides: cloneSides(state.sides),
    contenderIds: state.contenderIds.slice(),
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
    tiebreakers: state.tiebreakers.map((card) => ({ ...card })),
  };
}

function openRound(
  table: {
    players: Player[];
    history: RoundResult[];
    deckIds: readonly DeckId[];
    mode: MatchMode;
    tiebreakerPile?: readonly string[];
  },
  completedRounds: number,
  rng: Rng,
): GameSession {
  const roundNumber = completedRounds + 1;
  const deckIds = normalizeDeckIds(table.deckIds);
  const pool = poolForDecks(deckIds);
  const slots = fighterCount(table.mode);
  const needed = HAND_SIZE * slots;
  if (pool.characters.length < needed || pool.attributes.length < needed) {
    throw new Error('The deal needs more cards than the decks you switched on.');
  }
  const fighterIds = fightersForRound(table.players, roundNumber, table.mode);
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
    mode: table.mode,
    fighterIds,
    sides: sidesFor(table.mode, fighterIds),
    contenderIds: [],
    hands,
    drafts,
    builds: {},
    votes: [],
    history: table.history,
    phase: { type: 'pass', fighterIndex: 0 },
    deckIds,
    tiebreakerPile: table.tiebreakerPile
      ? table.tiebreakerPile.slice()
      : shuffle(TIEBREAKERS.map((card) => card.id), rng),
    tiebreakers: [],
  };
}

function fightersForRound(
  players: readonly Player[],
  roundNumber: number,
  mode: MatchMode,
): string[] {
  const count = players.length;
  const slots = fighterCount(mode);
  const start = (roundNumber - 1) % count;
  return Array.from({ length: slots }, (_, offset) => players[(start + offset) % count].id);
}

function sidesFor(mode: MatchMode, fighterIds: readonly string[]): Side[] {
  if (mode === '2v2') {
    const left = [fighterIds[0], fighterIds[1]];
    const right = [fighterIds[2], fighterIds[3]];
    return [
      { id: `team:${left[0]}:${left[1]}`, playerIds: left },
      { id: `team:${right[0]}:${right[1]}`, playerIds: right },
    ];
  }
  return fighterIds.map((id) => ({ id, playerIds: [id] }));
}

function resolveOpening(
  names: readonly string[],
  opening?: OpeningRequest,
): { mode: MatchMode; fighters: string[] } {
  const resolved = !opening
    ? { mode: '1v1' as const, fighters: names.slice(0, 2) }
    : 'mode' in opening
      ? { mode: opening.mode, fighters: opening.fighters.map((name) => name.trim()) }
      : { mode: '1v1' as const, fighters: opening.map((name) => name.trim()) };
  if (
    !modeAvailable(resolved.mode, names.length) ||
    resolved.fighters.length !== fighterCount(resolved.mode)
  ) {
    throw new Error('That fight does not fit this table.');
  }
  return resolved;
}

/** Round 1 lineup. Chosen fighters are seated first; otherwise the first seats fight. */
export function openingLineup(
  names: readonly string[],
  opening?: OpeningRequest,
): {
  mode: MatchMode;
  fighters: readonly string[];
  judges: readonly string[];
  label: string;
} {
  const cleaned = names.map((name) => name.trim());
  const problem = validateNames(cleaned);
  if (problem) {
    throw new Error(problem);
  }
  const resolved = resolveOpening(cleaned, opening);
  const seated = seatOpening(cleaned, resolved.fighters);
  const players = seated.map((name, index) => ({
    id: `player-${index + 1}`,
    name,
    score: 0,
  }));
  const fighterIds = fightersForRound(players, 1, resolved.mode);
  const fighterNames = fighterIds.map((id) => players.find((player) => player.id === id)?.name ?? '');
  return {
    mode: resolved.mode,
    fighters: fighterNames,
    judges: players
      .filter((player) => !fighterIds.includes(player.id))
      .map((player) => player.name),
    label: matchupLabel(fighterNames, resolved.mode),
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
  const nextIndex = fighterIndex + 1;
  if (nextIndex < state.fighterIds.length) {
    return { ...state, builds, phase: { type: 'pass', fighterIndex: nextIndex } };
  }
  return { ...state, builds, phase: { type: 'matchup' } };
}

function castVote(state: GameSession, choiceId: string, rng: Rng): GameSession {
  if (state.phase.type !== 'vote') return state;
  if (!ballotSides(state).some((side) => side.id === choiceId)) return state;
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
  return finishRound({ ...state, votes }, rng);
}

function finishRound(state: GameSession, rng: Rng): GameSession {
  const sideIds = ballotSides(state).map((side) => side.id);
  const tally = tallyVotes(state.votes, sideIds);
  const winnerId = decideWinner(tally, sideIds);
  if (!winnerId) {
    return drawTiebreaker({ ...state, contenderIds: leadingSideIds(tally, sideIds) }, rng);
  }
  const winners = new Set(
    state.sides.find((side) => side.id === winnerId)?.playerIds ?? [],
  );
  const result: RoundResult = {
    roundNumber: state.roundNumber,
    mode: state.mode,
    fighterIds: state.fighterIds.slice(),
    sides: cloneSides(state.sides),
    builds: state.fighterIds.map((id) => getBuild(state, id)),
    votes: state.votes.map((vote) => ({ ...vote })),
    winnerId,
    tally,
    tiebreakers: state.tiebreakers.map((card) => ({ ...card })),
  };
  return {
    ...state,
    players: state.players.map((player) =>
      winners.has(player.id) ? { ...player, score: player.score + 1 } : player,
    ),
    history: [...state.history, result],
    contenderIds: [],
    tiebreakers: [],
    phase: { type: 'result' },
  };
}

function leadingSideIds(tally: Record<string, number>, sideIds: readonly string[]): string[] {
  let best = -1;
  const leaders: string[] = [];
  for (const id of sideIds) {
    const votes = tally[id] ?? 0;
    if (votes > best) {
      best = votes;
      leaders.length = 0;
      leaders.push(id);
    } else if (votes === best) {
      leaders.push(id);
    }
  }
  return leaders;
}

function drawTiebreaker(state: GameSession, rng: Rng): GameSession {
  let pile = state.tiebreakerPile.slice();
  if (pile.length === 0) {
    const used = new Set(state.tiebreakers.map((card) => card.id));
    const fresh = TIEBREAKERS.map((card) => card.id).filter((id) => !used.has(id));
    pile = shuffle(fresh.length > 0 ? fresh : TIEBREAKERS.map((card) => card.id), rng);
  }
  const cardId = pile[0];
  if (!cardId) return state;
  return {
    ...state,
    votes: [],
    tiebreakerPile: pile.slice(1),
    tiebreakers: [...state.tiebreakers, { ...tiebreakerById(cardId) }],
    phase: { type: 'tiebreaker' },
  };
}

function buildsArePublic(phase: Phase): boolean {
  return (
    phase.type === 'matchup' ||
    phase.type === 'tiebreaker' ||
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

function cloneSides(sides: readonly Side[]): Side[] {
  return sides.map((side) => ({ id: side.id, playerIds: side.playerIds.slice() }));
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
