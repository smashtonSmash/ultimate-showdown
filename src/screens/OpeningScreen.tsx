import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, TextButton } from '@/components/Button';
import { Body, Eyebrow, ScreenFrame, Title } from '@/components/ui';
import { fighterCount, isMatchMode, isPlayStyle, matchupLabel, openingLineup } from '@/game/engine';
import type { MatchMode, PlayStyle } from '@/game/types';
import { useGame } from '@/state/GameProvider';
import { colors, type, webPressable } from '@/theme';

type Team = 'A' | 'B';

export function OpeningScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; style?: string }>();
  const { pendingNames, matchMode, playStyle: storedStyle, startTable } = useGame();
  const mode: MatchMode = isMatchMode(params.mode) ? params.mode : matchMode;
  const playStyle: PlayStyle = isPlayStyle(params.style) ? params.style : storedStyle;
  const slots = fighterCount(mode);
  const [picked, setPicked] = useState<string[] | null>(null);
  const [teams, setTeams] = useState<Partial<Record<string, Team>> | null>(null);
  const [showJudges, setShowJudges] = useState(false);

  if (!pendingNames) {
    return (
      <ScreenFrame footer={<Button label="Choose players" onPress={() => router.replace('/setup')} />}>
        <Eyebrow>First showdown</Eyebrow>
        <Title>Seat the table first.</Title>
        <Body>Fighters are chosen after the players have names.</Body>
      </ScreenFrame>
    );
  }

  if (pendingNames.length < slots + 1) {
    return (
      <ScreenFrame footer={<Button label="Choose the fight" onPress={() => router.replace('/mode')} />}>
        <Eyebrow>First showdown</Eyebrow>
        <Title>This fight needs more players.</Title>
        <Body>{`A ${mode} needs ${slots + 1} people, so someone outside it can judge.`}</Body>
      </ScreenFrame>
    );
  }

  const assignment = teams ?? defaultTeams(pendingNames);
  const grouped = groupTeams(pendingNames, assignment);
  const selected = picked ?? pendingNames.slice(0, slots);
  const fighters = mode === '2v2' ? [...grouped.a, ...grouped.b] : selected;
  const ready = mode === '2v2' ? grouped.a.length === 2 && grouped.b.length === 2 : selected.length === slots;
  const matchup = ready ? matchupLabel(fighters, mode) : waitingLabel(mode);
  const lineup = ready ? openingLineup(pendingNames, { mode, fighters }) : null;

  function toggleFighter(name: string) {
    setPicked((current) => {
      const seats = current ?? pendingNames!.slice(0, slots);
      if (seats.includes(name)) return seats.filter((seat) => seat !== name);
      if (seats.length >= slots) return seats;
      return [...seats, name];
    });
    setShowJudges(false);
  }

  function toggleTeam(name: string) {
    setTeams((current) => {
      const next = { ...(current ?? defaultTeams(pendingNames!)) };
      const team = next[name];
      const counts = groupTeams(pendingNames!, next);
      if (!team) {
        if (counts.a.length < 2) next[name] = 'A';
        else if (counts.b.length < 2) next[name] = 'B';
      } else if (team === 'A') {
        if (counts.b.length < 2) next[name] = 'B';
        else delete next[name];
      } else {
        delete next[name];
      }
      return next;
    });
    setShowJudges(false);
  }

  if (showJudges && lineup) {
    return (
      <ScreenFrame
        footer={
          <Button
            label="Continue"
            onPress={() => {
              startTable(pendingNames, mode, lineup.fighters, playStyle);
              router.replace('/table');
            }}
          />
        }
      >
        <TextButton label="Back" onPress={() => setShowJudges(false)} />
        <Eyebrow>Judges</Eyebrow>
        <Title>The remaining players are the judges.</Title>
        <Body>{judgeCopy(mode)}</Body>
        <View style={styles.list}>
          {lineup.judges.map((name) => (
            <View key={name} style={styles.row}>
              <Text style={styles.judge}>{name}</Text>
            </View>
          ))}
        </View>
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame
      footer={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={matchup}
          accessibilityState={{ disabled: !ready }}
          disabled={!ready}
          onPress={() => setShowJudges(true)}
          style={({ pressed }) => [
            styles.match,
            ready ? styles.matchReady : styles.matchWaiting,
            webPressable,
            pressed && ready && styles.matchPressed,
          ]}
        >
          <Text
            style={[
              styles.matchText,
              matchup.length > 28 && styles.matchTextLong,
              !ready && styles.matchTextWaiting,
            ]}
          >
            {matchup}
          </Text>
        </Pressable>
      }
    >
      <TextButton label="Back" onPress={() => router.back()} />
      <Eyebrow>First showdown</Eyebrow>
      <Title>Who's fighting first.</Title>
      <Body>{playStyle === 'king' ? `${helpCopy(mode)} The winner wears the crown.` : helpCopy(mode)}</Body>
      <View style={styles.list}>
        {pendingNames.map((name) => {
          if (mode === '2v2') {
            const team = assignment[name];
            return (
              <Pressable
                key={name}
                accessibilityRole="button"
                accessibilityLabel={team ? `${name}, Team ${team}` : name}
                onPress={() => toggleTeam(name)}
                style={[styles.choice, webPressable, team && styles.choiceOn]}
              >
                <Text style={styles.choiceName}>{name}</Text>
                <View style={[styles.badge, team && styles.badgeOn]}>
                  <Text style={[styles.badgeText, team && styles.badgeTextOn]}>{team ?? ''}</Text>
                </View>
              </Pressable>
            );
          }
          const order = selected.indexOf(name);
          const on = order >= 0;
          return (
            <Pressable
              key={name}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={on ? `${name}, fighter ${order + 1}` : name}
              onPress={() => toggleFighter(name)}
              style={[styles.choice, webPressable, on && styles.choiceOn]}
            >
              <Text style={styles.choiceName}>{name}</Text>
              <View style={[styles.badge, on && styles.badgeOn]}>
                <Text style={[styles.badgeText, on && styles.badgeTextOn]}>{on ? order + 1 : ''}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScreenFrame>
  );
}

function defaultTeams(names: readonly string[]): Partial<Record<string, Team>> {
  const next: Partial<Record<string, Team>> = {};
  names.slice(0, 2).forEach((name) => {
    next[name] = 'A';
  });
  names.slice(2, 4).forEach((name) => {
    next[name] = 'B';
  });
  return next;
}

function groupTeams(
  names: readonly string[],
  assignment: Partial<Record<string, Team>>,
): { a: string[]; b: string[] } {
  const a: string[] = [];
  const b: string[] = [];
  for (const name of names) {
    if (assignment[name] === 'A') a.push(name);
    if (assignment[name] === 'B') b.push(name);
  }
  return { a, b };
}

function waitingLabel(mode: MatchMode): string {
  if (mode === '2v2') return 'Fill both teams';
  if (mode === '1v1v1') return 'Pick three fighters';
  return 'Pick two fighters';
}

function helpCopy(mode: MatchMode): string {
  if (mode === '2v2') {
    return 'Tap a name to assign Team A, then Team B. Each team needs two. The first four seats start assigned. Tap someone on a full team to bench them.';
  }
  if (mode === '1v1v1') {
    return 'Tap three names. The first three seats start selected. Deselect someone to change the fight.';
  }
  return 'Tap two names. The first two seats start selected. Deselect someone to change the pair.';
}

function judgeCopy(mode: MatchMode): string {
  if (mode === '2v2') {
    return 'They vote for one team after every fighter locks in a character and a power. Each winner on that team gets a point.';
  }
  if (mode === '1v1v1') {
    return 'They vote for one fighter after all three lock in a character and a power.';
  }
  return 'They vote after both fighters lock in a character and a power.';
}

const styles = StyleSheet.create({
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
  choiceName: {
    ...type.bodyMedium,
    flex: 1,
    fontSize: 18,
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
  match: {
    minHeight: 96,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchReady: {
    backgroundColor: colors.ink,
  },
  matchWaiting: {
    backgroundColor: colors.paperDeep,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  matchPressed: {
    opacity: 0.88,
  },
  matchText: {
    ...type.display,
    color: colors.paper,
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
  },
  matchTextLong: {
    fontSize: 22,
    lineHeight: 28,
  },
  matchTextWaiting: {
    ...type.bodyBold,
    color: colors.inkSoft,
    fontSize: 18,
    lineHeight: 24,
  },
  row: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  judge: {
    ...type.bodyMedium,
    fontSize: 18,
  },
});
