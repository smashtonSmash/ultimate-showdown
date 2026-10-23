import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, TextButton } from '@/components/Button';
import { Body, Eyebrow, ScreenFrame, Title } from '@/components/ui';
import { minimumPlayers, modeAvailable } from '@/game/engine';
import type { MatchMode, PlayStyle } from '@/game/types';
import { useGame } from '@/state/GameProvider';
import { colors, type, webPressable } from '@/theme';

const STYLES: readonly { id: PlayStyle; title: string; blurb: string }[] = [
  {
    id: 'free',
    title: 'Free play',
    blurb: 'Choose who fights every round. The next rotation starts selected.',
  },
  {
    id: 'tournament',
    title: 'Tournament bracket',
    blurb: 'Seed everyone at random. Winners advance until one champion is left.',
  },
  {
    id: 'king',
    title: 'King of the hill',
    blurb: 'The winner stays up. Each round the table picks one challenger.',
  },
];

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
  const { pendingNames, matchMode, playStyle, setMatchMode, setPlayStyle, startTable } = useGame();

  if (!pendingNames) {
    return (
      <ScreenFrame footer={<Button label="Choose players" onPress={() => router.replace('/setup')} />}>
        <Eyebrow>Match</Eyebrow>
        <Title>Seat the table first.</Title>
        <Body>The kind of fight comes after the players have names.</Body>
      </ScreenFrame>
    );
  }

  const solo = playStyle !== 'free';
  const chosen = solo || !modeAvailable(matchMode, pendingNames.length) ? '1v1' : matchMode;
  const footerLabel =
    playStyle === 'tournament' ? 'Seed the bracket' : playStyle === 'king' ? 'Choose the first fight' : 'Choose fighters';

  return (
    <ScreenFrame
      footer={
        <Button
          label={footerLabel}
          onPress={() => {
            const style = playStyle;
            const mode = style === 'free' ? chosen : '1v1';
            setPlayStyle(style);
            setMatchMode(mode);
            if (style === 'tournament') {
              startTable(pendingNames, '1v1', [], 'tournament');
              router.replace('/table');
              return;
            }
            router.push({ pathname: '/opening', params: { mode, style } });
          }}
        />
      }
    >
      <TextButton label="Back" onPress={() => router.back()} />
      <Eyebrow>Match</Eyebrow>
      <Title>What kind of fight?</Title>
      <Body>
        {`${pendingNames.length} players at the table. Pick how the night runs, then the shape of each fight.`}
      </Body>
      <View style={styles.list}>
        {STYLES.map((style) => {
          const selected = style.id === playStyle;
          return (
            <Pressable
              key={style.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${style.title}. ${style.blurb}`}
              onPress={() => setPlayStyle(style.id)}
              style={[styles.row, webPressable, selected && styles.rowOn]}
            >
              <View style={styles.copy}>
                <Text style={styles.styleTitle}>{style.title}</Text>
                <Text style={styles.blurb}>{style.blurb}</Text>
              </View>
              <View style={[styles.pill, selected && styles.pillOn]}>
                <Text style={[styles.pillText, selected && styles.pillTextOn]}>
                  {selected ? 'Picked' : 'Open'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {solo ? (
        <Body>
          {playStyle === 'tournament'
            ? 'Tournament is 1v1. Byes cover an odd table, and everyone outside the match judges.'
            : 'The King fights one challenger. Everyone else judges. The crown shows on the score strip.'}
        </Body>
      ) : (
      <>
      <Eyebrow>The fight</Eyebrow>
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
      </>
      )}
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
  styleTitle: {
    ...type.displaySoft,
    fontSize: 22,
    lineHeight: 26,
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
