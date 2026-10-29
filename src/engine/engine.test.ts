import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONTESTS, DECKS, cardPool } from './decks';
import {
  ballot, buildBracket, canSkip, champion, judgesOf, modeFits, newGame, roundCount, stageName, step, validateNames,
  type NewTable,
} from './engine';
import type { Game } from './types';

const rng = (() => {
  let s = 42;
  return () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
})();

const names5 = ['Ann', 'Bo', 'Cy', 'Di', 'Ed'];
const table = (over: Partial<NewTable> = {}): NewTable => ({
  names: names5, decks: ['house'], style: 'free', mode: '1v1', opening: ['Ann', 'Bo'], ...over,
});

/** Every fighter takes their first character and first power. */
function buildAll(g: Game): Game {
  while (g.phase.type === 'handoff' || g.phase.type === 'build') {
    if (g.phase.type === 'handoff') { g = step(g, { type: 'ready' }); continue; }
    const id = g.fighters[g.phase.fighter];
    if (g.phase.step === 'character') g = step(step(g, { type: 'pick', cardId: g.hands[id].characters[0].id }), { type: 'next-step' });
    else if (g.phase.step === 'power') g = step(step(g, { type: 'pick', cardId: g.hands[id].powers[0].id }), { type: 'next-step' });
    else g = step(g, { type: 'lock' });
  }
  return g;
}

/** Each judge in the queue votes for the side picked by `choose(judgeIndex)`. */
function voteAll(g: Game, choose: (i: number, g: Game) => string): Game {
  while (g.phase.type === 'judge-handoff' || g.phase.type === 'ballot') {
    if (g.phase.type === 'judge-handoff') g = step(g, { type: 'judge-ready' });
    else g = step(g, { type: 'vote', sideId: choose(g.phase.judge, g) }, rng);
  }
  return g;
}

test('deck counts match the catalog', () => {
  const counts = Object.fromEntries(DECKS.map((d) => [d.id, [d.characters.length, d.powers.length]]));
  assert.deepEqual(counts, {
    house: [113, 34], fantasy: [36, 24], 'sci-fi': [31, 23], horror: [42, 21], anime: [23, 20], everyday: [46, 22], absurd: [43, 37],
  });
  assert.equal(CONTESTS.length, 20);
  assert.equal(cardPool(['absurd', 'fantasy']).characters[0].id.startsWith('house.'), true);
});

test('name validation, in order', () => {
  assert.equal(validateNames(['A', ' ', 'C']), 'Every seat needs a name.');
  assert.equal(validateNames(['A', 'B']), 'Add at least 3 players. Someone has to judge.');
  assert.equal(validateNames(['1', '2', '3', '4', '5', '6', '7', '8', '9']), 'Keep the table to 8 players.');
  assert.equal(validateNames(['A', 'B', 'x'.repeat(19)]), 'Keep each name to 18 characters.');
  assert.equal(validateNames(['Ann', 'ann', 'C']), 'Two players cannot share a name.');
  assert.equal(validateNames(['Ann', 'Bo', 'x'.repeat(18)]), null);
});

test('fight shapes need a spare judge', () => {
  assert.equal(modeFits('1v1v1', 3), false);
  assert.equal(modeFits('1v1v1', 4), true);
  assert.equal(modeFits('2v2', 4), false);
  assert.equal(modeFits('2v2', 5), true);
  assert.throws(() => newGame(table({ style: 'king', mode: '2v2' })), /one on one/);
});

test('each fighter gets 3 + 3 with no overlap', () => {
  const g = newGame(table({ mode: '2v2', opening: ['Ann', 'Bo', 'Cy', 'Di'] }), rng);
  const all = g.fighters.flatMap((id) => [...g.hands[id].characters, ...g.hands[id].powers].map((c) => c.id));
  for (const id of g.fighters) {
    assert.equal(g.hands[id].characters.length, 3);
    assert.equal(g.hands[id].powers.length, 3);
  }
  assert.equal(new Set(all).size, all.length);
});

