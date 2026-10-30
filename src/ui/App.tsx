import { useState, type ReactNode } from 'react';
import { DECKS } from '../engine/decks';
import { MAX_NAME_LENGTH, MAX_PLAYERS, fighterCount, matchupLabel, modeFits, newGame, validateNames } from '../engine/engine';
import type { DeckId, MatchMode, PlayStyle } from '../engine/types';
import { Btn, Dock, Sheet } from './bits';
import { initialState, useAppState, type AppState } from './store';
import { Table } from './Table';

export function App() {
  const [state, update] = useAppState();
  const go = (screen: AppState['screen']) => update((s) => ({ ...s, screen }));

  switch (state.screen) {
    case 'seats':
      return <Seats state={state} update={update} />;
    case 'setup':
      return <Setup state={state} update={update} />;
    case 'opening':
      return <Opening state={state} update={update} />;
    case 'table':
      if (state.game) {
        return (
          <Table
            game={state.game}
            setGame={(game) => update((s) => ({ ...s, game }))}
            onEnd={(again) =>
              update((s) => ({ ...initialState, names: s.names, decks: s.decks, style: s.style, mode: s.mode, screen: again ? 'setup' : 'home' }))
            }
          />
        );
      }
      return <Home state={state} update={update} />;
    default:
      return <Home state={state} update={update} onResume={state.game ? () => go('table') : undefined} />;
  }
}

type ScreenProps = { state: AppState; update: (fn: (s: AppState) => AppState) => void };

function Frame(props: { back?: () => void; step?: string; children: ReactNode; dock?: ReactNode }) {
  return (
    <div className="screen">
      {props.back || props.step ? (
        <header className="topbar">
          {props.back ? (
            <button type="button" className="back" onClick={props.back} aria-label="Back">
              ‹ Back
            </button>
          ) : <span />}
          {props.step ? <span className="topbar-step">{props.step}</span> : null}
        </header>
      ) : null}
      <main className="content">{props.children}</main>
      {props.dock ? <Dock>{props.dock}</Dock> : null}
    </div>
  );
}

// ---------- Home ----------

function Home({ update, onResume }: ScreenProps & { onResume?: () => void }) {
  const [rules, setRules] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const start = () => update((s) => ({ ...s, game: null, screen: 'seats' }));
  return (
    <Frame
      dock={
        <>
          {onResume ? <Btn onClick={onResume}>Back to the table</Btn> : null}
          <Btn tone={onResume ? 'line' : 'main'} onClick={onResume ? () => setConfirmNew(true) : start}>
            New table
          </Btn>
          <Btn tone="quiet" onClick={() => setRules(true)}>How to play</Btn>
        </>
      }
    >
      <div className="poster">
        <p className="poster-kicker">One phone. Pass it around the room.</p>
        <h1 className="poster-title">
          <span>The</span>
          <span>Ultimate</span>
          <span>Showdown</span>
        </h1>
        <p className="poster-tag">Build a fighter from three bad options. Argue it could win. Let the table decide.</p>
        <div className="poster-cards" aria-hidden>
          <div className="pc pc-char">
            <small>Character</small>
            Night-market raccoon
          </div>
          <div className="pc pc-pow">
            <small>Power</small>
            Pigeon escort
          </div>
        </div>
      </div>
      {rules ? <Rules onClose={() => setRules(false)} /> : null}
      {confirmNew ? (
        <Sheet title="Start a new table?" onClose={() => setConfirmNew(false)}>
          <p className="muted">The table in progress and its scores will be cleared.</p>
          <div className="stack">
            <Btn onClick={start}>Clear it and start fresh</Btn>
            <Btn tone="quiet" onClick={() => setConfirmNew(false)}>Keep that table</Btn>
          </div>
        </Sheet>
      ) : null}
    </Frame>
  );
}

function Rules({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="How to play" onClose={onClose}>
      <ol className="rules">
        <li>Seat 3 to 12 players on one phone.</li>
        <li>Each fighter is privately dealt 3 characters and 3 powers, and keeps one of each. Pass the phone so nobody else sees the hand.</li>
        <li>The fighters are revealed. Argue why your combination wins.</li>
        <li>Everyone else is a judge and votes in secret. The winner gets a point. In 2v2, both teammates score.</li>
        <li>A tied vote draws a tiebreaker contest, like karaoke or a bake-off. Judges vote again between the tied sides until one wins.</li>
      </ol>
      <h3>Ways to play</h3>
      <p><b>Free play.</b> Choose who fights each round. The next rotation is picked for you.</p>
      <p><b>Tournament.</b> Random seeds, a 1v1 bracket, byes for odd counts, one champion.</p>
      <p><b>King of the hill.</b> The winner stays on as King. Pick only the challenger. A crown counts the streak.</p>
    </Sheet>
  );
}

