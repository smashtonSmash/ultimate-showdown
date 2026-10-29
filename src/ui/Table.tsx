import { useEffect, useState, type ReactNode } from 'react';
import {
  ballot, canSkip, champion, fighterCount, judgesOf, lastResult, matchupLabel, player, roundCount, sideName, stageName, step,
} from '../engine/engine';
import type { Action, Game, RoundResult, Side } from '../engine/types';
import { BracketBoard, Bill, Btn, Confetti, Curtain, Dock, GameCard, Sheet, Vs } from './bits';

type Props = { game: Game; setGame: (g: Game) => void; onEnd: (again: boolean) => void };

export function Table({ game, setGame, onEnd }: Props) {
  const act = (a: Action) => setGame(step(game, a));
  const [sheet, setSheet] = useState<'scores' | 'end' | null>(null);
  const ph = game.phase;

  // Each phase starts at the top of the page.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [ph.type, 'fighter' in ph ? ph.fighter : 0, 'judge' in ph ? ph.judge : 0]);

  const view = (() => {
    switch (ph.type) {
      case 'handoff':
        return <Handoff game={game} act={act} />;
      case 'build':
        return <Build game={game} act={act} />;
      case 'matchup':
        return <Matchup game={game} act={act} />;
      case 'judge-handoff':
        return <JudgeHandoff game={game} act={act} />;
      case 'ballot':
        return <Ballot key={`${game.contests.length}-${ph.judge}`} game={game} act={act} />;
      case 'contest':
        return <ContestView game={game} act={act} />;
      case 'result':
        return <Result game={game} act={act} />;
      case 'lineup':
        return game.style === 'king' && game.kingId ? <KingLineup game={game} act={act} /> : <FreeLineup game={game} act={act} />;
      case 'announce':
        return <Announce game={game} act={act} />;
      case 'champion':
        return <Champion game={game} onEnd={onEnd} />;
    }
  })();

  // Privacy screens hide the scoreboard chrome entirely.
  const hidden = ph.type === 'handoff' || ph.type === 'judge-handoff';

  return (
    <div className={`screen table phase-${ph.type}`}>
      {!hidden ? (
        <header className="tablebar">
          <span className="tablebar-round">{roundLabel(game)}</span>
          <button type="button" className="scorestrip" onClick={() => setSheet('scores')} aria-label="Open the score sheet">
            {game.players.map((p) => (
              <span key={p.id} className={`chip${game.fighters.includes(p.id) && ph.type !== 'champion' ? ' is-fighting' : ''}`}>
                {game.kingId === p.id ? <span className="crown" aria-label="King">♛</span> : null}
                <span className="chip-name">{p.name}</span>
                <span className="chip-score">{p.score}</span>
              </span>
            ))}
          </button>
          <button type="button" className="menu" onClick={() => setSheet("end")}>
            End
          </button>
        </header>
      ) : null}
      {view}
      {sheet === 'scores' ? <ScoreSheet game={game} onClose={() => setSheet(null)} /> : null}
      {sheet === 'end' ? (
        <Sheet title="End this table?" onClose={() => setSheet(null)}>
          <p className="muted">The scores and any hidden cards on this phone will be cleared.</p>
          <div className="stack">
            <Btn onClick={() => onEnd(false)}>End table</Btn>
            <Btn tone="quiet" onClick={() => setSheet(null)}>Keep playing</Btn>
          </div>
        </Sheet>
      ) : null}
    </div>
  );
}

type PhaseProps = { game: Game; act: (a: Action) => void };

function roundLabel(game: Game): string {
  if (game.style === 'tournament' && game.bracket) {
    if (game.phase.type === 'champion') return 'Champion';
    const m = game.bracket.matches.find((x) => x.id === game.bracket!.currentId);
    if (m) return stageName(m.round, roundCount(game.bracket));
  }
  return `Round ${Math.max(1, game.round)}`;
}

function spot(game: Game, i: number): string {
  if (game.mode === '2v2') return `Team ${i < 2 ? 'A' : 'B'}, fighter ${(i % 2) + 1} of 2`;
  return `Fighter ${i + 1} of ${game.fighters.length}`;
}

// ---------- building ----------

