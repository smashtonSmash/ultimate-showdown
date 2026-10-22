import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GAME_NAME } from '@/brand';
import { Button, TextButton } from '@/components/Button';
import { deckSummary } from '@/data/decks';
import { FighterPlate } from '@/components/FighterPlate';
import { PlayingCard } from '@/components/PlayingCard';
import { ScoreStrip } from '@/components/ScoreStrip';
import { Body, Eyebrow, ScreenFrame, Title } from '@/components/ui';
import {
  getBuild,
  getHand,
  getJudges,
  getPlayer,
  latestResult,
  peekNextFighters,
  playerForPhase,
} from '@/game/engine';
import type { GameAction, GameSession } from '@/game/types';
import { useGame } from '@/state/GameProvider';
import { colors, type } from '@/theme';

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
  const left = getPlayer(session, session.fighterIds[0]);
  const right = getPlayer(session, session.fighterIds[1]);
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
            Round {session.roundNumber} · {left.name} vs {right.name}
          </Text>
          <Text style={styles.decks} numberOfLines={2}>
            {deckSummary(session.deckIds)}
          </Text>
          <ScoreStrip
            players={session.players}
            fighterIds={session.fighterIds}
            activeId={active?.id ?? null}
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
  fighterIndex: 0 | 1;
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
      <Eyebrow>Fighter {fighterIndex + 1} of 2</Eyebrow>
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
  fighterIndex: 0 | 1;
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
      <Body>Keep the character you can defend. A power comes next.</Body>
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
  fighterIndex: 0 | 1;
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
  fighterIndex: 0 | 1;
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
        side={fighterIndex === 0 ? 'left' : 'right'}
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
  const [leftId, rightId] = session.fighterIds;
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
      <FighterPlate
        name={getPlayer(session, leftId).name}
        side="left"
        build={getBuild(session, leftId)}
      />
      <View style={styles.vsRow}>
        <View style={styles.vsLine} />
        <Text style={styles.vs}>VS</Text>
        <View style={styles.vsLine} />
      </View>
      <FighterPlate
        name={getPlayer(session, rightId).name}
        side="right"
        build={getBuild(session, rightId)}
      />
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
      <Body>Votes stay secret until every judge has gone. Then the sheet records the result.</Body>
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
  const [leftId, rightId] = session.fighterIds;
  const left = getPlayer(session, leftId);
  const right = getPlayer(session, rightId);
  const choiceName = choiceId === leftId ? left.name : choiceId === rightId ? right.name : null;

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
          label={choiceName ? `Vote for ${choiceName}` : 'Choose a fighter'}
          disabled={!choiceId}
          onPress={() => {
            if (choiceId) dispatch({ type: 'cast-vote', choiceId });
          }}
        />
      }
    >
      <Eyebrow>{`Judge ${judgeIndex + 1} of ${judges.length}`}</Eyebrow>
      <Title>{`${judge.name}, who takes it?`}</Title>
      <Body>Tap the fighter you think wins. The rest of the table will see the tally after every judge has voted.</Body>
      <FighterPlate
        name={left.name}
        side="left"
        selected={choiceId === leftId}
        build={getBuild(session, leftId)}
        onPress={() => setChoiceId(leftId)}
      />
      <FighterPlate
        name={right.name}
        side="right"
        selected={choiceId === rightId}
        build={getBuild(session, rightId)}
        onPress={() => setChoiceId(rightId)}
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
  const [nextLeft, nextRight] = peekNextFighters(session);
  if (!result) {
    return (
      <TableChrome session={session} onEnd={onEnd}>
        <Title>The sheet is blank.</Title>
      </TableChrome>
    );
  }

  const left = getPlayer(session, result.fighterIds[0]);
  const right = getPlayer(session, result.fighterIds[1]);
  const leftVotes = result.tally[left.id] ?? 0;
  const rightVotes = result.tally[right.id] ?? 0;
  const winner = result.winnerId ? getPlayer(session, result.winnerId) : null;
  const headline = winner ? `${winner.name} takes the showdown` : 'Split decision';
  const summary = winner
    ? `${Math.max(leftVotes, rightVotes)} to ${Math.min(leftVotes, rightVotes)}. A point goes on the sheet.`
    : `${leftVotes} to ${rightVotes}. Nobody scores.`;

  return (
    <TableChrome
      session={session}
      onEnd={onEnd}
      footer={
        <>
          <Button label="Next showdown" onPress={() => dispatch({ type: 'next-round' })} />
          <Button label="New table" tone="ghost" onPress={onReset} />
        </>
      }
    >
      <Eyebrow>{`Round ${result.roundNumber} recorded`}</Eyebrow>
      <Title>{headline}</Title>
      <Body>{summary}</Body>
      <Text style={styles.tally}>
        {left.name} {leftVotes} · {right.name} {rightVotes}
      </Text>
      <FighterPlate
        name={left.name}
        side="left"
        badge={badgeFor(left.id, result.winnerId)}
        build={result.builds[0]}
      />
      <FighterPlate
        name={right.name}
        side="right"
        badge={badgeFor(right.id, result.winnerId)}
        build={result.builds[1]}
      />
      <View style={styles.record}>
        <Text style={styles.recordLabel}>Votes</Text>
        {result.votes.map((vote) => (
          <Text key={vote.judgeId} style={styles.recordLine}>
            {getPlayer(session, vote.judgeId).name} voted for {getPlayer(session, vote.choiceId).name}
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
      <Body>{`Next showdown: ${nextLeft.name} vs ${nextRight.name}.`}</Body>
    </TableChrome>
  );
}

function badgeFor(playerId: string, winnerId: string | null): string {
  if (!winnerId) return 'Split';
  return playerId === winnerId ? 'Winner' : 'Runner-up';
}

function recordLine(session: GameSession, result: GameSession['history'][number]): string {
  const left = getPlayer(session, result.fighterIds[0]);
  const right = getPlayer(session, result.fighterIds[1]);
  const leftVotes = result.tally[left.id] ?? 0;
  const rightVotes = result.tally[right.id] ?? 0;
  if (!result.winnerId) {
    return `Round ${result.roundNumber} · ${left.name} and ${right.name} split ${leftVotes}–${rightVotes}`;
  }
  const winner = getPlayer(session, result.winnerId);
  const loser = winner.id === left.id ? right : left;
  const winnerVotes = result.tally[winner.id] ?? 0;
  const loserVotes = result.tally[loser.id] ?? 0;
  return `Round ${result.roundNumber} · ${winner.name} beat ${loser.name}, ${winnerVotes}–${loserVotes}`;
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
});
