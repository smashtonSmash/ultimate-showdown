import { StyleSheet, Text, View } from 'react-native';
import { Confetti } from '@/components/Confetti';
import { colors, type } from '@/theme';

export function WinnerSplash({
  kicker,
  names,
  builds,
  crowned = false,
  streak = 0,
  intense = false,
}: {
  kicker: string;
  names: string;
  builds: readonly { character: string; power: string }[];
  crowned?: boolean;
  streak?: number;
  intense?: boolean;
}) {
  const longName = names.length > 18;
  return (
    <View style={[styles.splash, intense && styles.splashChampion]}>
      <Confetti count={intense ? 52 : 30} />
      <View style={styles.copy}>
        {crowned ? <Text style={styles.crown}>♛</Text> : null}
        <Text
          accessibilityRole="header"
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          numberOfLines={1}
          style={[styles.kicker, intense && styles.kickerChampion]}
        >
          {kicker}
        </Text>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.55}
          numberOfLines={2}
          style={[styles.name, longName && styles.nameLong, intense && styles.nameChampion]}
        >
          {names}
        </Text>
        {crowned && streak > 0 ? <Text style={styles.streak}>{`${streak} in a row`}</Text> : null}
        {builds.map((build) => (
          <View key={`${build.character}-${build.power}`} style={styles.build}>
            <Text style={styles.character}>{build.character}</Text>
            <Text style={styles.power}>{build.power}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    minHeight: 520,
    borderRadius: 28,
    backgroundColor: colors.ink,
    paddingHorizontal: 18,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  splashChampion: {
    minHeight: 600,
    backgroundColor: '#140E09',
  },
  copy: {
    position: 'relative',
    zIndex: 1,
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  crown: {
    fontSize: 54,
    lineHeight: 62,
    color: colors.gold,
  },
  kicker: {
    ...type.display,
    color: colors.gold,
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -1,
    textAlign: 'center',
    width: '100%',
  },
  kickerChampion: {
    fontSize: 76,
    lineHeight: 80,
    letterSpacing: -2,
  },
  name: {
    ...type.display,
    color: colors.paper,
    fontSize: 48,
    lineHeight: 52,
    textAlign: 'center',
    width: '100%',
  },
  nameLong: {
    fontSize: 34,
    lineHeight: 38,
  },
  nameChampion: {
    fontSize: 68,
    lineHeight: 72,
  },
  streak: {
    ...type.bodyBold,
    color: colors.gold,
    fontSize: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  build: {
    marginTop: 10,
    alignItems: 'center',
    gap: 2,
  },
  character: {
    ...type.displaySoft,
    color: colors.paper,
    fontSize: 28,
    lineHeight: 32,
    textAlign: 'center',
  },
  power: {
    ...type.body,
    color: '#E7DFD0',
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
  },
});