function Handoff({ game, act }: PhaseProps) {
  if (game.phase.type !== 'handoff') return null;
  const i = game.phase.fighter;
  const p = player(game, game.fighters[i]);
  return (
    <Curtain role={spot(game, i)} name={p.name} note={`Only ${p.name} looks. Your hand is next.`}>
      <Btn onClick={() => act({ type: 'ready' })}>I'm {p.name}</Btn>
    </Curtain>
  );
}

function Build({ game, act }: PhaseProps) {
  const ph = game.phase;
  if (ph.type !== 'build') return null;
  const id = game.fighters[ph.fighter];
  const me = player(game, id);
  const hand = game.hands[id];
  const picks = game.picks[id] ?? {};
  const pickedChar = hand.characters.find((c) => c.id === picks.character);
  const pickedPow = hand.powers.find((c) => c.id === picks.power);
  // A stale save can point at cards no longer in the hand. Send them back to the start.
  const slipped = (ph.step === 'power' && !pickedChar) || (ph.step === 'review' && (!pickedChar || !pickedPow));

  const steps = ['Character', 'Power', 'Lock in'];
  const current = ph.step === 'character' ? 0 : ph.step === 'power' ? 1 : 2;

  let body: ReactNode;
  let dock: ReactNode;
  if (slipped) {
    body = <p className="error">Those picks slipped. Choose a character and a power again.</p>;
    dock = <Btn onClick={() => act({ type: 'back-step' })}>Choose again</Btn>;
  } else if (ph.step === 'character' || ph.step === 'power') {
    const pile = ph.step === 'character' ? hand.characters : hand.powers;
    const chosen = ph.step === 'character' ? picks.character : picks.power;
    body = (
      <>
        <h1 className="h1">{ph.step === 'character' ? 'Keep one character' : 'Keep one power'}</h1>
        <p className="muted">
          {ph.step === 'character'
            ? game.mode === '2v2'
              ? 'Pick the one you can defend. Your teammate builds their own fighter.'
              : 'Pick the one you can defend. A power comes next.'
            : <>Your <b>{pickedChar!.title}</b> gets one of these.</>}
        </p>
        <div className="hand">
          {pile.map((c) => (
            <GameCard key={c.id} card={c} selected={chosen === c.id} dim={!!chosen && chosen !== c.id} onClick={() => act({ type: 'pick', cardId: c.id })} />
          ))}
        </div>
      </>
    );
    dock = (
      <>
        <Btn disabled={!chosen} onClick={() => act({ type: 'next-step' })}>
          {chosen ? (ph.step === 'character' ? 'Keep this character' : 'Keep this power') : ph.step === 'character' ? 'Tap a character' : 'Tap a power'}
        </Btn>
        {ph.step === 'power' ? <Btn tone="quiet" onClick={() => act({ type: 'back-step' })}>Back to characters</Btn> : null}
      </>
    );
  } else {
    body = (
      <>
        <h1 className="h1">Your fighter</h1>
        <p className="muted">Lock it in and pass the phone. You can't change it after.</p>
        <div className="hand">
          <GameCard card={pickedChar!} />
          <div className="plus" aria-hidden>+</div>
          <GameCard card={pickedPow!} />
        </div>
      </>
    );
    dock = (
      <>
        <Btn onClick={() => act({ type: 'lock' })}>Lock it in</Btn>
        <Btn tone="quiet" onClick={() => act({ type: 'back-step' })}>Change picks</Btn>
      </>
    );
  }

  return (
    <>
      <main className="content">
        <div className="whose">
          <span className="whose-name">{me.name}</span>
          <span className="whose-spot">{spot(game, ph.fighter)}</span>
        </div>
        <ol className="steps" aria-label="Build steps">
          {steps.map((s, k) => (
            <li key={s} className={k === current ? 'is-now' : k < current ? 'is-done' : ''} aria-current={k === current ? 'step' : undefined}>
              {s}
            </li>
          ))}
        </ol>
        {body}
      </main>
      <Dock>{dock}</Dock>
    </>
  );
}

// ---------- the fight ----------

