import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { GameCard } from '@/game/types';
import { colors, type, webPressable } from '@/theme';

export function PlayingCard({
  card,
  selected = false,
  onPress,
}: {
  card: GameCard;
  selected?: boolean;
  onPress?: () => void;
}) {
  const character = card.kind === 'character';
  const kindLabel = character ? 'Character' : 'Power';
  const body = (
    <>
      <View style={styles.top}>
        <Text style={[styles.kind, { color: character ? colors.characterInk : colors.edgeInk }]}>
          {kindLabel}
        </Text>
        {selected ? <Text style={styles.picked}>Picked</Text> : null}
      </View>
      <Text style={styles.title}>{card.title}</Text>
      <Text style={styles.detail}>{card.detail}</Text>
    </>
  );

  if (!onPress) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: character ? colors.characterWash : colors.edgeWash },
        ]}
      >
        {body}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${kindLabel}: ${card.title}. ${card.detail}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        webPressable,
        { backgroundColor: character ? colors.characterWash : colors.edgeWash },
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  selected: {
    borderColor: colors.ink,
  },
  pressed: {
    opacity: 0.88,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  kind: {
    ...type.bodyBold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  picked: {
    ...type.bodyBold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  title: {
    ...type.displaySoft,
    fontSize: 24,
    lineHeight: 28,
  },
  detail: {
    ...type.body,
    color: colors.inkSoft,
    fontSize: 15,
    lineHeight: 21,
  },
});
