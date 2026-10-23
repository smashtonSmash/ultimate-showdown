import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { GAME_NAME } from '@/brand';
import { Button } from '@/components/Button';
import { PlayingCard } from '@/components/PlayingCard';
import { Body, Eyebrow, ScreenFrame } from '@/components/ui';
import { ATTRIBUTES, CHARACTERS } from '@/data/cards';
import { useGame } from '@/state/GameProvider';
import { colors, type } from '@/theme';

const STEPS = [
  {
    number: '01',
    title: 'Deal',
    body: 'Each fighter is dealt 3 characters and 3 powers from the house deck, plus any expansions you switch on.',
  },
  {
    number: '02',
    title: 'Argue',
    body: 'Argue the matchup. That can be one on one, a three-way free-for-all, or two teams of two.',
  },
  {
    number: '03',
    title: 'Judge',
    body: 'Everyone else votes in secret. The table records the winner.',
  },
];

export function HomeScreen() {
  const router = useRouter();
  const { session } = useGame();
  const previewCharacter = CHARACTERS[0];
  const previewAttribute = ATTRIBUTES[0];

  return (
    <ScreenFrame
      footer={
        <>
          {session ? (
            <Button label="Resume the table" onPress={() => router.replace('/table')} />
          ) : null}
          <Button
            label={session ? 'Set a new table' : 'Set the table'}
            tone={session ? 'ghost' : 'primary'}
            onPress={() => router.push('/setup')}
          />
        </>
      }
    >
      <Eyebrow>Pass and play</Eyebrow>
      <Text accessibilityRole="header" style={styles.poster}>
        {GAME_NAME.split(' ').join('\n')}
      </Text>
      <Body>Build a fighter. Make the case. Let the table decide.</Body>
      <Text style={styles.note}>One phone. Pass it around the room.</Text>

      <View style={styles.steps}>
        {STEPS.map((step) => (
          <View key={step.number} style={styles.step}>
            <Text style={styles.stepNumber}>{step.number}</Text>
            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.body}</Text>
            </View>
          </View>
        ))}
      </View>

      {previewCharacter && previewAttribute ? (
        <View style={styles.deck}>
          <Text style={styles.deckLabel}>From the sample deck</Text>
          <PlayingCard card={previewCharacter} />
          <PlayingCard card={previewAttribute} />
        </View>
      ) : null}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  poster: {
    ...type.display,
    fontSize: 52,
    lineHeight: 54,
  },
  note: {
    ...type.bodyMedium,
    color: colors.inkSoft,
    fontSize: 15,
  },
  steps: {
    gap: 14,
    marginTop: 8,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNumber: {
    ...type.display,
    width: 36,
    fontSize: 16,
    lineHeight: 22,
    color: colors.gold,
  },
  stepCopy: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    ...type.bodyBold,
    fontSize: 16,
  },
  stepBody: {
    ...type.body,
    color: colors.inkSoft,
    fontSize: 15,
    lineHeight: 21,
  },
  deck: {
    gap: 10,
    marginTop: 8,
  },
  deckLabel: {
    ...type.bodyBold,
    color: colors.inkSoft,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
});
