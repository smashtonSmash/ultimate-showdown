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
  const [showJudges, setShowJudges] = useState(false);

  if (!pendingNames || pendingNames.length < MIN_PLAYERS) {
    return (
      <ScreenFrame footer={<Button label="Choose players" onPress={() => router.replace('/setup')} />}>
        <Eyebrow>First showdown</Eyebrow>
        <Title>Seat the table first.</Title>
        <Body>The first fight is announced after the players have names.</Body>
      </ScreenFrame>
    );
  }

  const { fighters, judges } = openingLineup(pendingNames);
  const [left, right] = fighters;
  const matchup = `${left} vs. ${right}`;

  if (!showJudges) {
    return (
      <ScreenFrame>
        <TextButton label="Back" onPress={() => router.back()} />
        <Eyebrow>First showdown</Eyebrow>
        <Title>Who's fighting first.</Title>
        <Body>The first two seats. Tap the matchup when the table is looking.</Body>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={matchup}
          onPress={() => setShowJudges(true)}
          style={({ pressed }) => [styles.match, webPressable, pressed && styles.matchPressed]}
        >
          <Text style={styles.matchText}>{matchup}</Text>
        </Pressable>
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame
      footer={
        <Button
          label="Continue"
          onPress={() => {
            startTable(pendingNames);
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
        {judges.map((name) => (
          <View key={name} style={styles.row}>
            <Text style={styles.judge}>{name}</Text>
          </View>
        ))}
      </View>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  match: {
    minHeight: 148,
    borderRadius: 22,
    backgroundColor: colors.ink,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchPressed: {
    opacity: 0.88,
  },
  matchText: {
    ...type.display,
    color: colors.paper,
    fontSize: 34,
    lineHeight: 40,
    textAlign: 'center',
  },
  list: {
    gap: 8,
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