test('opening fighters sit first; rotation follows seats', () => {
  const g = newGame(table({ opening: ['Cy', 'Ann'] }), rng);
  assert.deepEqual(g.players.map((p) => p.name), ['Cy', 'Ann', 'Bo', 'Di', 'Ed']);
  assert.deepEqual(g.fighters, ['player-1', 'player-2']);
  let r = voteAll(step(buildAll(g), { type: 'call-vote' }), () => 'player-1');
  assert.equal(r.phase.type, 'result');
  r = step(r, { type: 'continue' });
  assert.deepEqual(r.suggested, ['player-2', 'player-3']);
});

test('picks outside the hand and locks without picks are ignored', () => {
  let g = step(newGame(table(), rng), { type: 'ready' });
  const before = g;
  assert.equal(step(g, { type: 'pick', cardId: 'house.character.nope' }), before);
  assert.equal(step(g, { type: 'next-step' }), before);
  assert.equal(step(g, { type: 'lock' }), before);
  g = step(g, { type: 'pick', cardId: g.hands['player-1'].characters[1].id });
  g = step(g, { type: 'next-step' });
  g = step(g, { type: 'back-step' });
  assert.deepEqual(g.phase, { type: 'build', fighter: 0, step: 'character' });
});

test('a 1-1 split draws a contest and the revote only has the tied sides', () => {
  let g = newGame(table({ mode: '1v1v1', opening: ['Ann', 'Bo', 'Cy'] }), rng);
  g = step(buildAll(g), { type: 'call-vote' });
  // judges Di, Ed split between Ann and Bo; Cy gets nothing
  g = voteAll(g, (i) => (i === 0 ? 'player-1' : 'player-2'));
  assert.equal(g.phase.type, 'contest');
  assert.equal(g.contests.length, 1);
  assert.deepEqual(ballot(g).map((s) => s.id), ['player-1', 'player-2']);
  g = step(g, { type: 'revote' });
  assert.equal(step(step(g, { type: 'judge-ready' }), { type: 'vote', sideId: 'player-3' }).phase.type, 'ballot');
  g = voteAll(g, (i) => (i === 0 ? 'player-1' : 'player-2'));
  assert.equal(g.contests.length, 2);
  assert.notEqual(g.contests[0].id, g.contests[1].id);
  g = voteAll(step(g, { type: 'revote' }), () => 'player-2');
  assert.equal(g.phase.type, 'result');
  assert.equal(g.history[0].winnerId, 'player-2');
  assert.equal(g.history[0].contests.length, 2);
  assert.equal(g.players[1].score, 1);
});

test('contest pile reshuffles when it runs out', () => {
  let g = newGame(table(), rng);
  g = { ...g, contestPile: [] };
  g = voteAll(step(buildAll(g), { type: 'call-vote' }), (i) => (i % 2 === 0 ? 'player-1' : 'player-2'));
  // 3 judges vote 2-1, so set up a tie by skipping instead
  assert.ok(g.phase.type === 'result');
  let h = { ...newGame(table({ names: ['Ann', 'Bo', 'Cy', 'Di'] }), rng), contestPile: [] };
  h = voteAll(step(buildAll(h), { type: 'call-vote' }), (i) => (i === 0 ? 'player-1' : 'player-2'));
  assert.equal(h.phase.type, 'contest');
  assert.equal(h.contests.length, 1);
  assert.equal(h.contestPile.length, 19);
});

test('2v2 win scores both teammates', () => {
  let g = newGame(table({ mode: '2v2', opening: ['Ann', 'Bo', 'Cy', 'Di'] }), rng);
  g = voteAll(step(buildAll(g), { type: 'call-vote' }), (_, x) => x.sides[1].id);
  assert.deepEqual(g.players.map((p) => p.score), [0, 0, 1, 1, 0]);
});

