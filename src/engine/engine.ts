/**
 * The whole ruleset. Pure functions, no UI. `step(game, action)` returns the
 * next game, or the same object when the action does not fit the phase.
 */
import { CONTESTS, cardPool, getContest, normalizeDecks } from './decks';
import type {
  Action, Bracket, BracketMatch, Build, DeckId, Game, MatchMode, Phase, PlayStyle, Player, RoundResult, Side,
} from './types';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const HAND_SIZE = 3;
export const MAX_NAME_LENGTH = 18;

export type Rng = () => number;

// ---------- setup helpers ----------

export function validateNames(names: readonly string[]): string | null {
  const cleaned = names.map((n) => n.trim());
  if (cleaned.some((n) => n.length === 0)) return 'Every seat needs a name.';
  if (cleaned.length < MIN_PLAYERS) return `Add at least ${MIN_PLAYERS} players. Someone has to judge.`;
  if (cleaned.length > MAX_PLAYERS) return `Keep the table to ${MAX_PLAYERS} players.`;
  if (cleaned.some((n) => n.length > MAX_NAME_LENGTH)) return `Keep each name to ${MAX_NAME_LENGTH} characters.`;
  const folded = cleaned.map((n) => n.toLocaleLowerCase());
  if (new Set(folded).size !== folded.length) return 'Two players cannot share a name.';
  return null;
}

export function fighterCount(mode: MatchMode): number {
  return mode === '1v1v1' ? 3 : mode === '2v2' ? 4 : 2;
}

/** Every fight needs at least one judge outside it. */
export function modeFits(mode: MatchMode, players: number): boolean {
  return players >= fighterCount(mode) + 1 && players <= MAX_PLAYERS;
}

