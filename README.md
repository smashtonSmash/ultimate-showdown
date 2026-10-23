# The Ultimate Showdown

A pass-and-play party game for one phone. Each fighter is dealt three character cards and three power cards, keeps the best of each, and argues why that combination would win. Everyone else is the jury.

The house deck and the themed expansions are original. They are not taken from any published card game.

## How a showdown works

1. Seat 3 to 8 players.
2. Tap Next, then choose decks. The house deck is always in the deal. Fantasy, Sci-Fi, Horror, Anime, Everyday Chaos, and Absurd / Silly can be switched on to mix in.
3. Choose the fight. 1v1 is two fighters. 1v1v1 is a three-person free-for-all and needs 4 players, so someone is left to judge. 2v2 is two teams of two and needs 5 players for the same reason. Then pick who fights. The first seats start selected. In 2v2, tap to fill Team A and Team B. The button reads Name vs. Name, Name vs. Name vs. Name, or Name & Name vs. Name & Name. Everyone else judges.
4. Each fighter privately keeps one character and one power. In a 2v2, teammates each build their own fighter and argue together. Pass the phone so the other side cannot see the hand. Cards in a showdown do not overlap.
5. The fighters are revealed. They argue the matchup.
6. Each judge votes in secret, for one fighter or for one team. A solo winner gets one point. In a 2v2, each winning teammate gets a point. A tie draws a contest from the tiebreaker deck (basketball, a cooking contest, karaoke, and the rest) between the tied fighters or teams. The judges vote that contest. Another tie draws a new card. The winner of the deciding vote gets the point, and the sheet records it.
7. The next showdown slides one seat forward around the table: the next two, the next three, or the next four split into two pairs. Later rounds keep the same decks and the same kind of fight.

This build keeps the whole table on one device. Nothing is saved if you close the app.

## Run it

```bash
npm install
npm start
```

Expo Go on iOS or Android (SDK 58) can open the project from the QR code. On a Mac, `npm run ios` opens the simulator. `npm run android` needs an Android emulator or a device.

```bash
npm run web
```

```bash
npm test
npm run typecheck
```

## Project map

```
src/app/                 routes: title, seating, deck picks, fight mode, first-fight intro, live showdown
src/screens/             pass-and-play screens
src/components/          cards, score strip, buttons
src/data/cards.ts        house deck
src/data/decks/          optional expansions and the combined deal
src/data/tiebreakers.ts  contests drawn when a vote splits
src/game/types.ts        JSON-safe session, actions, and per-player view
src/game/engine.ts       rules kernel: deal, pick, vote, tiebreak, score
src/state/GameProvider   in-memory table for this phone
```

Package name and Expo slug: `ultimate-showdown`. The home-screen name is **The Ultimate Showdown**.

## Where online play plugs in

`reduce(session, action)` is the whole ruleset. It has no React and no network code. A room server can keep a `GameSession`, apply the same actions, and be the only writer.

`projectForPlayer(session, playerId)` is the slice one phone should receive. Hidden hands, drafts, and unfinished votes stay off that object. The local UI does not use it yet, because one device is the whole table and the pass screens are the privacy gate. When play moves online, send the projection, not the session.

Suggested next steps, in order:

1. **House rules.** Redraw a hand, write your own cards, or challenge a specific seat instead of using the rotation.
2. **Saved tables.** Persist the session on the device so a locked phone does not wipe the sheet.
3. **Online rooms.** Host-authoritative `reduce`, one client per player, `projectForPlayer` on the wire, reconnect with a room code.
4. **Custom decks.** The house deck and expansions ship in `src/data`. Later, write cards at the table and trade a deck code.