function SideBlock({ game, side, builds, onClick, selected, badge }: {
  game: Game; side: Side; builds?: RoundResult['builds']; onClick?: () => void; selected?: boolean; badge?: string;
}) {
  const plates = side.playerIds.map((id) => {
    const b = builds ? builds.find((x) => x.playerId === id) : game.builds[id];
    return b ? <Bill key={id} name={player(game, id).name} build={b} /> : null;
  });
  const inner = (
    <>
      {side.playerIds.length > 1 ? <div className="side-team">{sideName(game, side)}</div> : null}
      {badge ? <div className="side-badge">{badge}</div> : null}
      {plates}
    </>
  );
  if (!onClick) return <div className="side">{inner}</div>;
  return (
    <button type="button" className={`side side-pick${selected ? ' is-on' : ''}`} aria-pressed={selected} onClick={onClick}>
      {inner}
    </button>
  );
}

function SideList(props: { game: Game; sides: Side[]; pick?: (id: string) => void; chosen?: string | null }) {
  return (
    <div className="bill-list">
      {props.sides.map((s, k) => (
        <div key={s.id}>
          {k > 0 ? <Vs /> : null}
          <SideBlock game={props.game} side={s} onClick={props.pick ? () => props.pick!(s.id) : undefined} selected={props.chosen === s.id} />
        </div>
      ))}
    </div>
  );
}

function Matchup({ game, act }: PhaseProps) {
  const judges = judgesOf(game).map((p) => p.name);
  return (
    <>
      <main className="content">
        <h1 className="h1 h1-fight">Tonight's fight</h1>
        <p className="muted">Fighters, make your case. Judges ({judges.join(', ')}), listen up.</p>
        <SideList game={game} sides={game.sides} />
      </main>
      <Dock>
        <Btn onClick={() => act({ type: 'call-vote' })}>Call the vote</Btn>
      </Dock>
    </>
  );
}

function JudgeHandoff({ game, act }: PhaseProps) {
  const [confirm, setConfirm] = useState(false);
  if (game.phase.type !== 'judge-handoff') return null;
  const j = game.phase.judge;
  const p = player(game, game.queue[j]);
  const revote = game.contests.length > 0;
  return (
    <>
      <Curtain
        role={`${revote ? 'Revote, judge' : 'Judge'} ${j + 1} of ${game.queue.length}`}
        name={p.name}
        note="Your vote stays secret until every judge has voted."
      >
        <Btn onClick={() => act({ type: 'judge-ready' })}>I'm {p.name}</Btn>
        {canSkip(game) ? (
          <Btn tone="quiet" onClick={() => setConfirm(true)}>{p.name} stepped away</Btn>
        ) : null}
      </Curtain>
      {confirm ? (
        <Sheet title={`Skip ${p.name}?`} onClose={() => setConfirm(false)}>
          <p className="muted">{p.name} sits out the rest of this round's voting, including any tiebreaker. They're back next round.</p>
          <div className="stack">
            <Btn onClick={() => { setConfirm(false); act({ type: 'skip-judge' }); }}>Skip {p.name}</Btn>
            <Btn tone="quiet" onClick={() => setConfirm(false)}>Wait for them</Btn>
          </div>
        </Sheet>
      ) : null}
    </>
  );
}

function Ballot({ game, act }: PhaseProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  if (game.phase.type !== 'ballot') return null;
  const judge = player(game, game.queue[game.phase.judge]);
  const sides = ballot(game);
  const contest = game.contests[game.contests.length - 1];
  const teams = game.mode === '2v2';
  const pickedSide = sides.find((s) => s.id === chosen);
  return (
    <>
      <main className="content">
        <h1 className="h1">{judge.name}, who wins?</h1>
        {contest ? (
          <div className="contest-mini">
            <span>Tiebreaker</span>
            {contest.title}
          </div>
        ) : null}
        <p className="muted">Tap the {teams ? 'team' : 'fighter'} you think wins. Everyone sees the votes once all the judges are done.</p>
        <SideList game={game} sides={sides} pick={setChosen} chosen={chosen} />
      </main>
      <Dock>
        <Btn disabled={!pickedSide} onClick={() => chosen && act({ type: 'vote', sideId: chosen })}>
          {pickedSide ? `Vote for ${sideName(game, pickedSide)}` : `Tap a ${teams ? 'team' : 'fighter'}`}
        </Btn>
      </Dock>
    </>
  );
}

