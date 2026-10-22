import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, type, webPressable } from '@/theme';

export function Button({
  label,
  onPress,
  disabled = false,
  tone = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'ghost';
}) {
  const ghost = tone === 'ghost';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        webPressable,
        ghost ? styles.ghost : styles.primary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.label, ghost ? styles.ghostLabel : styles.primaryLabel]}>{label}</Text>
    </Pressable>
  );
}

export function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" hitSlop={8} onPress={onPress} style={webPressable}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  primary: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.ink,
  },
  disabled: {
    opacity: 0.38,
  },
  pressed: {
    opacity: 0.82,
  },
  label: {
    ...type.bodyBold,
    fontSize: 17,
    textAlign: 'center',
  },
  primaryLabel: {
    color: colors.paper,
  },
  ghostLabel: {
    color: colors.ink,
  },
  text: {
    ...type.bodyBold,
    color: colors.inkSoft,
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
