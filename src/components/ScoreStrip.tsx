import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Player } from '@/game/types';
import { colors, type } from '@/theme';

export function ScoreStrip({
  players,
  fighterIds,
  activeId,
}: {
  players: Player[];
  fighterIds: readonly string[];
  activeId: string | null;
}) {
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {players.map((player) => {
        const fighting = fighterIds.includes(player.id);
        const active = player.id === activeId;
        return (
          <View
            key={player.id}
            style={[styles.chip, fighting && styles.fighting, active && styles.active]}
          >
            <Text style={[styles.score, active && styles.activeText]}>{player.score}</Text>
            <Text style={[styles.name, active && styles.activeText]} numberOfLines={1}>
              {player.name}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    minWidth: 76,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  fighting: {
    borderColor: colors.gold,
    backgroundColor: colors.goldWash,
  },
  active: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  score: {
    ...type.display,
    fontSize: 20,
    lineHeight: 24,
  },
  name: {
    ...type.bodyMedium,
    fontSize: 12,
    color: colors.inkSoft,
  },
  activeText: {
    color: colors.paper,
  },
});