// ---------- Seats ----------

const SAMPLE = ['Maya', 'Theo', 'Priya', 'Jonah', 'Rosa'];

function Seats({ state, update }: ScreenProps) {
  const [names, setNames] = useState<string[]>(state.names.length ? state.names : ['', '', '']);
  const [tried, setTried] = useState(false);
  const problem = validateNames(names);
  const save = (next: string[]) => {
    setNames(next);
    update((s) => ({ ...s, names: next }));
  };
  const next = () => {
    setTried(true);
    if (problem) return;
    update((s) => ({ ...s, names: names.map((n) => n.trim()), screen: 'setup' }));
  };
  const filled = names.filter((n) => n.trim()).length;
  return (
    <Frame
      back={() => update((s) => ({ ...s, screen: 'home' }))}
      step="1 of 3"
      dock={
        <>
          {tried && problem ? <p className="error" role="alert">{problem}</p> : null}
          <Btn onClick={next}>Next: how you'll play</Btn>
        </>
      }
    >
      <h1 className="h1">Who's playing?</h1>
      <p className="muted">3 to 12 players. Everyone who isn't fighting judges.</p>
      <ol className="seats">
        {names.map((name, i) => (
          <li key={i} className="seat">
            <span className="seat-no">{i + 1}</span>
            <input
              value={name}
              maxLength={MAX_NAME_LENGTH + 4}
              placeholder="Name"
              aria-label={`Player ${i + 1} name`}
              autoCapitalize="words"
              autoComplete="off"
              enterKeyHint={i === names.length - 1 ? 'done' : 'next'}
              onChange={(e) => save(names.map((n, k) => (k === i ? e.target.value : n)))}
            />
            {names.length > 1 ? (
              <button type="button" className="seat-x" aria-label={`Remove seat ${i + 1}`} onClick={() => save(names.filter((_, k) => k !== i))}>
                ×
              </button>
            ) : null}
          </li>
        ))}
      </ol>
      {names.length < MAX_PLAYERS ? (
        <button type="button" className="add-seat" onClick={() => save([...names, ''])}>
          + Add a seat
        </button>
      ) : (
        <p className="muted small">That's a full table.</p>
      )}
      {filled === 0 ? (
        <button type="button" className="link" onClick={() => save(SAMPLE)}>
          Fill in sample names
        </button>
      ) : null}
    </Frame>
  );
}

// ---------- Setup ----------

const STYLES: { id: PlayStyle; title: string; blurb: string }[] = [
  { id: 'free', title: 'Free play', blurb: 'Pick who fights each round. 1v1, three-way, or teams.' },
  { id: 'tournament', title: 'Tournament', blurb: 'Random 1v1 bracket. Winners advance until one champion is left.' },
  { id: 'king', title: 'King of the hill', blurb: 'The winner stays on. Everyone else lines up to take the crown.' },
];

const MODES: { id: MatchMode; title: string; blurb: string }[] = [
  { id: '1v1', title: '1v1', blurb: 'Two fighters' },
  { id: '1v1v1', title: '1v1v1', blurb: 'Three-way brawl' },
  { id: '2v2', title: '2v2', blurb: 'Two teams of two' },
];

