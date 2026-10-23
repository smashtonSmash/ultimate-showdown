import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GAME_NAME } from '@/brand';
import { BracketBoard } from '@/components/BracketBoard';
import { Button, TextButton } from '@/components/Button';
import { deckSummary } from '@/data/decks';
import { FighterPlate } from '@/components/FighterPlate';
import { PlayingCard } from '@/components/PlayingCard';
import { ScoreStrip } from '@/components/ScoreStrip';
import { WinnerSplash } from '@/components/WinnerSplash';
import { Body, Eyebrow, ScreenFrame, Title } from '@/components/ui';
import {
  ballotSides,
  fighterCount,
  getHand,
  getJudges,
  getPlayer,
  latestResult,
  matchupLabel,
  playerForPhase,
  stageName,
} from '@/game/engine';
import type { BracketMatch, Build, GameAction, GameSession, MatchMode, Side } from '@/game/types';
import { useGame } from '@/state/GameProvider';
import { colors, type, webPressable } from '@/theme';

export function TableScreen() {
  const { session, dispatch, reset } = useGame();
  const router = useRouter();
  const [ending, setEnding] = useState(false);

  if (!session) {
    return (
      <ScreenFrame footer={<Button label="Back to the start" onPress={() => router.replace('/')} />}>
        <Eyebrow>{GAME_NAME}</Eyebrow>
        <Title>No table is set.</Title>
        <Body>Seat a few players and deal the first showdown.</Body>
      </ScreenFrame>
    );
  }

  if (ending) {
    return (
      <ScreenFrame
        footer={
          <>
            <Button
              label="End table"
              onPress={() => {
                reset();
                router.replace('/');
              }}
            />
            <Button label="Keep playing" tone="ghost" onPress={() => setEnding(false)} />
          </>
        }
      >
        <Eyebrow>{GAME_NAME}</Eyebrow>
        <Title>End this table?</Title>
        <Body>The score sheet on this phone will be cleared. Hidden cards go with it.</Body>
      </ScreenFrame>
    );
  }

  const onEnd = () => setEnding(true);
  switch (session.phase.type) {
    case 'pass':
      return (
        <FighterPass
          session={session}
          fighterIndex={session.phase.fighterIndex}
          onContinue={() => dispatch({ type: 'acknowledge-pass' })}
          onEnd={onEnd}
        />
      );
    case 'pick-character':
      return (
        <CharacterPick
          session={session}
          fighterIndex={session.phase.fighterIndex}
          dispatch={dispatch}
          onEnd={onEnd}
        />
      );
    case 'pick-attribute':
      return (
        <AttributePick
          session={session}
          fighterIndex={session.phase.fighterIndex}
          dispatch={dispatch}
          onEnd={onEnd}
        />
      );
    case 'confirm-build':
      return (
        <ConfirmBuild
          session={session}
          fighterIndex={session.phase.fighterIndex}
          dispatch={dispatch}
          onEnd={onEnd}
        />
      );
    case 'matchup':
      return <Matchup session={session} dispatch={dispatch} onEnd={onEnd} />;
    case 'tiebreaker':
      return <Tiebreaker session={session} dispatch={dispatch} onEnd={onEnd} />;
    case 'pass-judge':
      return (
        <JudgePass
          session={session}
          judgeIndex={session.phase.judgeIndex}
          onContinue={() => dispatch({ type: 'acknowledge-judge' })}
          onEnd={onEnd}
        />
      );
    case 'vote':
      return (
        <Vote
          key={session.phase.judgeIndex}
          session={session}
          judgeIndex={session.phase.judgeIndex}
          dispatch={dispatch}
          onEnd={onEnd}
        />
      );
    case 'result':
      return <Result session={session} dispatch={dispatch} onEnd={onEnd} onReset={() => {
        reset();
        router.replace('/');
      }} />;
    case 'lineup':
      return (
        <Lineup
          key={session.roundNumber}
          session={session}
          dispatch={dispatch}
          onEnd={onEnd}
        />
      );
    case 'announce':
      return <Announce session={session} dispatch={dispatch} onEnd={onEnd} />;
    case 'champion':
      return (
        <Champion
          session={session}
          onReset={() => {
            reset();
            router.replace('/');
          }}
        />
      );
    default: {
      const unreachable: never = session.phase;
      return unreachable;
    }
  }
}