function ContestView({ game, act }: PhaseProps) {
  const contest = game.contests[game.contests.length - 1];
  const sides = ballot(game);
  if (!contest) return <main className="content"><p className="error">The contest card is missing.</p></main>;
  return (
    <>
      <main className="content">
        <h1 className="h1 h1-fight">It's a tie</h1>
        <p className="muted">
          {game.contests.length > 1 ? `Tied again. Contest number ${game.contests.length}. ` : ''}
          Same {game.mode === '2v2' ? 'teams' : 'fighters'}, no fighting. Only {sides.map((s) => sideName(game, s)).join(' and ')} are on the ballot.
        </p>
        <div className="contest">
          <span className="contest-kind">Tiebreaker</span>
          <h2 className="contest-title">{contest.title}</h2>
          <p className="contest-detail">{contest.detail}</p>
        </div>
        <p className="muted small">Argue this one, then the judges vote again.</p>
      </main>
      <Dock>
        <Btn onClick={() => act({ type: 'revote' })}>Judges, vote again</Btn>
      </Dock>
    </>
  );
}

// ---------- after the vote ----------

function Splash(props: { kicker: string; names: string; builds: RoundResult['builds']; game: Game; crown?: number; big?: boolean; onDone: () => void; doneLabel: string }) {
  return (
    <div className={`splash${props.big ? ' is-big' : ''}`} role="dialog" aria-label={`${props.kicker} ${props.names}`}>
      <Confetti />
      <div className="splash-inner">
        {props.crown ? <div className="splash-crown">♛ King, {props.crown} in a row</div> : null}
        <div className="splash-kicker">{props.kicker}</div>
        <div className={`splash-name${props.names.length > 14 ? ' is-long' : ''}`}>{props.names}</div>
        {props.builds.map((b) => (
          <div key={b.playerId} className="splash-build">
            {props.builds.length > 1 ? <b>{player(props.game, b.playerId).name}: </b> : null}
            {b.character.title} <span>with</span> {b.power.title}
          </div>
        ))}
      </div>
      <div className="splash-dock">
        <Btn tone="line" onClick={props.onDone}>{props.doneLabel}</Btn>
      </div>
    </div>
  );
}

function pointCopy(n: number, settled: boolean): string {
  const base = n > 1 ? 'A point to each of them.' : 'A point on the sheet.';
  return settled ? `Settled by the tiebreaker. ${base}` : base;
}

function Result({ game, act }: PhaseProps) {
  const [splash, setSplash] = useState(true);
  const r = lastResult(game);
  if (!r) return <main className="content"><p className="muted">The sheet is blank.</p></main>;
  const win = r.sides.find((s) => s.id === r.winnerId)!;
  const crowned = game.style === 'king' && game.kingId !== null && win.playerIds.includes(game.kingId);
  const next = game.style === 'king' ? 'Choose the challenger' : game.style === 'tournament' ? 'Update the bracket' : 'Choose the next fight';
  const sideFor = (id: string) => r.sides.find((s) => s.id === id);

  if (splash) {
    return (
      <Splash
        kicker="Winner!"
        names={sideName(game, win)}
        builds={r.builds.filter((b) => win.playerIds.includes(b.playerId))}
        game={game}
        crown={crowned ? game.kingStreak : undefined}
        onDone={() => setSplash(false)}
        doneLabel="See the votes"
      />
    );
  }
  return (
    <>
      <main className="content">
        <h1 className="h1">{sideName(game, win)} {win.playerIds.length > 1 ? 'win' : 'wins'}</h1>
        <p className="muted">{pointCopy(win.playerIds.length, r.contests.length > 0)}</p>
        {r.contests.length > 0 ? (
          <p className="small">Decided by: {r.contests[r.contests.length - 1].title}</p>
        ) : null}
        <div className="tally">
          {r.sides
            .filter((s) => r.tally[s.id] !== undefined)
            .map((s) => (
              <div key={s.id} className={`tally-row${s.id === r.winnerId ? ' is-win' : ''}`}>
                <span>{sideName(game, s)}</span>
                <b>{r.tally[s.id]}</b>
              </div>
            ))}
        </div>
        <h2 className="h2">How they voted</h2>
        <ul className="votes">
          {Object.entries(r.votes).map(([judge, side]) => (
            <li key={judge}>
              <b>{player(game, judge).name}</b> voted for {sideFor(side) ? sideName(game, sideFor(side)!) : 'a side'}
            </li>
          ))}
          {r.satOut.map((id) => (
            <li key={id} className="muted">{player(game, id).name} sat out</li>
          ))}
        </ul>
        <h2 className="h2">The fight</h2>
        <div className="bill-list">
          {r.sides.map((s, k) => (
            <div key={s.id}>
              {k > 0 ? <Vs /> : null}
              <SideBlock game={game} side={s} builds={r.builds} badge={s.id === r.winnerId ? 'Winner' : undefined} />
            </div>
          ))}
        </div>
      </main>
      <Dock>
        <Btn onClick={() => act({ type: 'continue' })}>{next}</Btn>
        <Btn tone="quiet" onClick={() => setSplash(true)}>Show the winner again</Btn>
      </Dock>
    </>
  );
}

