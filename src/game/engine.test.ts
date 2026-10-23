import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ATTRIBUTES, CHARACTERS } from '../data/cards';
import { DECKS, poolForDecks } from '../data/decks';
import { TIEBREAKERS } from '../data/tiebreakers';
import {
  HAND_SIZE,
  createSession,
  decideWinner,
  openingLineup,
  matchupLabel,
  modeAvailable,
  getBuild,
  getHand,
  getJudges,
  getPlayer,
  projectForPlayer,
  reduce,
  tallyVotes,
  validateNames,
  type Rng,
} from './engine';
import type { GameSession } from './types';

function mulberry32(seed: number): Rng {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function ids(cards: { id: string }[]): string[] {
  return cards.map((card) => card.id);
}

function lockFighters(session: GameSession, rng: Rng): GameSession {
  let state = session;
  const count = state.fighterIds.length;
  for (let fighterIndex = 0; fighterIndex < count; fighterIndex += 1) {
    assert.equal(state.phase.type, 'pass');
    state = reduce(state, { type: 'acknowledge-pass' }, rng);
    const fighterId = state.fighterIds[fighterIndex];
    assert.ok(fighterId);
    const hand = getHand(state, fighterId);
    state = reduce(state, { type: 'select-character', cardId: hand.characters[0].id }, rng);
    state = reduce(state, { type: 'confirm-character' }, rng);
    state = reduce(state, { type: 'select-attribute', cardId: hand.attributes[0].id }, rng);
    state = reduce(state, { type: 'confirm-attribute' }, rng);
    state = reduce(state, { type: 'lock-build' }, rng);
  }
  assert.equal(state.phase.type, 'matchup');
  return state;
}

function castBallot(session: GameSession, votes: number[], rng: Rng): GameSession {
  let state = session;
  const judges = getJudges(state);
  assert.equal(votes.length, judges.length);
  for (const choice of votes) {
    assert.equal(state.phase.type, 'pass-judge');
    state = reduce(state, { type: 'acknowledge-judge' }, rng);
    const side = state.contenderIds.length
      ? state.sides.filter((entry) => state.contenderIds.includes(entry.id))[choice]
      : state.sides[choice];
    assert.ok(side);
    state = reduce(state, { type: 'cast-vote', choiceId: side.id }, rng);
  }
  return state;
}

function playShowdown(
  session: GameSession,
  votes: number[],
  rng: Rng,
  tiebreaks: number[][] = [],
): GameSession {
  let state = lockFighters(session, rng);
  state = reduce(state, { type: 'call-vote' }, rng);
  state = castBallot(state, votes, rng);
  const extra = tiebreaks.slice();
  while (state.phase.type === 'tiebreaker') {
    const ballot = extra.shift();
    assert.ok(ballot, 'a split needs another ballot');
    state = reduce(state, { type: 'start-tiebreak-vote' }, rng);
    state = castBallot(state, ballot, rng);
  }
  assert.equal(extra.length, 0);
  assert.equal(state.phase.type, 'result');
  return state;
}

test('the sample deck is original, unique, and large enough to deal', () => {
  const cards = [...CHARACTERS, ...ATTRIBUTES];
  assert.ok(CHARACTERS.length >= HAND_SIZE * 2);
  assert.ok(ATTRIBUTES.length >= HAND_SIZE * 2);
  const cardIds = cards.map((card) => card.id);
  assert.equal(new Set(cardIds).size, cardIds.length);
  for (const card of cards) {
    assert.ok(card.title.trim().length > 0);
    assert.equal(card.detail, card.detail.trim());
    const marker = card.kind === 'character' ? '.character.' : '.attribute.';
    assert.equal(card.id.includes(marker), true);
  }
});

test('the opening lineup is the first rotated pair, and everyone else judges', () => {
  const names = ['Alex', 'Jordan', 'Sam', 'Riley'] as const;
  const lineup = openingLineup(names);
  assert.deepEqual(lineup.fighters, ['Alex', 'Jordan']);
  assert.deepEqual(lineup.judges, ['Sam', 'Riley']);
  const session = createSession(names, mulberry32(3));
  assert.deepEqual(
    session.fighterIds.map((id) => getPlayer(session, id).name),
    [...lineup.fighters],
  );
  assert.deepEqual(
    getJudges(session).map((judge) => judge.name),
    [...lineup.judges],
  );
  assert.deepEqual(openingLineup(['Alex', 'Jordan', 'Sam']).judges, ['Sam']);
  assert.equal(lineup.mode, '1v1');
  assert.equal(lineup.label, 'Alex vs. Jordan');
});

test('a chosen opening pair is round 1, and later rounds rotate from that pair', () => {
  const names = ['Alex', 'Jordan', 'Sam', 'Riley'] as const;
  const lineup = openingLineup(names, ['Sam', 'Alex']);
  assert.deepEqual(lineup.fighters, ['Sam', 'Alex']);
  assert.deepEqual(lineup.judges, ['Jordan', 'Riley']);

  const rng = mulberry32(21);
  let session = createSession(names, rng, ['house'], ['Sam', 'Alex']);
  assert.deepEqual(
    session.players.map((player) => player.name),
    ['Sam', 'Alex', 'Jordan', 'Riley'],
  );
  assert.deepEqual(
    session.fighterIds.map((id) => getPlayer(session, id).name),
    ['Sam', 'Alex'],
  );

  session = playShowdown(session, [0, 0], rng);
  session = reduce(session, { type: 'next-round' }, rng);
  assert.deepEqual(
    session.fighterIds.map((id) => getPlayer(session, id).name),
    ['Alex', 'Jordan'],
  );

  session = playShowdown(session, [0, 0], rng);
  session = reduce(session, { type: 'next-round' }, rng);
  assert.deepEqual(
    session.fighterIds.map((id) => getPlayer(session, id).name),
    ['Jordan', 'Riley'],
  );

  session = playShowdown(session, [0, 0], rng);
  session = reduce(session, { type: 'next-round' }, rng);
  assert.deepEqual(
    session.fighterIds.map((id) => getPlayer(session, id).name),
    ['Riley', 'Sam'],
  );

  assert.throws(() => createSession(names, rng, ['house'], ['Sam', 'Sam']));
  assert.throws(() => createSession(names, rng, ['house'], ['Sam', 'Nobody']));
});

test('names need three unique people', () => {
  assert.match(validateNames(['Ada', 'Bea']) ?? '', /at least 3/);
  assert.match(validateNames(['Ada', 'Bea', 'ada']) ?? '', /share a name/);
  assert.equal(validateNames(['Ada', 'Bea', 'Cam']), null);
  assert.throws(() => createSession(['Only', 'Two']));
});

test('a showdown deals 3 unique characters and 3 unique attributes to each fighter', () => {
  for (let seed = 1; seed <= 25; seed += 1) {
    const session = createSession(['Alex', 'Jordan', 'Sam', 'Riley'], mulberry32(seed));
    const [left, right] = session.fighterIds;
    const leftHand = getHand(session, left);
    const rightHand = getHand(session, right);
    assert.equal(leftHand.characters.length, 3);
    assert.equal(leftHand.attributes.length, 3);
    assert.equal(rightHand.characters.length, 3);
    assert.equal(rightHand.attributes.length, 3);
    const characterIds = [...ids(leftHand.characters), ...ids(rightHand.characters)];
    const attributeIds = [...ids(leftHand.attributes), ...ids(rightHand.attributes)];
    assert.equal(new Set(characterIds).size, 6);
    assert.equal(new Set(attributeIds).size, 6);
    assert.equal(session.phase.type, 'pass');
    assert.deepEqual(
      session.players.map((player) => player.score),
      [0, 0, 0, 0],
    );
  }
  const catalog = CHARACTERS.map((card) => card.id).join('|');
  createSession(['Alex', 'Jordan', 'Sam'], mulberry32(4));
  assert.equal(CHARACTERS.map((card) => card.id).join('|'), catalog);
});

test('illegal actions leave the session untouched', () => {
  const session = createSession(['Alex', 'Jordan', 'Sam'], mulberry32(8));
  assert.equal(reduce(session, { type: 'call-vote' }), session);
  assert.equal(reduce(session, { type: 'cast-vote', choiceId: session.fighterIds[0] }), session);
  assert.equal(
    reduce(session, { type: 'select-character', cardId: 'character.does-not-exist' }),
    session,
  );
  const peeked = reduce(session, { type: 'acknowledge-pass' });
  assert.equal(reduce(peeked, { type: 'confirm-character' }), peeked);
});

test('judges record a winner, a split is settled by a contest, and the next pair rotates', () => {
  const rng = mulberry32(12);
  let session = createSession(['Alex', 'Jordan', 'Sam', 'Riley'], rng);
  assert.deepEqual(session.fighterIds, ['player-1', 'player-2']);

  session = playShowdown(session, [1, 1], rng);
  const decided = session.history[0];
  assert.ok(decided);
  assert.equal(decided.winnerId, 'player-2');
  assert.equal(decided.tally['player-1'], 0);
  assert.equal(decided.tally['player-2'], 2);
  assert.equal(session.players[1]?.score, 1);
  assert.equal(session.players[0]?.score, 0);
  assert.equal(getBuild(session, 'player-2').character.id, decided.builds[1].character.id);

  session = reduce(session, { type: 'next-round' }, rng);
  assert.equal(session.roundNumber, 2);
  assert.deepEqual(session.fighterIds, ['player-2', 'player-3']);
  assert.equal(session.history.length, 1);
  assert.equal(session.players[1]?.score, 1);

  session = playShowdown(session, [0, 1], rng, [[0, 0]]);
  const settled = session.history[1];
  assert.equal(settled?.winnerId, 'player-2');
  assert.equal(settled?.tiebreakers.length, 1);
  assert.equal(settled?.tally['player-2'], 2);
  assert.deepEqual(
    session.players.map((player) => player.score),
    [0, 2, 0, 0],
  );
});

test('the tiebreaker deck has twenty unique contests', () => {
  assert.equal(TIEBREAKERS.length, 20);
  const titles = new Set(TIEBREAKERS.map((card) => card.title));
  const details = new Set(TIEBREAKERS.map((card) => card.detail));
  assert.equal(titles.size, 20);
  assert.equal(details.size, 20);
  for (const card of TIEBREAKERS) {
    assert.ok(card.title.trim().length > 0);
    assert.ok(card.detail.trim().length > 0);
    assert.equal(card.detail, card.detail.trim());
    assert.equal(card.id.startsWith('tiebreaker.'), true);
  }
});

test('every character and power has its own one-line description', () => {
  const details = new Map<string, string>();
  for (const deck of DECKS) {
    for (const card of [...deck.characters, ...deck.attributes]) {
      assert.ok(card.detail.trim().length > 0, card.id);
      assert.equal(card.detail, card.detail.trim(), card.id);
      const previous = details.get(card.detail);
      assert.equal(previous, undefined, `${card.id} repeats ${previous}`);
      details.set(card.detail, card.id);
    }
  }
  for (const card of TIEBREAKERS) {
    assert.equal(details.has(card.detail), false, card.id);
  }
});

test('a tied vote draws a contest, and another tie draws a different card', () => {
  const rng = mulberry32(44);
  let session = createSession(['Alex', 'Jordan', 'Sam', 'Riley'], rng);
  const pile = session.tiebreakerPile.slice();
  assert.equal(pile.length, 20);
  assert.equal(new Set(pile).size, 20);

  session = lockFighters(session, rng);
  session = reduce(session, { type: 'call-vote' }, rng);
  session = castBallot(session, [0, 1], rng);
  assert.equal(session.phase.type, 'tiebreaker');
  assert.equal(session.history.length, 0);
  assert.equal(session.tiebreakers.length, 1);
  assert.equal(session.tiebreakers[0]?.id, pile[0]);
  assert.equal(session.tiebreakerPile[0], pile[1]);
  assert.deepEqual(
    session.players.map((player) => player.score),
    [0, 0, 0, 0],
  );
  assert.equal(reduce(session, { type: 'call-vote' }, rng), session);

  session = reduce(session, { type: 'start-tiebreak-vote' }, rng);
  assert.equal(session.phase.type, 'pass-judge');
  session = castBallot(session, [0, 1], rng);
  assert.equal(session.phase.type, 'tiebreaker');
  assert.equal(session.history.length, 0);
  assert.equal(session.tiebreakers.length, 2);
  assert.equal(session.tiebreakers[1]?.id, pile[1]);
  assert.notEqual(session.tiebreakers[0]?.id, session.tiebreakers[1]?.id);

  session = reduce(session, { type: 'start-tiebreak-vote' }, rng);
  session = castBallot(session, [1, 1], rng);
  assert.equal(session.phase.type, 'result');
  const result = session.history[0];
  assert.equal(result?.winnerId, 'player-2');
  assert.equal(result?.tiebreakers.length, 2);
  assert.equal(result?.tally['player-2'], 2);
  assert.equal(session.players[1]?.score, 1);
  assert.equal(session.players[0]?.score, 0);
  assert.equal(session.tiebreakers.length, 0);
  assert.deepEqual(session.tiebreakerPile, pile.slice(2));

  const carried = session.tiebreakerPile.slice();
  session = reduce(session, { type: 'next-round' }, rng);
  assert.deepEqual(session.tiebreakerPile, carried);
});

test('a showdown can walk the whole tiebreaker deck and still deal another contest', () => {
  const rng = mulberry32(70);
  let session = createSession(['Alex', 'Jordan', 'Sam', 'Riley'], rng);
  session = lockFighters(session, rng);
  session = reduce(session, { type: 'call-vote' }, rng);
  const seen = new Set<string>();
  for (let draw = 0; draw < TIEBREAKERS.length; draw += 1) {
    session = castBallot(session, [0, 1], rng);
    assert.equal(session.phase.type, 'tiebreaker');
    const card = session.tiebreakers[session.tiebreakers.length - 1];
    assert.ok(card);
    assert.equal(seen.has(card.id), false, card.id);
    seen.add(card.id);
    assert.equal(session.history.length, 0);
    session = reduce(session, { type: 'start-tiebreak-vote' }, rng);
  }
  assert.equal(seen.size, 20);
  assert.equal(session.tiebreakerPile.length, 0);
  session = castBallot(session, [0, 1], rng);
  assert.equal(session.phase.type, 'tiebreaker');
  assert.equal(session.tiebreakers.length, 21);
  assert.equal(seen.has(session.tiebreakers[20]?.id ?? ''), true);
  assert.equal(session.players[0]?.score, 0);
});

test('start-tiebreak-vote is ignored until a contest is on the table', () => {
  const session = createSession(['Alex', 'Jordan', 'Sam'], mulberry32(8));
  assert.equal(reduce(session, { type: 'start-tiebreak-vote' }), session);
});

test('one judge is enough to award the point', () => {
  const rng = mulberry32(3);
  let session = createSession(['Alex', 'Jordan', 'Sam'], rng);
  session = playShowdown(session, [0], rng);
  assert.equal(session.history[0]?.winnerId, 'player-1');
  assert.equal(session.players[0]?.score, 1);
  assert.deepEqual(tallyVotes(session.history[0]?.votes ?? [], session.history[0]!.fighterIds), {
    'player-1': 1,
    'player-2': 0,
  });
  assert.equal(decideWinner({ 'player-1': 1, 'player-2': 1 }, ['player-1', 'player-2']), null);
});

test('a player view hides the other fighter until the showdown is public', () => {
  const rng = mulberry32(21);
  let session = createSession(['Alex', 'Jordan', 'Sam'], rng);
  const [left, right] = session.fighterIds;
  const secret = getHand(session, left).characters[0]?.id;
  assert.ok(secret);

  const beforeReveal = projectForPlayer(session, right);
  assert.equal(beforeReveal.yourHand, null);
  assert.equal(JSON.stringify(beforeReveal).includes(secret), false);

  session = reduce(session, { type: 'acknowledge-pass' }, rng);
  const building = projectForPlayer(session, left);
  assert.equal(building.yourHand?.characters.length, 3);
  assert.equal(building.yourHand?.attributes.length, 3);
  assert.equal(projectForPlayer(session, right).yourHand, null);

  const hand = getHand(session, left);
  session = reduce(session, { type: 'select-character', cardId: hand.characters[0].id }, rng);
  session = reduce(session, { type: 'confirm-character' }, rng);
  session = reduce(session, { type: 'select-attribute', cardId: hand.attributes[0].id }, rng);
  session = reduce(session, { type: 'confirm-attribute' }, rng);
  session = reduce(session, { type: 'lock-build' }, rng);

  const opponentDuringPass = projectForPlayer(session, right);
  assert.equal(opponentDuringPass.yourHand, null);
  assert.deepEqual(opponentDuringPass.revealedBuilds, {});
  assert.equal(JSON.stringify(opponentDuringPass).includes(secret), false);
  assert.ok(projectForPlayer(session, left).revealedBuilds[left]);

  session = reduce(session, { type: 'acknowledge-pass' }, rng);
  const secondHand = getHand(session, right);
  assert.equal(JSON.stringify(projectForPlayer(session, right)).includes(secret), false);
  assert.equal(projectForPlayer(session, right).yourHand?.characters.length, 3);

  session = reduce(session, { type: 'select-character', cardId: secondHand.characters[1].id }, rng);
  session = reduce(session, { type: 'confirm-character' }, rng);
  session = reduce(session, { type: 'select-attribute', cardId: secondHand.attributes[1].id }, rng);
  session = reduce(session, { type: 'confirm-attribute' }, rng);
  session = reduce(session, { type: 'lock-build' }, rng);
  assert.equal(session.phase.type, 'matchup');

  const revealed = projectForPlayer(session, 'player-3');
  assert.ok(revealed.revealedBuilds[left]);
  assert.ok(revealed.revealedBuilds[right]);
  assert.equal(revealed.revealedVotes, null);
  assert.equal(JSON.stringify(revealed).includes('judgeId'), false);
});

test('every deck has at least 20 original characters and 20 powers', () => {
  const sizes: Record<string, readonly [characters: number, powers: number]> = {
    house: [113, 34],
    fantasy: [36, 24],
    'sci-fi': [31, 23],
    horror: [42, 21],
    anime: [23, 20],
    everyday: [46, 22],
    absurd: [43, 37],
  };
  const placed: Record<string, readonly string[]> = {
    house: [
      'A kung fu movie stuntman',
      'A roundhouse-kicking action legend',
      'A martial arts master in a yellow jumpsuit',
      'A wrestler-turned-movie-star',
      'A famously nice action hero with a pencil',
      'A billionaire bat vigilante',
      'A wall-crawling teen hero',
      'Ninja',
      'Pirate',
      'Cowboy',
      'Can fly',
      'Super strength',
      'Shoots lasers from their eyes',
      'Has a bazooka',
      'Armed with a flamethrower',
      'Armed with a sniper rifle',
      'Can blow 200-mph winds',
      'Can breathe underwater',
      'Can become any animal',
      'Teleports',
      'Controls magnetism',
      'X-ray vision',
      'Sonic scream',
      'Unaffected by impact',
    ],
    fantasy: [
      'A grey-bearded wizard',
      'Dragon',
      'Wizard',
      'Knight',
      'Armed with holy hand grenades',
      'Breathes fire',
      'Berserker rage',
      'Riding a depressed centaur',
    ],
    'sci-fi': [
      'A giant atomic sea lizard',
      'A skyscraper-climbing giant ape',
      'A heavy-breathing space knight',
      'Robot',
      'Alien',
      'Has a laser sword',
      'Armed with a shrink ray',
      'Wearing a jet-pack',
    ],
    horror: [
      'Vampire',
      'Werewolf',
      'Mummy',
      'Zombie',
      'Ghost',
      "Frankenstein's Monster",
      'Can become mist while holding breath',
    ],
    anime: ['A spiky-haired anime fighter', 'An electric pocket monster'],
    everyday: [
      'Your grandma',
      'A mall cop',
      'A toddler',
      'A goose',
      'A soccer mom',
      'A big-box store greeter',
      'Has shampoo in eyes',
      'Cries uncontrollably',
    ],
    absurd: [
      'A famous cartoon mouse',
      'A square yellow sea sponge',
      'A grumpy swamp ogre',
      "Invisible, but only when no one's looking",
      'Rides a T-rex',
      'Has 1,000 bees',
      'Immortal but allergic to everything',
      'Can teleport, but only 3 feet',
      'Is 50 feet tall',
      'Armed with a shotgun that shoots shotguns',
      'Armed with a superglue fire hose',
      'Armed with an infinite sausage lasso',
      'Locked in a shark cage',
      'Made of guacamole',
      'Believes they are invisible',
      'Really stupid',
      'No bones',
      'Flying at the speed of molasses',
      'Bottom half is a unicycle',
      'Constantly playing a kazoo',
    ],
  };
  const seen = new Set<string>();
  const titles = new Set<string>();
  const optional = DECKS.filter((deck) => deck.optional).map((deck) => deck.id);
  assert.deepEqual(optional, ['fantasy', 'sci-fi', 'horror', 'anime', 'everyday', 'absurd']);
  for (const deck of DECKS) {
    const [characters, powers] = sizes[deck.id];
    assert.equal(deck.characters.length, characters, deck.id);
    assert.equal(deck.attributes.length, powers, deck.id);
    const deckTitles = new Set<string>();
    for (const card of [...deck.characters, ...deck.attributes]) {
      assert.equal(seen.has(card.id), false, card.id);
      seen.add(card.id);
      assert.equal(titles.has(card.title), false, card.title);
      titles.add(card.title);
      deckTitles.add(card.title);
      assert.ok(card.title.trim().length > 0);
      assert.equal(card.detail, card.detail.trim());
      assert.equal(card.id.startsWith(`${deck.id}.`), true);
    }
    for (const title of placed[deck.id]) {
      assert.equal(deckTitles.has(title), true, `${deck.id} missing ${title}`);
    }
  }
  for (const title of [
    'Roundhouse Ranger',
    'Dark Space Lord',
    'Soccer Mom',
    'Frankenstein',
    'Electric Pocket Mouse',
    'Kung Fu Legend',
    'Has a lightsaber',
    'Has a lightsaber-style energy sword',
  ]) {
    assert.equal(titles.has(title), false, title);
  }
});

test('dealing draws from the house deck plus the expansions that are on', () => {
  const rng = mulberry32(9);
  const names = ['Alex', 'Jordan', 'Sam'] as const;
  const houseOnly = createSession(names, rng);
  assert.deepEqual(houseOnly.deckIds, ['house']);

  const session = createSession(names, mulberry32(10), ['horror', 'fantasy']);
  assert.deepEqual(session.deckIds, ['house', 'fantasy', 'horror']);
  const pool = poolForDecks(session.deckIds);
  const allowed = new Set([...pool.characters, ...pool.attributes].map((card) => card.id));
  assert.equal([...allowed].some((id) => id.startsWith('fantasy.')), true);
  assert.equal([...allowed].some((id) => id.startsWith('horror.')), true);
  assert.equal([...allowed].some((id) => id.startsWith('sci-fi.')), false);
  for (const hand of Object.values(session.hands)) {
    for (const card of [...hand.characters, ...hand.attributes]) {
      assert.equal(allowed.has(card.id), true, card.id);
    }
  }

  const finished = playShowdown(session, [0], rng);
  const next = reduce(finished, { type: 'next-round' }, rng);
  assert.deepEqual(next.deckIds, session.deckIds);
  assert.equal(next.mode, '1v1');
  assert.throws(() => createSession(names, rng, ['nope' as 'fantasy']));
});

test('a fight mode is locked until someone outside it can judge', () => {
  assert.equal(modeAvailable('1v1', 3), true);
  assert.equal(modeAvailable('1v1v1', 3), false);
  assert.equal(modeAvailable('1v1v1', 4), true);
  assert.equal(modeAvailable('2v2', 4), false);
  assert.equal(modeAvailable('2v2', 5), true);
  const four = ['Alex', 'Jordan', 'Sam', 'Riley'] as const;
  const rng = mulberry32(4);
  assert.throws(() =>
    createSession(four, rng, ['house'], { mode: '2v2', fighters: four }),
  );
  assert.throws(() =>
    createSession(['Alex', 'Jordan', 'Sam'], rng, ['house'], {
      mode: '1v1v1',
      fighters: ['Alex', 'Jordan', 'Sam'],
    }),
  );
});

test('a free-for-all seats three fighters, rotates the window, and scores one winner', () => {
  const names = ['Alex', 'Jordan', 'Sam', 'Riley', 'Casey'] as const;
  const opening = { mode: '1v1v1' as const, fighters: ['Alex', 'Sam', 'Casey'] };
  const lineup = openingLineup(names, opening);
  assert.deepEqual(lineup.fighters, ['Alex', 'Sam', 'Casey']);
  assert.deepEqual(lineup.judges, ['Jordan', 'Riley']);
  assert.equal(lineup.label, 'Alex vs. Sam vs. Casey');
  assert.equal(matchupLabel(lineup.fighters, '1v1v1'), lineup.label);

  const rng = mulberry32(15);
  let session = createSession(names, rng, ['house'], opening);
  assert.equal(session.mode, '1v1v1');
  assert.deepEqual(
    session.players.map((player) => player.name),
    ['Alex', 'Sam', 'Casey', 'Jordan', 'Riley'],
  );
  assert.equal(Object.keys(session.hands).length, 3);
  const dealt = Object.values(session.hands).flatMap((hand) => [
    ...hand.characters,
    ...hand.attributes,
  ]);
  assert.equal(new Set(dealt.map((card) => card.id)).size, dealt.length);

  session = playShowdown(session, [2, 2], rng);
  assert.equal(session.history[0]?.winnerId, 'player-3');
  assert.deepEqual(
    session.players.map((player) => player.score),
    [0, 0, 1, 0, 0],
  );

  session = reduce(session, { type: 'next-round' }, rng);
  assert.equal(session.mode, '1v1v1');
  assert.deepEqual(
    session.fighterIds.map((id) => getPlayer(session, id).name),
    ['Sam', 'Casey', 'Jordan'],
  );
  session = reduce(playShowdown(session, [0, 0], rng), { type: 'next-round' }, rng);
  assert.deepEqual(
    session.fighterIds.map((id) => getPlayer(session, id).name),
    ['Casey', 'Jordan', 'Riley'],
  );
});

test('a free-for-all tie keeps only the tied fighters in the next contest', () => {
  const names = ['Alex', 'Jordan', 'Sam', 'Riley', 'Casey', 'Drew', 'Quinn'] as const;
  const rng = mulberry32(18);
  let session = createSession(names, rng, ['house'], {
    mode: '1v1v1',
    fighters: ['Alex', 'Jordan', 'Sam'],
  });
  session = lockFighters(session, rng);
  session = reduce(session, { type: 'call-vote' }, rng);
  session = castBallot(session, [0, 1, 0, 1], rng);
  assert.equal(session.phase.type, 'tiebreaker');
  assert.equal(session.history.length, 0);
  assert.deepEqual(session.contenderIds, ['player-1', 'player-2']);
  const dropped = session.sides[2]?.id;
  assert.ok(dropped);
  session = reduce(session, { type: 'start-tiebreak-vote' }, rng);
  assert.equal(session.phase.type, 'pass-judge');
  const opened = reduce(session, { type: 'acknowledge-judge' }, rng);
  assert.equal(reduce(opened, { type: 'cast-vote', choiceId: dropped }, rng), opened);

  session = castBallot(session, [0, 0, 0, 0], rng);
  assert.equal(session.phase.type, 'result');
  assert.equal(session.history[0]?.winnerId, 'player-1');
  assert.equal(session.players[0]?.score, 1);
  assert.equal(session.players[1]?.score, 0);
  assert.equal(session.players[2]?.score, 0);
});

test('a 2v2 awards a point to each winning teammate and rotates both pairs', () => {
  const names = ['Alex', 'Jordan', 'Sam', 'Riley', 'Casey', 'Drew'] as const;
  const opening = {
    mode: '2v2' as const,
    fighters: ['Riley', 'Casey', 'Alex', 'Drew'],
  };
  const lineup = openingLineup(names, opening);
  assert.deepEqual(lineup.fighters, ['Riley', 'Casey', 'Alex', 'Drew']);
  assert.deepEqual(lineup.judges, ['Jordan', 'Sam']);
  assert.equal(lineup.label, 'Riley & Casey vs. Alex & Drew');

  const rng = mulberry32(27);
  let session = createSession(names, rng, ['house'], opening);
  assert.equal(session.sides.length, 2);
  assert.deepEqual(session.sides[0]?.playerIds, ['player-1', 'player-2']);
  assert.deepEqual(session.sides[1]?.playerIds, ['player-3', 'player-4']);
  const teamA = session.sides[0]?.id;
  const teamB = session.sides[1]?.id;
  assert.ok(teamA && teamB);

  session = playShowdown(session, [0, 0], rng);
  assert.equal(session.history[0]?.winnerId, teamA);
  assert.deepEqual(
    session.players.map((player) => player.score),
    [1, 1, 0, 0, 0, 0],
  );

  session = reduce(session, { type: 'next-round' }, rng);
  assert.equal(session.mode, '2v2');
  assert.deepEqual(
    session.fighterIds.map((id) => getPlayer(session, id).name),
    ['Casey', 'Alex', 'Drew', 'Jordan'],
  );
  assert.deepEqual(session.sides[0]?.playerIds.map((id) => getPlayer(session, id).name), [
    'Casey',
    'Alex',
  ]);
  assert.deepEqual(session.sides[1]?.playerIds.map((id) => getPlayer(session, id).name), [
    'Drew',
    'Jordan',
  ]);

  const tied = lockFighters(session, rng);
  let voting = reduce(tied, { type: 'call-vote' }, rng);
  voting = castBallot(voting, [0, 1], rng);
  assert.equal(voting.phase.type, 'tiebreaker');
  assert.deepEqual(
    voting.players.map((player) => player.score),
    [1, 1, 0, 0, 0, 0],
  );
  assert.deepEqual(voting.contenderIds, voting.sides.map((side) => side.id));
  voting = reduce(voting, { type: 'start-tiebreak-vote' }, rng);
  voting = castBallot(voting, [1, 1], rng);
  assert.equal(voting.history[1]?.winnerId, voting.sides[1]?.id);
  assert.equal(voting.history[1]?.tiebreakers.length, 1);
  assert.deepEqual(
    voting.players.map((player) => player.score),
    [1, 1, 0, 1, 1, 0],
  );
});