function Setup({ state, update }: ScreenProps) {
  const count = state.names.length;
  const mode: MatchMode = state.style === 'free' && modeFits(state.mode, count) ? state.mode : '1v1';
  const setStyle = (style: PlayStyle) => update((s) => ({ ...s, style }));
  const setMode = (m: MatchMode) => update((s) => ({ ...s, mode: m }));
  const toggleDeck = (id: DeckId) =>
    update((s) => ({ ...s, decks: s.decks.includes(id) ? s.decks.filter((d) => d !== id) : [...s.decks, id] }));
  const [error, setError] = useState<string | null>(null);

  const next = () => {
    if (state.style === 'tournament') {
      try {
        const game = newGame({ names: state.names, decks: state.decks, style: 'tournament', mode: '1v1', opening: [] });
        update((s) => ({ ...s, mode: '1v1', game, screen: 'table' }));
      } catch (e) {
        setError((e as Error).message);
      }
      return;
    }
    update((s) => ({ ...s, mode, screen: 'opening' }));
  };

  return (
    <Frame
      back={() => update((s) => ({ ...s, screen: 'seats' }))}
      step="2 of 3"
      dock={
        <>
          {error ? <p className="error" role="alert">{error}</p> : null}
          <Btn onClick={next}>{state.style === 'tournament' ? 'Seed the bracket' : 'Next: the first fight'}</Btn>
        </>
      }
    >
      <h1 className="h1">How are you playing?</h1>
      <div className="choices" role="radiogroup" aria-label="Play style">
        {STYLES.map((st) => (
          <button
            key={st.id}
            type="button"
            role="radio"
            aria-checked={state.style === st.id}
            className={`choice${state.style === st.id ? ' is-on' : ''}`}
            onClick={() => setStyle(st.id)}
          >
            <span className="choice-title">{st.title}</span>
            <span className="choice-blurb">{st.blurb}</span>
          </button>
        ))}
      </div>

      {state.style === 'free' ? (
        <>
          <h2 className="h2">Fight shape</h2>
          <div className="modes" role="radiogroup" aria-label="Fight shape">
            {MODES.map((m) => {
              const fits = modeFits(m.id, count);
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={mode === m.id}
                  disabled={!fits}
                  className={`mode${mode === m.id ? ' is-on' : ''}`}
                  onClick={() => setMode(m.id)}
                >
                  <span className="mode-title">{m.title}</span>
                  <span className="mode-blurb">{fits ? m.blurb : `Needs ${fighterCount(m.id) + 1} players`}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <p className="muted small">Tournament and King of the hill are always 1v1.</p>
      )}

      <h2 className="h2">Decks in the deal</h2>
      <ul className="decks">
        {DECKS.map((d) => {
          const on = !d.optional || state.decks.includes(d.id);
          return (
            <li key={d.id}>
              <label className={`deck${on ? ' is-on' : ''}${d.optional ? '' : ' is-locked'}`}>
                <input type="checkbox" checked={on} disabled={!d.optional} onChange={() => toggleDeck(d.id)} />
                <span className="deck-text">
                  <span className="deck-title">{d.title}</span>
                  <span className="deck-blurb">{d.optional ? d.blurb : 'Always in the deal.'}</span>
                  <span className="deck-count">
                    {d.characters.length} characters, {d.powers.length} powers
                  </span>
                </span>
                <span className="switch" aria-hidden />
              </label>
            </li>
          );
        })}
      </ul>
    </Frame>
  );
}

// ---------- Opening ----------

function Opening({ state, update }: ScreenProps) {
  const slots = fighterCount(state.mode);
  const [picked, setPicked] = useState<string[]>(state.names.slice(0, slots));
  const [error, setError] = useState<string | null>(null);
  const teams = state.mode === '2v2';

  const toggle = (name: string) =>
    setPicked((cur) => {
      if (cur.includes(name)) return cur.filter((n) => n !== name);
      if (cur.length >= slots) return cur;
      return [...cur, name];
    });

  const ready = picked.length === slots;
  const start = () => {
    try {
      const game = newGame({ names: state.names, decks: state.decks, style: state.style, mode: state.mode, opening: picked });
      update((s) => ({ ...s, game, screen: 'table' }));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const tag = (name: string) => {
    const k = picked.indexOf(name);
    if (k < 0) return 'Judge';
    if (teams) return k < 2 ? 'Team A' : 'Team B';
    return `Fighter ${k + 1}`;
  };

  return (
    <Frame
      back={() => update((s) => ({ ...s, screen: 'setup' }))}
      step="3 of 3"
      dock={
        <>
          {error ? <p className="error" role="alert">{error}</p> : null}
          <Btn disabled={!ready} onClick={start}>
            {ready ? matchupLabel(picked, state.mode) : `Pick ${slots - picked.length} more`}
          </Btn>
        </>
      }
    >
      <h1 className="h1">Who fights first?</h1>
      <p className="muted">
        {teams
          ? 'Tap two names for Team A, then two for Team B. Tap again to bench someone.'
          : state.style === 'king'
            ? 'Tap two fighters. The winner becomes King.'
            : `Tap ${slots} fighters. Everyone else judges.`}
      </p>
      <ul className="roster">
        {state.names.map((name) => {
          const k = picked.indexOf(name);
          const team = teams && k >= 0 ? (k < 2 ? 'a' : 'b') : k >= 0 ? 'a' : '';
          return (
            <li key={name}>
              <button type="button" className={`rost${k >= 0 ? ` is-on team-${team}` : ''}`} aria-pressed={k >= 0} onClick={() => toggle(name)}>
                <span className="rost-name">{name}</span>
                <span className="rost-tag">{tag(name)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Frame>
  );
}
