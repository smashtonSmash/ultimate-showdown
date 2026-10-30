# The Ultimate Showdown

A pass-and-play party game for one phone and 3 to 12 people. Each fighter is privately dealt three characters and three powers, keeps one of each, and argues that the combination would win. Everyone else judges in secret. A tied vote draws a tiebreaker contest, and the judges vote again between the tied sides.

Ways to play: free play (1v1, 1v1v1, 2v2), tournament bracket, and king of the hill.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173, rebuilds on save
npm test           # rules engine tests
npm run typecheck  # strict TypeScript on the rules engine
npm run build      # one self-contained file: dist/index.html (plus 404.html for GitHub Pages)
```

`dist/index.html` has everything inlined, so it can be hosted anywhere static (GitHub Pages, Netlify) or opened straight from a phone's files. The poster fonts (Anton, Archivo) load from Google Fonts when online; offline it falls back to system fonts.

## Layout

```
src/data/cards.json     every deck and the 20 tiebreakers
src/engine/types.ts     game state (plain JSON, saved to the phone)
src/engine/decks.ts     deck catalog, validation, card pool
src/engine/engine.ts    the rules: deal, build, vote, tiebreak, score, king, bracket
src/engine/engine.test.ts
src/ui/                 React screens, styles, and the saved-table hook
build.mjs               esbuild bundle -> single HTML file
```

The table is saved to the phone after every tap, so a locked screen or refresh picks up where you left off. "End table" clears it.
