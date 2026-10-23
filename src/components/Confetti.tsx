import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '@/theme';

const PALETTE = [colors.gold, colors.character, colors.edge, '#F6E7C8', '#8E2E1C', '#1C1612'];

export function Confetti({ count = 28 }: { count?: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        left: `${(index * 37) % 96}%` as const,
        color: PALETTE[index % PALETTE.length] ?? colors.gold,
        width: 8 + (index % 4) * 3,
        height: 12 + (index % 3) * 5,
        round: index % 3 === 0,
        spin: index % 2 === 0 ? '16deg' : '-20deg',
        drop: 680 + (index % 5) * 36,
      })),
    [count],
  );

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 2400,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View pointerEvents="none" style={styles.field}>
      {pieces.map((piece, index) => {
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-48 - (index % 6) * 18, piece.drop],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.72, 1],
          outputRange: [1, 1, 0],
        });
        return (
          <Animated.View
            key={index}
            style={[
              styles.piece,
              {
                left: piece.left,
                width: piece.width,
                height: piece.height,
                borderRadius: piece.round ? 99 : 2,
                backgroundColor: piece.color,
                opacity,
                transform: [{ translateY }, { rotate: piece.spin }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 0,
    overflow: 'hidden',
  },
  piece: {
    position: 'absolute',
    top: 0,
  },
});
