import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, TextButton } from '@/components/Button';
import { Body, Eyebrow, ScreenFrame, Title } from '@/components/ui';
import { MIN_PLAYERS, openingLineup } from '@/game/engine';
import { useGame } from '@/state/GameProvider';
import { colors, type, webPressable } from '@/theme';

export function OpeningScreen() {
  const router = useRouter();
  const { pendingNames, startTable } = useGame();
  const [picked, setPicked] = useState<string[] | null>(null);
  const [showJudges, setShowJudges] = useState(false);

  if (!pendingNames || pendingNames.length < MIN_PLAYERS) {
    return (
      <ScreenFrame footer={<Button label="Choose players" onPress={() => router.replace('/setup')} />}>
        <Eyebrow>First showdown</Eyebrow>
        <Title>Seat the table first.</Title>
        <Body>Fighters are chosen after the players have names.</Body>
      </ScreenFrame>
    );
  }

  const selected = picked ?? pendingNames.slice(0, 2);
  const ready = selected.length === 2;
  const matchup = ready ? `${selected[0]} vs. ${selected[1]}` : 'Pick two fighters';
  const lineup = ready ? openingLineup(pendingNames, [selected[0], selected[1]]) : null;

  function toggle(name: string) {
    setPicked((current) => {
      const seats = current ?? pendingNames!.slice(0, 2);
      if (seats.includes(name)) return seats.filter((seat) => seat !== name);
      if (seats.length >= 2) return seats;
      return [...seats, name];
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
              startTable(pendingNames, lineup.fighters);
              router.replace('/table');
            }}
          />
        }
      >
        <TextButton label="Back" onPress={() => setShowJudges(false)} />
        <Eyebrow>Judges</Eyebrow>
        <Title>The remaining players are the judges.</Title>
        <Body>They vote after both fighters lock in a character and a power.</Body>
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
          <Text style={[styles.matchText, !ready && styles.matchTextWaiting]}>{matchup}</Text>
        </Pressable>
      }
    >
      <TextButton label="Back" onPress={() => router.back()} />
      <Eyebrow>First showdown</Eyebrow>
      <Title>Who's fighting first.</Title>
      <Body>Tap two names. The first two seats start selected. Deselect someone to change the pair.</Body>
      <View style={styles.list}>
        {pendingNames.map((name) => {
          const order = selected.indexOf(name);
          const on = order >= 0;
          return (
            <Pressable
              key={name}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={on ? `${name}, fighter ${order + 1}` : name}
              onPress={() => toggle(name)}
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
