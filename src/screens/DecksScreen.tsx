import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, TextButton } from '@/components/Button';
import { Body, Eyebrow, ScreenFrame, Title } from '@/components/ui';
import { DECKS, deckSummary, poolForDecks } from '@/data/decks';
import type { DeckId } from '@/game/types';
import { useGame } from '@/state/GameProvider';
import { colors, type, webPressable } from '@/theme';

const accents: Record<DeckId, string> = {
  house: colors.gold,
  fantasy: '#2F6B45',
  'sci-fi': '#1E6B73',
  horror: '#6E2E3A',
  anime: '#A33D78',
  everyday: '#B86A32',
  absurd: '#C4472E',
};

export function DecksScreen() {
  const router = useRouter();
  const { pendingNames, deckIds, toggleDeck, startTable } = useGame();
  const enabled = new Set(deckIds);
  const pool = poolForDecks(deckIds);

  if (!pendingNames) {
    return (
      <ScreenFrame footer={<Button label="Choose players" onPress={() => router.replace('/setup')} />}>
        <Eyebrow>Expansions</Eyebrow>
        <Title>Seat the table first.</Title>
        <Body>Decks are chosen after the players have names.</Body>
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame
      footer={
        <>
          <Text style={styles.summary}>
            {`${deckSummary(deckIds)}. ${pool.characters.length} characters and ${pool.attributes.length} powers in the deal.`}
          </Text>
          <Button
            label="Start the showdown"
            onPress={() => {
              startTable(pendingNames);
              router.replace('/table');
            }}
          />
        </>
      }
    >
      <TextButton label="Back" onPress={() => router.back()} />
      <Eyebrow>Expansions</Eyebrow>
      <Title>What goes in the deal?</Title>
      <Body>
        The house deck is always shuffled in. Switch on any themed decks you want mixed with it.
      </Body>
      <View style={styles.list}>
        {DECKS.map((deck) => {
          const on = enabled.has(deck.id) || !deck.optional;
          return (
            <Pressable
              key={deck.id}
              accessibilityRole={deck.optional ? 'switch' : 'text'}
              accessibilityState={{ checked: on, disabled: !deck.optional }}
              accessibilityLabel={`${deck.title}. ${deck.optional ? (on ? 'On' : 'Off') : 'Always included'}. ${deck.blurb}`}
              disabled={!deck.optional}
              onPress={() => toggleDeck(deck.id)}
              style={[
                styles.row,
                deck.optional ? webPressable : null,
                { borderLeftColor: accents[deck.id] },
                on && styles.rowOn,
              ]}
            >
              <View style={styles.copy}>
                <Text style={styles.deckTitle}>{deck.title}</Text>
                <Text style={styles.blurb}>{deck.blurb}</Text>
                <Text style={styles.count}>
                  {deck.characters.length} characters · {deck.attributes.length} powers
                </Text>
              </View>
              <View style={[styles.pill, on && styles.pillOn]}>
                <Text style={[styles.pillText, on && styles.pillTextOn]}>
                  {deck.optional ? (on ? 'On' : 'Off') : 'Included'}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderLeftWidth: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowOn: {
    backgroundColor: '#FFF9F1',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  deckTitle: {
    ...type.bodyBold,
    fontSize: 17,
  },
  blurb: {
    ...type.body,
    color: colors.inkSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  count: {
    ...type.bodyMedium,
    color: colors.inkSoft,
    fontSize: 12,
    letterSpacing: 0.3,
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
  pillText: {
    ...type.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
  },
  pillTextOn: {
    color: colors.paper,
  },
  summary: {
    ...type.body,
    color: colors.inkSoft,
    fontSize: 14,
    lineHeight: 20,
  },
});
