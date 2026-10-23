import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ATTRIBUTES, CHARACTERS } from '../data/cards';
import { DECKS, poolForDecks } from '../data/decks';
import {
  HAND_SIZE,
  createSession,
  decideWinner,
  openingLineup,
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

function playShowdown(session: GameSession, votes: Array<0 | 1>, rng: Rng): GameSession {
  let state = session;
  for (let fighterIndex = 0; fighterIndex < 2; fighterIndex += 1) {
    assert.equal(state.phase.type, 'pass');
    state = reduce(state, { type: 'acknowledge-pass' }, rng);
    const hand = getHand(state, state.fighterIds[fighterIndex as 0 | 1]);
    state = reduce(state, { type: 'select-character', cardId: hand.characters[0].id }, rng);
    state = reduce(state, { type: 'confirm-character' }, rng);
    state = reduce(state, { type: 'select-attribute', cardId: hand.attributes[0].id }, rng);
    state = reduce(state, { type: 'confirm-attribute' }, rng);
    state = reduce(state, { type: 'lock-build' }, rng);
  }
  assert.equal(state.phase.type, 'matchup');
  state = reduce(state, { type: 'call-vote' }, rng);
  const judges = getJudges(state);
  assert.equal(votes.length, judges.length);
  for (const choice of votes) {
    assert.equal(state.phase.type, 'pass-judge');
    state = reduce(state, { type: 'acknowledge-judge' }, rng);
    state = reduce(state, { type: 'cast-vote', choiceId: state.fighterIds[choice] }, rng);
  }
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

test('judges record a winner, a split awards nothing, and the next pair rotates', () => {
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

  session = playShowdown(session, [0, 1], rng);
  assert.equal(session.history[1]?.winnerId, null);
  assert.deepEqual(
    session.players.map((player) => player.score),
    [0, 1, 0, 0],
  );
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
  assert.throws(() => createSession(names, rng, ['nope' as 'fantasy']));
});