export function matchupLabel(names: readonly string[], mode: MatchMode): string {
  if (mode === '2v2') return `${names[0]} & ${names[1]} vs. ${names[2]} & ${names[3]}`;
  if (mode === '1v1v1') return `${names[0]} vs. ${names[1]} vs. ${names[2]}`;
  return `${names[0]} vs. ${names[1]}`;
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type NewTable = {
  names: string[];
  decks: DeckId[];
  style: PlayStyle;
  mode: MatchMode;
  /** Opening fighters by name, in fight order. Ignored for tournaments. */
  opening: string[];
};

export function newGame(setup: NewTable, rng: Rng = Math.random): Game {
  const names = setup.names.map((n) => n.trim());
  const problem = validateNames(names);
  if (problem) throw new Error(problem);
  const style = setup.style;
  const mode: MatchMode = style === 'free' ? setup.mode : '1v1';
  if (style !== 'free' && setup.mode !== '1v1') throw new Error('That play style is one on one.');
  const decks = normalizeDecks(setup.decks);

  if (style === 'tournament') {
    const players = names.map((name, i) => ({ id: `player-${i + 1}`, name, score: 0 }));
    const bracket = buildBracket(shuffle(players.map((p) => p.id), rng));
    const base = blank(players, decks, mode, style, shuffle(CONTESTS.map((c) => c.id), rng));
    return announce({ ...base, bracket }, 1);
  }

  const opening = setup.opening.map((n) => n.trim());
  if (!modeFits(mode, names.length) || opening.length !== fighterCount(mode)) {
    throw new Error('That fight does not fit this table.');
  }
  if (new Set(opening).size !== opening.length || opening.some((n) => !names.includes(n))) {
    throw new Error('Pick fighters who are at the table.');
  }
  // Opening fighters sit first, in fight order. Everyone else keeps their order.
  const seated = [...opening, ...names.filter((n) => !opening.includes(n))];
  const players = seated.map((name, i) => ({ id: `player-${i + 1}`, name, score: 0 }));
  const base = blank(players, decks, mode, style, shuffle(CONTESTS.map((c) => c.id), rng));
  return deal(base, 1, rotation(players, 1, mode), rng);
}

function blank(players: Player[], decks: DeckId[], mode: MatchMode, style: PlayStyle, contestPile: string[]): Game {
  return {
    players, decks, mode, style, round: 0, fighters: [], sides: [], hands: {}, picks: {}, builds: {},
    queue: [], votes: {}, contenders: [], satOut: [], contests: [], contestPile,
    kingId: null, kingStreak: 0, hillCursor: 0, bracket: null, suggested: [], history: [],
    phase: { type: 'lineup' },
  };
}

/** Default rotation: round r starts at seat (r-1) % N and takes the next seats, wrapping. */
export function rotation(players: readonly Player[], round: number, mode: MatchMode): string[] {
  const n = players.length;
  const start = (round - 1) % n;
  return Array.from({ length: fighterCount(mode) }, (_, k) => players[(start + k) % n].id);
}

function sidesFor(mode: MatchMode, f: readonly string[]): Side[] {
  if (mode === '2v2') {
    return [
      { id: `team:${f[0]}:${f[1]}`, playerIds: [f[0], f[1]] },
      { id: `team:${f[2]}:${f[3]}`, playerIds: [f[2], f[3]] },
    ];
  }
  return f.map((id) => ({ id, playerIds: [id] }));
}

/** Fresh round: deal 3 + 3 to each fighter with no overlap. */
function deal(game: Game, round: number, fighters: string[], rng: Rng): Game {
  const pool = cardPool(game.decks);
  const need = HAND_SIZE * fighters.length;
  if (pool.characters.length < need || pool.powers.length < need) {
    throw new Error('The deal needs more cards than the decks you switched on.');
  }
  const chars = shuffle(pool.characters, rng);
  const pows = shuffle(pool.powers, rng);
  const hands: Game['hands'] = {};
  const picks: Game['picks'] = {};
  fighters.forEach((id, k) => {
    hands[id] = {
      characters: chars.slice(k * HAND_SIZE, k * HAND_SIZE + HAND_SIZE),
      powers: pows.slice(k * HAND_SIZE, k * HAND_SIZE + HAND_SIZE),
    };
    picks[id] = {};
  });
  return {
    ...game, round, fighters, sides: sidesFor(game.mode, fighters), hands, picks, builds: {},
    queue: [], votes: {}, contenders: [], satOut: [], contests: [], suggested: [],
    phase: { type: 'handoff', fighter: 0 },
  };
}

// ---------- queries ----------

export function player(game: Game, id: string): Player {
  const p = game.players.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown player ${id}`);
  return p;
}

export function judgesOf(game: Game): Player[] {
  return game.players.filter((p) => !game.fighters.includes(p.id));
}

export function ballot(game: Game): Side[] {
  if (game.contenders.length === 0) return game.sides;
  return game.sides.filter((s) => game.contenders.includes(s.id));
}

export function sideName(game: Game, side: Side): string {
  return side.playerIds.map((id) => player(game, id).name).join(' & ');
}

export function lastResult(game: Game): RoundResult | null {
  return game.history[game.history.length - 1] ?? null;
}

export function tally(votes: Record<string, string>, sideIds: readonly string[]): Record<string, number> {
  const t: Record<string, number> = Object.fromEntries(sideIds.map((id) => [id, 0]));
  for (const choice of Object.values(votes)) if (choice in t) t[choice] += 1;
  return t;
}

export function leaders(t: Record<string, number>, sideIds: readonly string[]): string[] {
  const best = Math.max(...sideIds.map((id) => t[id] ?? 0));
  return sideIds.filter((id) => (t[id] ?? 0) === best);
}

/** A skip is allowed unless it would leave the ballot with no votes at all. */
export function canSkip(game: Game): boolean {
  const ph = game.phase;
  if (ph.type !== 'judge-handoff' && ph.type !== 'ballot') return false;
  const othersLeft = game.queue.length - ph.judge - 1;
  return othersLeft > 0 || Object.keys(game.votes).length > 0;
}

// ---------- the reducer ----------

export function step(game: Game, action: Action, rng: Rng = Math.random): Game {
  const ph = game.phase;
  switch (action.type) {
    case 'ready':
      if (ph.type !== 'handoff') return game;
      return { ...game, phase: { type: 'build', fighter: ph.fighter, step: 'character' } };

    case 'pick': {
      if (ph.type !== 'build' || ph.step === 'review') return game;
      const id = game.fighters[ph.fighter];
      const pile = ph.step === 'character' ? game.hands[id]?.characters : game.hands[id]?.powers;
      if (!pile?.some((c) => c.id === action.cardId)) return game;
      return { ...game, picks: { ...game.picks, [id]: { ...game.picks[id], [ph.step]: action.cardId } } };
    }

    case 'next-step': {
      if (ph.type !== 'build' || ph.step === 'review') return game;
      const id = game.fighters[ph.fighter];
      if (!game.picks[id]?.[ph.step]) return game;
      return { ...game, phase: { ...ph, step: ph.step === 'character' ? 'power' : 'review' } };
    }

    case 'back-step':
      if (ph.type !== 'build' || ph.step === 'character') return game;
      return { ...game, phase: { ...ph, step: 'character' } };

    case 'lock': {
      if (ph.type !== 'build' || ph.step !== 'review') return game;
      const id = game.fighters[ph.fighter];
      const hand = game.hands[id];
      const pk = game.picks[id];
      const character = hand?.characters.find((c) => c.id === pk?.character);
      const power = hand?.powers.find((c) => c.id === pk?.power);
      if (!character || !power) return game;
      const builds = { ...game.builds, [id]: { playerId: id, character, power } };
      const next = ph.fighter + 1;
      return {
        ...game, builds,
        phase: next < game.fighters.length ? { type: 'handoff', fighter: next } : { type: 'matchup' },
      };
    }

    case 'call-vote': {
      if (ph.type !== 'matchup') return game;
      if (!game.fighters.every((id) => game.builds[id])) return game;
      const queue = judgesOf(game).map((p) => p.id);
      if (queue.length === 0) return game;
      return { ...game, queue, votes: {}, contenders: [], phase: { type: 'judge-handoff', judge: 0 } };
    }

    case 'judge-ready':
      if (ph.type !== 'judge-handoff') return game;
      return { ...game, phase: { type: 'ballot', judge: ph.judge } };

    case 'vote': {
      if (ph.type !== 'ballot') return game;
      if (!ballot(game).some((s) => s.id === action.sideId)) return game;
      const judgeId = game.queue[ph.judge];
      if (!judgeId) return game;
      return advanceJudge({ ...game, votes: { ...game.votes, [judgeId]: action.sideId } }, ph.judge, rng);
    }

    case 'skip-judge': {
      if (!canSkip(game) || (ph.type !== 'judge-handoff' && ph.type !== 'ballot')) return game;
      const judgeId = game.queue[ph.judge];
      return advanceJudge({ ...game, satOut: [...game.satOut, judgeId] }, ph.judge, rng);
    }

    case 'revote': {
      if (ph.type !== 'contest' || game.contests.length === 0) return game;
      const queue = judgesOf(game).map((p) => p.id).filter((id) => !game.satOut.includes(id));
      return { ...game, queue, votes: {}, phase: { type: 'judge-handoff', judge: 0 } };
    }

    case 'continue':
      if (ph.type !== 'result') return game;
      if (game.style === 'tournament') return advanceBracket(game);
      return toLineup(game);

    case 'set-lineup':
      return setLineup(game, action.fighterIds, rng);

    case 'begin-match':
      if (ph.type !== 'announce' || game.fighters.length !== 2) return game;
      return deal(game, game.round, game.fighters, rng);
  }
  return game;
}

function advanceJudge(game: Game, index: number, rng: Rng): Game {
  const next = index + 1;
  if (next < game.queue.length) return { ...game, phase: { type: 'judge-handoff', judge: next } };
  return settle(game, rng);
}

function settle(game: Game, rng: Rng): Game {
  const ids = ballot(game).map((s) => s.id);
  const t = tally(game.votes, ids);
  const top = leaders(t, ids);
  if (top.length > 1) return drawContest({ ...game, contenders: top }, rng);

  const winnerId = top[0];
  const winners = game.sides.find((s) => s.id === winnerId)!.playerIds;
  const result: RoundResult = {
    round: game.round,
    mode: game.mode,
    sides: game.sides,
    builds: game.fighters.map((id) => game.builds[id] as Build),
    votes: game.votes,
    tally: t,
    winnerId,
    contests: game.contests,
    satOut: game.satOut,
  };
  let { kingId, kingStreak, hillCursor } = game;
  if (game.style === 'king') {
    const loser = game.fighters.find((id) => id !== winnerId);
    const seat = game.players.findIndex((p) => p.id === loser);
    kingStreak = kingId === winnerId ? kingStreak + 1 : 1;
    kingId = winnerId;
    if (seat >= 0) hillCursor = (seat + 1) % game.players.length;
  }
  return {
    ...game,
    players: game.players.map((p) => (winners.includes(p.id) ? { ...p, score: p.score + 1 } : p)),
    history: [...game.history, result],
    contenders: [],
    kingId, kingStreak, hillCursor,
    phase: { type: 'result' },
  };
}

function drawContest(game: Game, rng: Rng): Game {
  let pile = game.contestPile;
  if (pile.length === 0) {
    const used = new Set(game.contests.map((c) => c.id));
    const fresh = CONTESTS.map((c) => c.id).filter((id) => !used.has(id));
    pile = shuffle(fresh.length > 0 ? fresh : CONTESTS.map((c) => c.id), rng);
  }
  return {
    ...game,
    votes: {},
    contestPile: pile.slice(1),
    contests: [...game.contests, getContest(pile[0])],
    phase: { type: 'contest' },
  };
}

// ---------- between rounds ----------

export function nextChallenger(game: Game): string {
  const n = game.players.length;
  for (let k = 0; k < n; k++) {
    const p = game.players[(game.hillCursor + k) % n];
    if (p.id !== game.kingId) return p.id;
  }
  return game.players[0].id;
}

function toLineup(game: Game): Game {
  const suggested =
    game.style === 'king' && game.kingId
      ? [game.kingId, nextChallenger(game)]
      : rotation(game.players, game.round + 1, game.mode);
  return { ...game, suggested, votes: {}, contenders: [], phase: { type: 'lineup' } };
}

function setLineup(game: Game, ids: readonly string[], rng: Rng): Game {
  if (game.phase.type !== 'lineup') return game;
  if (new Set(ids).size !== ids.length) return game;
  if (ids.some((id) => !game.players.some((p) => p.id === id))) return game;
  if (game.style === 'king') {
    if (!game.kingId || ids.length !== 2 || !ids.includes(game.kingId)) return game;
    const challenger = ids.find((id) => id !== game.kingId)!;
    const seat = game.players.findIndex((p) => p.id === challenger);
    const moved = { ...game, hillCursor: (seat + 1) % game.players.length };
    return deal(moved, game.round + 1, [game.kingId, challenger], rng);
  }
  if (ids.length !== fighterCount(game.mode)) return game;
  return deal(game, game.round + 1, ids.slice(), rng);
}

// ---------- tournament ----------

export function bracketSize(n: number): number {
  let size = 1;
  while (size < n) size *= 2;
  return size;
}

/** Seeds fill even slots, then odd slots, so a bye always faces a player. */
export function buildBracket(seeds: readonly string[]): Bracket {
  const size = bracketSize(seeds.length);
  const slots: (string | null)[] = Array(size).fill(null);
  const order = [...Array(size).keys()].filter((i) => i % 2 === 0).concat([...Array(size).keys()].filter((i) => i % 2 === 1));
  seeds.forEach((id, k) => (slots[order[k]] = id));
  const rounds = Math.round(Math.log2(size));
  let matches: BracketMatch[] = [];
  for (let r = 0; r < rounds; r++) {
    const count = size / 2 ** (r + 1);
    for (let i = 0; i < count; i++) {
      const pair: [string | null, string | null] = r === 0 ? [slots[2 * i], slots[2 * i + 1]] : [null, null];
      const bye = (pair[0] === null) !== (pair[1] === null);
      matches.push({ id: `bracket-${r}-${i}`, round: r, index: i, playerIds: pair, winnerId: bye ? (pair[0] ?? pair[1]) : null, bye });
    }
  }
  for (const m of matches.slice()) if (m.winnerId) matches = placeWinner(matches, m.id, m.winnerId);
  return { matches, currentId: playable(matches)?.id ?? null };
}

export function roundCount(bracket: Bracket): number {
  return Math.max(...bracket.matches.map((m) => m.round)) + 1;
}

export function stageName(round: number, rounds: number): string {
  const fromFinal = rounds - 1 - round;
  if (fromFinal === 0) return 'Final';
  if (fromFinal === 1) return 'Semifinal';
  if (fromFinal === 2) return 'Quarterfinal';
  return `Round of ${2 ** (fromFinal + 1)}`;
}

function playable(matches: readonly BracketMatch[]): BracketMatch | null {
  return matches.find((m) => !m.bye && !m.winnerId && m.playerIds[0] !== null && m.playerIds[1] !== null) ?? null;
}

function placeWinner(matches: BracketMatch[], matchId: string, winnerId: string): BracketMatch[] {
  const match = matches.find((m) => m.id === matchId)!;
  return matches.map((m) => {
    if (m.id === matchId) return { ...m, winnerId };
    if (m.round === match.round + 1 && m.index === Math.floor(match.index / 2)) {
      const playerIds: [string | null, string | null] = [m.playerIds[0], m.playerIds[1]];
      playerIds[match.index % 2] = winnerId;
      return { ...m, playerIds };
    }
    return m;
  });
}

export function champion(game: Game): string | null {
  if (!game.bracket) return null;
  const final = game.bracket.matches.reduce((a, b) => (b.round > a.round ? b : a));
  return final.winnerId;
}

/** Point the table at the next playable match, or crown the champion. */
function announce(game: Game, round: number): Game {
  const match = game.bracket ? playable(game.bracket.matches) : null;
  const base = {
    ...game, round, hands: {}, picks: {}, builds: {}, queue: [], votes: {}, contenders: [], satOut: [], contests: [],
  };
  if (!match) return { ...base, phase: { type: 'champion' } as Phase };
  const fighters = match.playerIds as [string, string];
  return {
    ...base,
    fighters: [...fighters],
    sides: sidesFor('1v1', fighters),
    bracket: { ...game.bracket!, currentId: match.id },
    phase: { type: 'announce' },
  };
}

function advanceBracket(game: Game): Game {
  const res = lastResult(game);
  const bracket = game.bracket;
  if (!res || !bracket) return game;
  const current = bracket.matches.find((m) => m.id === bracket.currentId);
  if (!current || !current.playerIds.includes(res.winnerId)) return game;
  const matches = placeWinner(bracket.matches, current.id, res.winnerId);
  const next: Game = { ...game, bracket: { matches, currentId: null } };
  if (champion(next)) return { ...announce(next, game.round), round: game.round, phase: { type: 'champion' } };
  return announce(next, game.round + 1);
}
