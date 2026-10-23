# The Ultimate Showdown

A pass-and-play party game for one phone. Each fighter is dealt three character cards and three power cards, keeps the best of each, and argues why that combination would win. Everyone else is the jury.

The house deck and the themed expansions are original. They are not taken from any published card game.

## How a showdown works

1. Seat 3 to 8 players.
2. Tap Next, then choose decks. The house deck is always in the deal. Fantasy, Sci-Fi, Horror, Anime, Everyday Chaos, and Absurd / Silly can be switched on to mix in.
3. Choose the first two fighters. The first two seats start selected. Tap Name vs. Name, and everyone else is judging. Later rounds rotate one seat forward from that pair. Those two are dealt 3 characters and 3 powers from the mix. Cards in a showdown do not overlap.
4. Each fighter privately keeps one character and one power. Pass the phone so the other side cannot see the hand.
5. Both fighters are revealed. They argue the matchup.
6. Each judge votes in secret. The winner gets one point. A tie scores nothing, and the votes are written on the sheet.
7. The next showdown rotates one seat forward from the opening pair: those two, then the second fighter against the next seat, and so on around the table. Later rounds keep the same decks.

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
src/app/                 routes: title, seating, deck picks, first-fight intro, live showdown
src/screens/             pass-and-play screens
src/components/          cards, score strip, buttons
src/data/cards.ts        house deck
src/data/decks/          optional expansions and the combined deal
src/game/types.ts        JSON-safe session, actions, and per-player view
src/game/engine.ts       rules kernel: deal, pick, vote, score
src/state/GameProvider   in-memory table for this phone
```

Package name and Expo slug: `ultimate-showdown`. The home-screen name is **The Ultimate Showdown**.

## Where online play plugs in

`reduce(session, action)` is the whole ruleset. It has no React and no network code. A room server can keep a `GameSession`, apply the same actions, and be the only writer.

`projectForPlayer(session, playerId)` is the slice one phone should receive. Hidden hands, drafts, and unfinished votes stay off that object. The local UI does not use it yet, because one device is the whole table and the pass screens are the privacy gate. When play moves online, send the projection, not the session.

Suggested next steps, in order:

1. **House rules.** Redraw a hand, write your own cards, break ties with a revote, or challenge a specific seat instead of using the rotation.
2. **Saved tables.** Persist the session on the device so a locked phone does not wipe the sheet.
3. **Online rooms.** Host-authoritative `reduce`, one client per player, `projectForPlayer` on the wire, reconnect with a room code.
4. **Custom decks.** The house deck and expansions ship in `src/data`. Later, write cards at the table and trade a deck code.