test('king of the hill: streak, and the next challenger after the loser', () => {
  let g = newGame(table({ style: 'king' }), rng);
  g = voteAll(step(buildAll(g), { type: 'call-vote' }), () => 'player-1');
  assert.equal(g.kingId, 'player-1');
  assert.equal(g.kingStreak, 1);
  g = step(g, { type: 'continue' });
  assert.deepEqual(g.suggested, ['player-1', 'player-3']);
  assert.equal(step(g, { type: 'set-lineup', fighterIds: ['player-2', 'player-3'] }), g);
  g = step(g, { type: 'set-lineup', fighterIds: ['player-4', 'player-1'] }, rng);
  assert.deepEqual(g.fighters, ['player-1', 'player-4']);
  g = voteAll(step(buildAll(g), { type: 'call-vote' }), () => 'player-1');
  assert.equal(g.kingStreak, 2);
  g = step(g, { type: 'continue' });
  assert.deepEqual(g.suggested, ['player-1', 'player-5']);
  g = step(g, { type: 'set-lineup', fighterIds: g.suggested }, rng);
  g = voteAll(step(buildAll(g), { type: 'call-vote' }), () => 'player-5');
  assert.equal(g.kingId, 'player-5');
  assert.equal(g.kingStreak, 1);
});

test('tournament of 5: bracket of 8, 3 byes, stages, champion', () => {
  const b = buildBracket(['a', 'b', 'c', 'd', 'e']);
  assert.equal(b.matches.filter((m) => m.round === 0).length, 4);
  assert.equal(b.matches.filter((m) => m.bye).length, 3);
  assert.ok(b.matches.every((m) => !(m.playerIds[0] === null && m.playerIds[1] === null && m.round === 0)));
  assert.equal(stageName(2, 3), 'Final');
  assert.equal(stageName(1, 3), 'Semifinal');
  assert.equal(stageName(0, 3), 'Quarterfinal');
  assert.equal(stageName(0, 4), 'Round of 16');

  let g = newGame(table({ style: 'tournament', opening: [] }), rng);
  assert.equal(g.phase.type, 'announce');
  assert.equal(roundCount(g.bracket!), 3);
  let matches = 0;
  while (g.phase.type !== 'champion') {
    assert.equal(g.phase.type, 'announce');
    g = step(g, { type: 'begin-match' }, rng);
    g = voteAll(step(buildAll(g), { type: 'call-vote' }), (_, x) => x.fighters[0]);
    g = step(g, { type: 'continue' });
    matches++;
  }
  assert.equal(matches, 4);
  assert.equal(champion(g), g.history[g.history.length - 1].winnerId);
  assert.equal(g.players.reduce((n, p) => n + p.score, 0), 4);
});

test('tournament of 3 and 8 finish', () => {
  for (const names of [['A', 'B', 'C'], ['1', '2', '3', '4', '5', '6', '7', '8']]) {
    let g = newGame({ names, decks: ['house'], style: 'tournament', mode: '1v1', opening: [] }, rng);
    let n = 0;
    while (g.phase.type !== 'champion' && n < 20) {
      g = step(g, { type: 'begin-match' }, rng);
      g = voteAll(step(buildAll(g), { type: 'call-vote' }), (_, x) => x.fighters[1]);
      g = step(g, { type: 'continue' });
      n++;
    }
    assert.equal(n, names.length - 1);
  }
});

test('skip judge: never leaves a ballot empty, and sits out revotes', () => {
  let g = newGame(table({ names: ['Ann', 'Bo', 'Cy', 'Di', 'Ed'] }), rng);
  g = step(buildAll(g), { type: 'call-vote' });
  assert.equal(judgesOf(g).length, 3);
  assert.equal(canSkip(g), true);
  g = step(g, { type: 'skip-judge' }); // Cy out
  g = voteAll(g, (i) => (i === 1 ? 'player-1' : 'player-2'));
  assert.equal(g.phase.type, 'contest');
  g = step(g, { type: 'revote' });
  assert.deepEqual(g.queue, ['player-4', 'player-5']);
  g = step(g, { type: 'skip-judge' });
  assert.equal(canSkip(g), false);
  assert.equal(step(g, { type: 'skip-judge' }), g);
  g = voteAll(g, () => 'player-1');
  assert.equal(g.history[0].winnerId, 'player-1');
  assert.deepEqual(g.history[0].satOut, ['player-3', 'player-4']);
});

test('the game survives a save and load', () => {
  const g = buildAll(newGame(table(), rng));
  assert.deepEqual(JSON.parse(JSON.stringify(g)), g);
});