function TableChrome({
  session,
  onEnd,
  footer,
  children,
}: {
  session: GameSession;
  onEnd: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const active = playerForPhase(session);
  const roundLabel = matchupLabel(
    session.fighterIds.map((id) => getPlayer(session, id).name),
    session.mode,
  );
  return (
    <ScreenFrame
      header={
        <View style={styles.headerStack}>
          <View style={styles.headerRow}>
            <Text style={styles.brand} numberOfLines={1}>
              {GAME_NAME}
            </Text>
            <TextButton label="End" onPress={onEnd} />
          </View>
          <Text style={styles.round}>
            Round {session.roundNumber} · {roundLabel}
          </Text>
          <Text style={styles.decks} numberOfLines={2}>
            {deckSummary(session.deckIds)}
          </Text>
          <ScoreStrip
            players={session.players}
            fighterIds={session.fighterIds}
            activeId={active?.id ?? null}
            kingId={session.kingId}
            kingStreak={session.kingStreak}
          />
        </View>
      }
      footer={footer}
    >
      {children}
    </ScreenFrame>
  );
}

function FighterPass({
  session,
  fighterIndex,
  onContinue,
  onEnd,
}: {
  session: GameSession;
  fighterIndex: number;
  onContinue: () => void;
  onEnd: () => void;
}) {
  const fighter = getPlayer(session, session.fighterIds[fighterIndex]);
  return (
    <TableChrome
      session={session}
      onEnd={onEnd}
      footer={<Button label={`I'm ${fighter.name}`} onPress={onContinue} />}
    >
      <Eyebrow>{spotLabel(session, fighterIndex)}</Eyebrow>
      <Title>{`Hand the phone to ${fighter.name}.`}</Title>
      <Body>
        {fighter.name} will pick a character and a power. Everyone else looks away. The cards stay hidden until the showdown is revealed.
      </Body>
    </TableChrome>
  );
}

function CharacterPick({
  session,
  fighterIndex,
  dispatch,
  onEnd,
}: {
  session: GameSession;
  fighterIndex: number;
  dispatch: (action: GameAction) => void;
  onEnd: () => void;
}) {
  const fighterId = session.fighterIds[fighterIndex];
  const fighter = getPlayer(session, fighterId);
  const hand = getHand(session, fighterId);
  const selected = session.drafts[fighterId]?.characterId;
  return (
    <TableChrome
      session={session}
      onEnd={onEnd}
      footer={
        <Button
          label={selected ? 'Keep this character' : 'Select a character'}
          disabled={!selected}
          onPress={() => dispatch({ type: 'confirm-character' })}
        />
      }
    >
      <Eyebrow>Step 1 of 2 · Character</Eyebrow>
      <Title>{`${fighter.name}, who is fighting?`}</Title>
      <Body>
        {session.mode === '2v2'
          ? 'Keep the character you can defend. Your teammate builds their own fighter.'
          : 'Keep the character you can defend. A power comes next.'}
      </Body>
      {hand.characters.map((card) => (
        <PlayingCard
          key={card.id}
          card={card}
          selected={card.id === selected}
          onPress={() => dispatch({ type: 'select-character', cardId: card.id })}
        />
      ))}
    </TableChrome>
  );
}

function AttributePick({
  session,
  fighterIndex,
  dispatch,
  onEnd,
}: {
  session: GameSession;
  fighterIndex: number;
  dispatch: (action: GameAction) => void;
  onEnd: () => void;
}) {
  const fighterId = session.fighterIds[fighterIndex];
  const fighter = getPlayer(session, fighterId);
  const hand = getHand(session, fighterId);
  const selected = session.drafts[fighterId]?.attributeId;
  return (
    <TableChrome
      session={session}
      onEnd={onEnd}
      footer={
        <Button
          label={selected ? 'Keep this power' : 'Select a power'}
          disabled={!selected}
          onPress={() => dispatch({ type: 'confirm-attribute' })}
        />
      }
    >
      <Eyebrow>Step 2 of 2 · Power</Eyebrow>
      <Title>{`${fighter.name}, what is the power?`}</Title>
      <Body>A talent or unfair advantage. This is the part you have to sell.</Body>
      {hand.attributes.map((card) => (
        <PlayingCard
          key={card.id}
          card={card}
          selected={card.id === selected}
          onPress={() => dispatch({ type: 'select-attribute', cardId: card.id })}
        />
      ))}
    </TableChrome>
  );
}

function ConfirmBuild({
  session,
  fighterIndex,
  dispatch,
  onEnd,
}: {
  session: GameSession;
  fighterIndex: number;
  dispatch: (action: GameAction) => void;
  onEnd: () => void;
}) {
  const fighterId = session.fighterIds[fighterIndex];
  const fighter = getPlayer(session, fighterId);
  const hand = getHand(session, fighterId);
  const draft = session.drafts[fighterId];
  const character = hand.characters.find((card) => card.id === draft?.characterId);
  const attribute = hand.attributes.find((card) => card.id === draft?.attributeId);
  if (!character || !attribute) {
    return (
      <TableChrome
        session={session}
        onEnd={onEnd}
        footer={<Button label="Choose again" onPress={() => dispatch({ type: 'revise-build' })} />}
      >
        <Title>Those picks slipped.</Title>
        <Body>Choose a character and a power again.</Body>
      </TableChrome>
    );
  }

  return (
    <TableChrome
      session={session}
      onEnd={onEnd}
      footer={
        <>
          <Button label="Lock it in" onPress={() => dispatch({ type: 'lock-build' })} />
          <Button label="Change picks" tone="ghost" onPress={() => dispatch({ type: 'revise-build' })} />
        </>
      }
    >
      <Eyebrow>{`${fighter.name}'s fighter`}</Eyebrow>
      <Title>This is the case you will make.</Title>
      <FighterPlate
        name={fighter.name}
        side={fighterIndex % 2 === 0 ? 'left' : 'right'}
        build={{ playerId: fighterId, character, attribute }}
      />
      <Body>After you lock it in, hand the phone on. The other side will not see this yet.</Body>
    </TableChrome>
  );
}

function Matchup({
  session,
  dispatch,
  onEnd,
}: {
  session: GameSession;
  dispatch: (action: GameAction) => void;
  onEnd: () => void;
}) {
  const judges = getJudges(session);
  return (
    <TableChrome
      session={session}
      onEnd={onEnd}
      footer={<Button label="Call the vote" onPress={() => dispatch({ type: 'call-vote' })} />}
    >
      <Eyebrow>The showdown</Eyebrow>
      <Title>Make the case.</Title>
      <Body>
        {`Judges: ${joinNames(judges.map((judge) => judge.name))}. When the table has heard enough, call the vote.`}
      </Body>
      <SideList session={session} sides={session.sides} />
    </TableChrome>
  );
}

function Tiebreaker({
  session,
  dispatch,
  onEnd,
}: {
  session: GameSession;
  dispatch: (action: GameAction) => void;
  onEnd: () => void;
}) {
  const card = session.tiebreakers[session.tiebreakers.length - 1];
  const sides = ballotSides(session);
  const narrowed = sides.length < session.sides.length;
  if (!card) {
    return (
      <TableChrome session={session} onEnd={onEnd}>
        <Title>The contest card is missing.</Title>
      </TableChrome>
    );
  }
  return (
    <TableChrome
      session={session}
      onEnd={onEnd}
      footer={
        <Button
          label="Judges, vote again"
          onPress={() => dispatch({ type: 'start-tiebreak-vote' })}
        />
      }
    >
      <Eyebrow>
        {session.tiebreakers.length > 1
          ? `Still tied · contest ${session.tiebreakers.length}`
          : 'The judges split'}
      </Eyebrow>
      <Text accessibilityRole="header" style={styles.tiebreakBanner}>
        TIEBREAKER!
      </Text>
      <View style={styles.contest}>
        <Text style={styles.contestLabel}>The contest</Text>
        <Text style={styles.contestTitle}>{card.title}</Text>
        <Text style={styles.contestDetail}>{card.detail}</Text>
      </View>
      <Body>
        {narrowed
          ? `Only the tied sides are still in it: ${joinNames(sides.map((side) => sideTitle(session, side)))}. No fighting.`
          : session.mode === '2v2'
            ? 'Same teams. No fighting. The judges pick a team, and each winner on that team gets a point.'
            : 'Same characters. No fighting. The judges pick who wins this, and that fighter takes the point.'}
      </Body>
      <SideList session={session} sides={sides} />
    </TableChrome>
  );
}

function JudgePass({
  session,
  judgeIndex,
  onContinue,
  onEnd,
}: {
  session: GameSession;
  judgeIndex: number;
  onContinue: () => void;
  onEnd: () => void;
}) {
  const judges = getJudges(session);
  const judge = judges[judgeIndex];
  const contest = session.tiebreakers[session.tiebreakers.length - 1];
  if (!judge) {
    return (
      <TableChrome session={session} onEnd={onEnd}>
        <Title>A judge left the table.</Title>
      </TableChrome>
    );
  }
  return (
    <TableChrome
      session={session}
      onEnd={onEnd}
      footer={<Button label={`I'm ${judge.name}`} onPress={onContinue} />}
    >
      <Eyebrow>{`Judge ${judgeIndex + 1} of ${judges.length}`}</Eyebrow>
      <Title>{`Hand the phone to ${judge.name}.`}</Title>
      <Body>
        {contest
          ? `Vote the contest: ${contest.title}. It stays secret until every judge has gone.`
          : 'Votes stay secret until every judge has gone. Then the sheet records the result.'}
      </Body>
    </TableChrome>
  );
}

function Vote({
  session,
  judgeIndex,
  dispatch,
  onEnd,
}: {
  session: GameSession;
  judgeIndex: number;
  dispatch: (action: GameAction) => void;
  onEnd: () => void;
}) {
  const judges = getJudges(session);
  const judge = judges[judgeIndex];
  const [choiceId, setChoiceId] = useState<string | null>(null);
  const sides = ballotSides(session);
  const chosen = sides.find((side) => side.id === choiceId) ?? null;
  const contest = session.tiebreakers[session.tiebreakers.length - 1];
  const waiting = session.mode === '2v2' ? 'Choose a team' : 'Choose a fighter';

  if (!judge) {
    return (
      <TableChrome session={session} onEnd={onEnd}>
        <Title>A judge left the table.</Title>
      </TableChrome>
    );
  }

  return (
    <TableChrome
      session={session}
      onEnd={onEnd}
      footer={
        <Button
          label={chosen ? `Vote for ${sideTitle(session, chosen)}` : waiting}
          disabled={!chosen}
          onPress={() => {
            if (choiceId) dispatch({ type: 'cast-vote', choiceId });
          }}
        />
      }
    >
      <Eyebrow>{`Judge ${judgeIndex + 1} of ${judges.length}`}</Eyebrow>
      <Title>
        {contest
          ? `${judge.name}, who wins the contest?`
          : session.mode === '2v2'
            ? `${judge.name}, which team takes it?`
            : `${judge.name}, who takes it?`}
      </Title>
      {contest ? (
        <>
          <Body>{contest.title}</Body>
          <Body>{contest.detail}</Body>
        </>
      ) : (
        <Body>
          {session.mode === '2v2'
            ? 'Tap the team you think wins. The rest of the table will see the tally after every judge has voted.'
            : 'Tap the fighter you think wins. The rest of the table will see the tally after every judge has voted.'}
        </Body>
      )}
      <SideList
        session={session}
        sides={sides}
        selectedId={choiceId}
        onSelect={setChoiceId}
      />
    </TableChrome>
  );
}

function Result({
  session,
  dispatch,
  onEnd,
  onReset,
}: {
  session: GameSession;
  dispatch: (action: GameAction) => void;
  onEnd: () => void;
  onReset: () => void;
}) {
  const result = latestResult(session);
  if (!result) {
    return (
      <TableChrome session={session} onEnd={onEnd}>
        <Title>The sheet is blank.</Title>
      </TableChrome>
    );
  }

  const winningSide = result.sides.find((side) => side.id === result.winnerId) ?? null;
  const winnerNames = winningSide ? namesOf(session, winningSide.playerIds) : [];
  const contest = result.tiebreakers[result.tiebreakers.length - 1];
  const tallied = result.sides.filter((side) => result.tally[side.id] !== undefined);
  const crowned =
    session.playStyle === 'king' &&
    session.kingId !== null &&
    (winningSide?.playerIds.includes(session.kingId) ?? false);
  const nextLabel =
    session.playStyle === 'king'
      ? 'Choose the challenger'
      : session.playStyle === 'tournament'
        ? 'Update the bracket'
        : 'Choose the next fight';

  return (
    <TableChrome
      session={session}
      onEnd={onEnd}
      footer={
        <>
          <Button label={nextLabel} onPress={() => dispatch({ type: 'next-round' })} />
          <Button label="New table" tone="ghost" onPress={onReset} />
        </>
      }
    >
      <View style={styles.splashBleed}>
        <WinnerSplash
          kicker="WINNER!"
          names={winnerNames.length > 0 ? joinNames(winnerNames) : 'Split decision'}
          builds={winningSide ? splashBuilds(session, result.builds, winningSide) : []}
          crowned={crowned}
          streak={crowned ? session.kingStreak : 0}
        />
      </View>
      <Body>
        {winningSide ? pointCopy(winningSide.playerIds.length, Boolean(contest)) : 'Nobody scores.'}
      </Body>
      {contest ? <Text style={styles.contestTitle}>{contest.title}</Text> : null}
      <Text style={styles.tally}>
        {tallied
          .map((side) => `${sideTitle(session, side)} ${result.tally[side.id] ?? 0}`)
          .join(' · ')}
      </Text>
      <View style={styles.record}>
        <Text style={styles.recordLabel}>Votes</Text>
        {result.votes.map((vote) => (
          <Text key={vote.judgeId} style={styles.recordLine}>
            {getPlayer(session, vote.judgeId).name} voted for {choiceTitle(session, result.sides, vote.choiceId)}
          </Text>
        ))}
      </View>
      <View style={styles.record}>
        <Text style={styles.recordLabel}>Record</Text>
        {session.history.map((entry) => (
          <Text key={entry.roundNumber} style={styles.recordLine}>
            {recordLine(session, entry)}
          </Text>
        ))}
      </View>
    </TableChrome>
  );
}

function Lineup({
  session,
  dispatch,
  onEnd,
}: {
  session: GameSession;
  dispatch: (action: GameAction) => void;
  onEnd: () => void;
}) {
  if (session.playStyle === 'king' && session.kingId) {
    return <KingLineup session={session} dispatch={dispatch} onEnd={onEnd} kingId={session.kingId} />;
  }
  return <FreeLineup session={session} dispatch={dispatch} onEnd={onEnd} />;
}

function FreeLineup({
  session,
  dispatch,
  onEnd,
}: {
  session: GameSession;
  dispatch: (action: GameAction) => void;
  onEnd: () => void;
}) {
  const slots = fighterCount(session.mode);
  const suggested = session.suggestedFighterIds;
  const [picked, setPicked] = useState<string[]>(
    suggested.length === slots ? suggested.slice() : session.players.slice(0, slots).map((player) => player.id),
  );
  const [teams, setTeams] = useState<Partial<Record<string, Team>> | null>(null);
  const assignment = teams ?? defaultTeams(suggested);
  const grouped = groupTeams(session, assignment);
  const fighters = session.mode === '2v2' ? [...grouped.a, ...grouped.b] : picked;
  const ready =
    session.mode === '2v2' ? grouped.a.length === 2 && grouped.b.length === 2 : picked.length === slots;
  const label = ready ? matchupLabel(fighters.map((id) => getPlayer(session, id).name), session.mode) : waitingLabel(session.mode);

  function toggleFighter(id: string) {
    setPicked((current) => {
      if (current.includes(id)) return current.filter((seat) => seat !== id);
      if (current.length >= slots) return current;
      return [...current, id];
    });
  }

  function toggleTeam(id: string) {
    setTeams((current) => {
      const next = { ...(current ?? defaultTeams(suggested)) };
      const team = next[id];
      const counts = groupTeams(session, next);
      if (!team) {
        if (counts.a.length < 2) next[id] = 'A';
        else if (counts.b.length < 2) next[id] = 'B';
      } else if (team === 'A') {
        if (counts.b.length < 2) next[id] = 'B';
        else delete next[id];
      } else {
        delete next[id];
      }
      return next;
    });
  }

  return (
    <QuietFrame
      session={session}
      onEnd={onEnd}
      footer={
        <Button
          label={label}
          disabled={!ready}
          onPress={() => dispatch({ type: 'confirm-lineup', fighterIds: fighters })}
        />
      }
    >
      <Eyebrow>{`Round ${session.roundNumber + 1}`}</Eyebrow>
      <Title>Who's fighting?</Title>
      <Body>{lineupHelp(session.mode)}</Body>
      <View style={styles.list}>
        {session.players.map((player) => {
          if (session.mode === '2v2') {
            const team = assignment[player.id];
            return (
              <Pressable
                key={player.id}
                accessibilityRole="button"
                accessibilityLabel={team ? `${player.name}, Team ${team}` : player.name}
                onPress={() => toggleTeam(player.id)}
                style={[styles.choice, webPressable, team && styles.choiceOn]}
              >
                <Text style={styles.choiceName}>{player.name}</Text>
                <View style={[styles.badge, team && styles.badgeOn]}>
                  <Text style={[styles.badgeText, team && styles.badgeTextOn]}>{team ?? ''}</Text>
                </View>
              </Pressable>
            );
          }
          const order = picked.indexOf(player.id);
          const on = order >= 0;
          return (
            <Pressable
              key={player.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={on ? `${player.name}, fighter ${order + 1}` : player.name}
              onPress={() => toggleFighter(player.id)}
              style={[styles.choice, webPressable, on && styles.choiceOn]}
            >
              <Text style={styles.choiceName}>{player.name}</Text>
              <View style={[styles.badge, on && styles.badgeOn]}>
                <Text style={[styles.badgeText, on && styles.badgeTextOn]}>{on ? order + 1 : ''}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </QuietFrame>
  );
}

function KingLineup({
  session,
  dispatch,
  onEnd,
  kingId,
}: {
  session: GameSession;
  dispatch: (action: GameAction) => void;
  onEnd: () => void;
  kingId: string;
}) {
  const suggested = session.suggestedFighterIds.find((id) => id !== kingId) ?? null;
  const [challengerId, setChallengerId] = useState<string | null>(suggested);
  const king = getPlayer(session, kingId);
  const challenger = challengerId ? getPlayer(session, challengerId) : null;
  const label = challenger ? `${challenger.name} challenges ${king.name}` : 'Choose a challenger';

  return (
    <QuietFrame
      session={session}
      onEnd={onEnd}
      footer={
        <Button
          label={label}
          disabled={!challengerId}
          onPress={() => {
            if (challengerId) dispatch({ type: 'confirm-lineup', fighterIds: [kingId, challengerId] });
          }}
        />
      }
    >
      <Eyebrow>{`Round ${session.roundNumber + 1}`}</Eyebrow>
      <Title>Who challenges the King?</Title>
      <Body>The King stays. Tap who challenges them. The next seat starts selected.</Body>
      <View style={styles.list}>
        {session.players.map((player) => {
          if (player.id === kingId) {
            return (
              <View
                key={player.id}
                accessibilityRole="text"
                accessibilityLabel={`${player.name}, the King`}
                style={[styles.choice, styles.choiceOn]}
              >
                <View style={styles.choiceCopy}>
                  <Text style={styles.choiceName}>{`♛ ${player.name}`}</Text>
                  <Text style={styles.streak}>{`${session.kingStreak} in a row`}</Text>
                </View>
                <View style={[styles.badge, styles.badgeOn]}>
                  <Text style={[styles.badgeText, styles.badgeTextOn]}>♛</Text>
                </View>
              </View>
            );
          }
          const on = player.id === challengerId;
          return (
            <Pressable
              key={player.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={on ? `${player.name}, challenger` : player.name}
              onPress={() => setChallengerId(on ? null : player.id)}
              style={[styles.choice, webPressable, on && styles.choiceOn]}
            >
              <Text style={styles.choiceName}>{player.name}</Text>
              <View style={[styles.badge, on && styles.badgeOn]}>
                <Text style={[styles.badgeText, on && styles.badgeTextOn]}>{on ? 'In' : ''}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </QuietFrame>
  );
}

function Announce({
  session,
  dispatch,
  onEnd,
}: {
  session: GameSession;
  dispatch: (action: GameAction) => void;
  onEnd: () => void;
}) {
  const match = currentMatch(session);
  const roundCount = session.bracket
    ? new Set(session.bracket.matches.map((entry) => entry.round)).size
    : 1;
  const stage = match ? stageName(match.round, roundCount) : 'Match';
  const names = session.fighterIds.map((id) => getPlayer(session, id).name);
  const headline =
    names.length >= 2 ? `Round ${session.roundNumber}: ${names[0]} vs. ${names[1]}` : 'The bracket is set';
  const judges = getJudges(session);

  return (
    <QuietFrame
      session={session}
      onEnd={onEnd}
      footer={<Button label="Start the fight" onPress={() => dispatch({ type: 'begin-match' })} />}
    >
      <Eyebrow>{stage}</Eyebrow>
      <Text accessibilityRole="header" style={styles.announce}>
        {headline}
      </Text>
      <Body>
        {judges.length > 0
          ? `${joinNames(judges.map((judge) => judge.name))} ${judges.length === 1 ? 'judges' : 'judge'}. Everyone outside the match stays off the cards.`
          : 'Everyone outside the match judges.'}
      </Body>
      <BracketBoard session={session} />
    </QuietFrame>
  );
}

function Champion({ session, onReset }: { session: GameSession; onReset: () => void }) {
  const result = latestResult(session);
  const winningSide = result?.sides.find((side) => side.id === result.winnerId) ?? null;
  const winnerNames = winningSide ? namesOf(session, winningSide.playerIds) : championFallback(session);

  return (
    <ScreenFrame footer={<Button label="New table" onPress={onReset} />}>
      <View style={styles.splashBleed}>
        <WinnerSplash
          kicker="CHAMPION!"
          names={winnerNames.length > 0 ? joinNames(winnerNames) : 'Champion'}
          builds={winningSide && result ? splashBuilds(session, result.builds, winningSide) : []}
          intense
        />
      </View>
      <BracketBoard session={session} />
    </ScreenFrame>
  );
}

function QuietFrame({
  session,
  onEnd,
  footer,
  children,
}: {
  session: GameSession;
  onEnd: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <ScreenFrame
      header={
        <View style={styles.headerStack}>
          <View style={styles.headerRow}>
            <Text style={styles.brand} numberOfLines={1}>
              {GAME_NAME}
            </Text>
            <TextButton label="End" onPress={onEnd} />
          </View>
          <ScoreStrip
            players={session.players}
            fighterIds={session.fighterIds}
            activeId={null}
            kingId={session.kingId}
            kingStreak={session.kingStreak}
          />
        </View>
      }
      footer={footer}
    >
      {children}
    </ScreenFrame>
  );
}

function currentMatch(session: GameSession): BracketMatch | null {
  const id = session.bracket?.currentMatchId;
  if (!id || !session.bracket) return null;
  return session.bracket.matches.find((match) => match.id === id) ?? null;
}

function splashBuilds(
  session: GameSession,
  builds: readonly Build[],
  side: Side,
): { character: string; power: string }[] {
  return side.playerIds.flatMap((id) => {
    const build = builds.find((entry) => entry.playerId === id);
    if (!build) return [];
    const character =
      side.playerIds.length > 1
        ? `${getPlayer(session, id).name} · ${build.character.title}`
        : build.character.title;
    return [{ character, power: build.attribute.title }];
  });
}

function championFallback(session: GameSession): string[] {
  const finalMatch = session.bracket?.matches.reduce<BracketMatch | null>(
    (best, match) => (!best || match.round > best.round ? match : best),
    null,
  );
  if (!finalMatch?.winnerId) return [];
  return [getPlayer(session, finalMatch.winnerId).name];
}

type Team = 'A' | 'B';

function defaultTeams(suggested: readonly string[]): Partial<Record<string, Team>> {
  const next: Partial<Record<string, Team>> = {};
  suggested.slice(0, 2).forEach((id) => {
    next[id] = 'A';
  });
  suggested.slice(2, 4).forEach((id) => {
    next[id] = 'B';
  });
  return next;
}

function groupTeams(
  session: GameSession,
  assignment: Partial<Record<string, Team>>,
): { a: string[]; b: string[] } {
  const a: string[] = [];
  const b: string[] = [];
  for (const player of session.players) {
    if (assignment[player.id] === 'A') a.push(player.id);
    if (assignment[player.id] === 'B') b.push(player.id);
  }
  return { a, b };
}

function waitingLabel(mode: MatchMode): string {
  if (mode === '2v2') return 'Fill both teams';
  if (mode === '1v1v1') return 'Pick three fighters';
  return 'Pick two fighters';
}

function lineupHelp(mode: MatchMode): string {
  if (mode === '2v2') {
    return 'The next rotation starts selected. Tap a name to assign Team A, then Team B. Tap someone on a full team to bench them.';
  }
  if (mode === '1v1v1') {
    return 'The next rotation starts selected. Tap to send someone else in. Three fighters.';
  }
  return 'The next rotation starts selected. Tap to send someone else in.';
}

function SideList({
  session,
  sides,
  selectedId,
  onSelect,
  builds,
  winnerId,
}: {
  session: GameSession;
  sides: readonly Side[];
  selectedId?: string | null;
  onSelect?: (sideId: string) => void;
  builds?: Build[];
  winnerId?: string | null;
}) {
  return (
    <>
      {sides.map((side, index) => (
        <View key={side.id} style={styles.sideBlock}>
          {index > 0 ? <Versus /> : null}
          <SideChoice
            session={session}
            side={side}
            accent={index % 2 === 0 ? 'left' : 'right'}
            selected={selectedId === side.id}
            onPress={onSelect ? () => onSelect(side.id) : undefined}
            builds={builds}
            winnerId={winnerId}
          />
        </View>
      ))}
    </>
  );
}

function SideChoice({
  session,
  side,
  accent,
  selected,
  onPress,
  builds,
  winnerId,
}: {
  session: GameSession;
  side: Side;
  accent: 'left' | 'right';
  selected?: boolean;
  onPress?: () => void;
  builds?: Build[];
  winnerId?: string | null;
}) {
  const title = sideTitle(session, side);
  const plates = side.playerIds.map((id) => {
    const build = builds
      ? builds.find((entry) => entry.playerId === id)
      : session.builds[id];
    if (!build) return null;
    const badge =
      winnerId === undefined ? undefined : side.id === winnerId ? 'Winner' : winnerId ? 'Runner-up' : 'Split';
    return (
      <FighterPlate
        key={id}
        name={getPlayer(session, id).name}
        side={accent}
        badge={badge}
        build={build}
      />
    );
  });
  const body = (
    <>
      {side.playerIds.length > 1 ? <Text style={styles.sideLabel}>{title}</Text> : null}
      {plates}
    </>
  );
  if (!onPress) {
    return <View style={styles.sideChoice}>{body}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      onPress={onPress}
      style={[styles.sideChoice, webPressable, selected && styles.sideChoiceOn]}
    >
      {body}
    </Pressable>
  );
}

function Versus() {
  return (
    <View style={styles.vsRow}>
      <View style={styles.vsLine} />
      <Text style={styles.vs}>VS</Text>
      <View style={styles.vsLine} />
    </View>
  );
}

function spotLabel(session: GameSession, fighterIndex: number): string {
  if (session.mode === '2v2') {
    const team = fighterIndex < 2 ? 'A' : 'B';
    return `Team ${team} · ${(fighterIndex % 2) + 1} of 2`;
  }
  return `Fighter ${fighterIndex + 1} of ${session.fighterIds.length}`;
}

function namesOf(session: GameSession, ids: readonly string[]): string[] {
  return ids.map((id) => getPlayer(session, id).name);
}

function sideTitle(session: GameSession, side: Side): string {
  return namesOf(session, side.playerIds).join(' & ');
}

function choiceTitle(session: GameSession, sides: readonly Side[], choiceId: string): string {
  const side = sides.find((entry) => entry.id === choiceId);
  return side ? sideTitle(session, side) : 'a side';
}

function pointCopy(winners: number, settled: boolean): string {
  if (winners > 1) {
    return settled
      ? 'Settled by the contest. A point goes to each of them.'
      : 'A point goes to each of them.';
  }
  return settled
    ? 'Settled by the contest. A point goes on the sheet.'
    : 'A point goes on the sheet.';
}

function recordLine(session: GameSession, result: GameSession['history'][number]): string {
  const contest =
    result.tiebreakers.length > 0
      ? ` · after ${result.tiebreakers.length === 1 ? 'a tiebreaker' : `${result.tiebreakers.length} tiebreakers`}`
      : '';
  const score = result.sides
    .filter((side) => result.tally[side.id] !== undefined)
    .map((side) => `${sideTitle(session, side)} ${result.tally[side.id] ?? 0}`)
    .join(', ');
  const winner = result.sides.find((side) => side.id === result.winnerId);
  if (!winner) {
    return `Round ${result.roundNumber} · split ${score}`;
  }
  return `Round ${result.roundNumber} · ${sideTitle(session, winner)} won · ${score}${contest}`;
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? 'nobody';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

const styles = StyleSheet.create({
  headerStack: {
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brand: {
    ...type.bodyBold,
    flex: 1,
    fontSize: 15,
  },
  round: {
    ...type.body,
    color: colors.inkSoft,
    fontSize: 14,
  },
  decks: {
    ...type.bodyMedium,
    color: colors.inkSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vsLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  vs: {
    ...type.display,
    fontSize: 18,
    color: colors.gold,
  },
  sideBlock: {
    gap: 12,
  },
  sideChoice: {
    gap: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 4,
  },
  sideChoiceOn: {
    borderColor: colors.ink,
    backgroundColor: colors.goldWash,
  },
  sideLabel: {
    ...type.bodyBold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    paddingHorizontal: 6,
  },
  tiebreakBanner: {
    ...type.display,
    fontSize: 44,
    lineHeight: 46,
    color: colors.gold,
    letterSpacing: 0.5,
  },
  contest: {
    backgroundColor: colors.goldWash,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  contestLabel: {
    ...type.bodyBold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  contestTitle: {
    ...type.displaySoft,
    fontSize: 24,
    lineHeight: 30,
  },
  contestDetail: {
    ...type.body,
    fontSize: 16,
    lineHeight: 22,
    color: colors.inkSoft,
  },
  tally: {
    ...type.displaySoft,
    fontSize: 22,
    lineHeight: 28,
  },
  record: {
    gap: 6,
  },
  recordLabel: {
    ...type.bodyBold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.inkSoft,
  },
  recordLine: {
    ...type.body,
    fontSize: 15,
    lineHeight: 21,
  },
  splashBleed: {
    marginHorizontal: -20,
  },
  announce: {
    ...type.display,
    fontSize: 36,
    lineHeight: 40,
  },
  list: {
    gap: 8,
  },
  choice: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  choiceOn: {
    backgroundColor: colors.goldWash,
    borderColor: colors.ink,
  },
  choiceCopy: {
    flex: 1,
    gap: 2,
  },
  choiceName: {
    ...type.bodyMedium,
    flex: 1,
    fontSize: 18,
  },
  streak: {
    ...type.bodyBold,
    color: colors.gold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  badgeText: {
    ...type.bodyBold,
    fontSize: 14,
    color: 'transparent',
  },
  badgeTextOn: {
    color: colors.paper,
  },
});
