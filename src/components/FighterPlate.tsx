import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Build } from '@/game/types';
import { colors, type, webPressable } from '@/theme';

export function FighterPlate({
  name,
  build,
  side,
  selected = false,
  badge,
  onPress,
}: {
  name: string;
  build: Build;
  side: 'left' | 'right';
  selected?: boolean;
  badge?: string;
  onPress?: () => void;
}) {
  const accent = side === 'left' ? colors.character : colors.edge;
  const content = (
    <>
      <View style={styles.top}>
        <Text style={styles.name}>{name}</Text>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      </View>
      <Text style={styles.character}>{build.character.title}</Text>
      <Text style={styles.with}>with</Text>
      <Text style={styles.attribute}>{build.attribute.title}</Text>
      {build.character.detail.trim() ? (
        <Text style={styles.detail}>{build.character.detail}</Text>
      ) : null}
      {build.attribute.detail.trim() ? (
        <Text style={styles.detail}>{build.attribute.detail}</Text>
      ) : null}
    </>
  );

  const plateStyle = [
    styles.plate,
    selected && styles.selected,
    { borderLeftColor: accent },
  ];

  if (!onPress) {
    return <View style={plateStyle}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${name}: ${build.character.title} with ${build.attribute.title}`}
      onPress={onPress}
      style={({ pressed }) => [plateStyle, webPressable, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  plate: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderLeftWidth: 6,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 4,
  },
  selected: {
    borderColor: colors.ink,
  },
  pressed: {
    opacity: 0.9,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  name: {
    ...type.bodyBold,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    flexShrink: 1,
  },
  badge: {
    ...type.bodyBold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  character: {
    ...type.displaySoft,
    fontSize: 24,
    lineHeight: 28,
  },
  with: {
    ...type.body,
    color: colors.inkSoft,
    fontSize: 14,
    marginTop: 2,
  },
  attribute: {
    ...type.displaySoft,
    fontSize: 22,
    lineHeight: 26,
    color: colors.edgeInk,
  },
  detail: {
    ...type.body,
    color: colors.inkSoft,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
});