type Team = 'A' | 'B';

function FreeLineup({ game, act }: PhaseProps) {
  const slots = fighterCount(game.mode);
  const suggested = game.suggested.length === slots ? game.suggested : game.players.slice(0, slots).map((p) => p.id);
  const [picked, setPicked] = useState<string[]>(suggested);
  const [teams, setTeams] = useState<Record<string, Team>>(() =>
    Object.fromEntries(suggested.map((id, k) => [id, k < 2 ? 'A' : 'B'])),
  );
  const is2v2 = game.mode === '2v2';
  const teamA = game.players.filter((p) => teams[p.id] === 'A').map((p) => p.id);
  const teamB = game.players.filter((p) => teams[p.id] === 'B').map((p) => p.id);
  const fighters = is2v2 ? [...teamA, ...teamB] : picked;
  const ready = is2v2 ? teamA.length === 2 && teamB.length === 2 : picked.length === slots;

  const tap = (id: string) => {
    if (is2v2) {
      setTeams((cur) => {
        const next = { ...cur };
        const a = Object.values(cur).filter((t) => t === 'A').length;
        const b = Object.values(cur).filter((t) => t === 'B').length;
        if (!cur[id]) {
          if (a < 2) next[id] = 'A';
          else if (b < 2) next[id] = 'B';
        } else if (cur[id] === 'A' && b < 2) next[id] = 'B';
        else delete next[id];
        return next;
      });
      return;
    }
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < slots ? [...cur, id] : cur));
  };

  const tag = (id: string) => {
    if (is2v2) return teams[id] ? `Team ${teams[id]}` : 'Judge';
    return picked.includes(id) ? 'Fighting' : 'Judge';
  };

  return (
    <>
      <main className="content">
        <h1 className="h1">Who fights next?</h1>
        <p className="muted">
          {is2v2
            ? 'The next rotation is picked. Tap a name to move it to Team A, Team B, or the judges.'
            : `The next rotation is picked. Tap to swap someone in. ${slots} fighters.`}
        </p>
        <ul className="roster">
          {game.players.map((p) => {
            const on = is2v2 ? !!teams[p.id] : picked.includes(p.id);
            const team = is2v2 ? (teams[p.id] === 'B' ? 'b' : 'a') : 'a';
            return (
              <li key={p.id}>
                <button type="button" className={`rost${on ? ` is-on team-${team}` : ''}`} aria-pressed={on} onClick={() => tap(p.id)}>
                  <span className="rost-name">{p.name}</span>
                  <span className="rost-tag">{tag(p.id)}</span>
                  <span className="rost-score">{p.score}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </main>
      <Dock>
        <Btn disabled={!ready} onClick={() => act({ type: 'set-lineup', fighterIds: fighters })}>
          {ready ? matchupLabel(fighters.map((id) => player(game, id).name), game.mode) : is2v2 ? 'Fill both teams' : `Pick ${slots} fighters`}
        </Btn>
      </Dock>
    </>
  );
}

function KingLineup({ game, act }: PhaseProps) {
  const king = player(game, game.kingId!);
  const [challenger, setChallenger] = useState<string>(game.suggested[1] ?? '');
  const others = game.players.filter((p) => p.id !== king.id);
  return (
    <>
      <main className="content">
        <div className="throne">
          <span className="throne-crown" aria-hidden>♛</span>
          <span className="throne-name">{king.name}</span>
          <span className="throne-streak">King, {game.kingStreak} {game.kingStreak === 1 ? 'win' : 'wins'} in a row</span>
        </div>
        <h1 className="h1">Who challenges the King?</h1>
        <p className="muted">The King stays on. The next seat in line is picked. Tap to send someone else.</p>
        <ul className="roster">
          {others.map((p) => (
            <li key={p.id}>
              <button type="button" className={`rost${challenger === p.id ? ' is-on team-b' : ''}`} aria-pressed={challenger === p.id} onClick={() => setChallenger(p.id)}>
                <span className="rost-name">{p.name}</span>
                <span className="rost-tag">{challenger === p.id ? 'Challenger' : 'Judge'}</span>
                <span className="rost-score">{p.score}</span>
              </button>
            </li>
          ))}
        </ul>
      </main>
      <Dock>
        <Btn disabled={!challenger} onClick={() => act({ type: 'set-lineup', fighterIds: [king.id, challenger] })}>
          {challenger ? `${king.name} vs. ${player(game, challenger).name}` : 'Pick a challenger'}
        </Btn>
      </Dock>
    </>
  );
}

function Announce({ game, act }: PhaseProps) {
  const [a, b] = game.fighters.map((id) => player(game, id));
  const judges = judgesOf(game).map((p) => p.name);
  return (
    <>
      <main className="content">
        <h1 className="h1 h1-fight">{roundLabel(game)}</h1>
        <div className="announce">
          <span className="announce-name">{a.name}</span>
          <Vs />
          <span className="announce-name">{b.name}</span>
        </div>
        <p className="muted">Judging: {judges.join(', ')}.</p>
        {game.bracket ? <BracketBoard game={game} bracket={game.bracket} /> : null}
      </main>
      <Dock>
        <Btn onClick={() => act({ type: 'begin-match' })}>Deal the hands</Btn>
      </Dock>
    </>
  );
}

function Champion({ game, onEnd }: { game: Game; onEnd: (again: boolean) => void }) {
  const [splash, setSplash] = useState(true);
  const id = champion(game);
  const r = lastResult(game);
  const name = id ? player(game, id).name : 'Nobody';
  const builds = r ? r.builds.filter((b) => b.playerId === id) : [];
  if (splash) {
    return <Splash big kicker="Champion!" names={name} builds={builds} game={game} onDone={() => setSplash(false)} doneLabel="See the bracket" />;
  }
  return (
    <>
      <main className="content">
        <h1 className="h1 h1-fight">{name} takes the tournament</h1>
        {game.bracket ? <BracketBoard game={game} bracket={game.bracket} /> : null}
        <Scores game={game} />
      </main>
      <Dock>
        <Btn onClick={() => onEnd(true)}>New table, same players</Btn>
        <Btn tone="quiet" onClick={() => setSplash(true)}>Show the champion again</Btn>
      </Dock>
    </>
  );
}

// ---------- score sheet ----------

function recordLine(game: Game, r: RoundResult): string {
  const win = r.sides.find((s) => s.id === r.winnerId)!;
  const losers = r.sides.filter((s) => s.id !== r.winnerId).map((s) => sideName(game, s)).join(' and ');
  const score = r.sides.filter((s) => r.tally[s.id] !== undefined).map((s) => r.tally[s.id]).join('–');
  const tb = r.contests.length ? ` after ${r.contests.length === 1 ? 'a tiebreaker' : `${r.contests.length} tiebreakers`}` : '';
  return `${sideName(game, win)} beat ${losers}, ${score}${tb}`;
}

function Scores({ game }: { game: Game }) {
  const sorted = [...game.players].sort((a, b) => b.score - a.score);
  return (
    <ol className="scores">
      {sorted.map((p) => (
        <li key={p.id}>
          <span>{game.kingId === p.id ? '♛ ' : ''}{p.name}</span>
          <b>{p.score}</b>
        </li>
      ))}
    </ol>
  );
}

function ScoreSheet({ game, onClose }: { game: Game; onClose: () => void }) {
  return (
    <Sheet title="Score sheet" onClose={onClose}>
      <Scores game={game} />
      {game.bracket ? (
        <>
          <h3>Bracket</h3>
          <BracketBoard game={game} bracket={game.bracket} />
        </>
      ) : null}
      <h3>Record</h3>
      {game.history.length === 0 ? (
        <p className="muted">No rounds settled yet.</p>
      ) : (
        <ol className="record">
          {game.history.map((r) => (
            <li key={r.round}>
              <span className="record-round">{game.style === 'tournament' ? `Match ${r.round}` : `Round ${r.round}`}</span>
              {recordLine(game, r)}
            </li>
          ))}
        </ol>
      )}
    </Sheet>
  );
}
