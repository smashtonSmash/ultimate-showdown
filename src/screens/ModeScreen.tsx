import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, TextButton } from '@/components/Button';
import { Body, Eyebrow, ScreenFrame, Title } from '@/components/ui';
import { minimumPlayers, modeAvailable } from '@/game/engine';
import type { MatchMode } from '@/game/types';
import { useGame } from '@/state/GameProvider';
import { colors, type, webPressable } from '@/theme';

const MODES: readonly {
  id: MatchMode;
  title: string;
  blurb: string;
}[] = [
  {
    id: '1v1',
    title: '1v1',
    blurb: 'Two fighters. Everyone else judges.',
  },
  {
    id: '1v1v1',
    title: '1v1v1',
    blurb: 'Three fighters, free-for-all. The judges pick one.',
  },
  {
    id: '2v2',
    title: '2v2',
    blurb: 'Two teams of two. Each teammate builds a fighter, and the judges pick a team.',
  },
];

export function ModeScreen() {
  const router = useRouter();
  const { pendingNames, matchMode, setMatchMode } = useGame();

  if (!pendingNames) {
    return (
      <ScreenFrame footer={<Button label="Choose players" onPress={() => router.replace('/setup')} />}>
        <Eyebrow>Match</Eyebrow>
        <Title>Seat the table first.</Title>
        <Body>The kind of fight comes after the players have names.</Body>
      </ScreenFrame>
    );
  }

  const chosen = modeAvailable(matchMode, pendingNames.length) ? matchMode : '1v1';

  return (
    <ScreenFrame
      footer={
        <Button
          label="Choose fighters"
          onPress={() => {
            setMatchMode(chosen);
            router.push({ pathname: '/opening', params: { mode: chosen } });
          }}
        />
      }
    >
      <TextButton label="Back" onPress={() => router.back()} />
      <Eyebrow>Match</Eyebrow>
      <Title>What kind of fight?</Title>
      <Body>
        {`${pendingNames.length} players at the table. A mode stays off until someone outside the fight can judge.`}
      </Body>
      <View style={styles.list}>
        {MODES.map((mode) => {
          const open = modeAvailable(mode.id, pendingNames.length);
          const selected = open && mode.id === chosen;
          return (
            <Pressable
              key={mode.id}
              accessibilityRole="button"
              accessibilityState={{ disabled: !open, selected }}
              accessibilityLabel={
                open
                  ? `${mode.title}. ${mode.blurb}`
                  : `${mode.title}. Needs ${minimumPlayers(mode.id)} players.`
              }
              disabled={!open}
              onPress={() => setMatchMode(mode.id)}
              style={[styles.row, open ? webPressable : styles.rowLocked, selected && styles.rowOn]}
            >
              <View style={styles.copy}>
                <Text style={styles.modeTitle}>{mode.title}</Text>
                <Text style={styles.blurb}>{mode.blurb}</Text>
              </View>
              <View style={[styles.pill, selected && styles.pillOn, !open && styles.pillLocked]}>
                <Text style={[styles.pillText, selected && styles.pillTextOn]}>
                  {open ? (selected ? 'Picked' : 'Open') : `Needs ${minimumPlayers(mode.id)}`}
                </Text>
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
    gap: 10,
  },
  row: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowOn: {
    backgroundColor: colors.goldWash,
    borderColor: colors.ink,
  },
  rowLocked: {
    opacity: 0.55,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  modeTitle: {
    ...type.displaySoft,
    fontSize: 28,
    lineHeight: 32,
  },
  blurb: {
    ...type.body,
    color: colors.inkSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  pill: {
    minWidth: 76,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  pillOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  pillLocked: {
    backgroundColor: colors.paperDeep,
  },
  pillText: {
    ...type.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
  },
  pillTextOn: {
    color: colors.paper,
  },
});
