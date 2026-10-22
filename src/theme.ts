import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const colors = {
  paper: '#F3EEE4',
  paperDeep: '#E7DFD0',
  ink: '#1C1612',
  inkSoft: '#5E564C',
  placeholder: '#8A7D70',
  line: '#DDD2C2',
  card: '#FFFCF8',
  character: '#C4472E',
  characterInk: '#8E2E1C',
  characterWash: '#F8E6E0',
  edge: '#1E6B73',
  edgeInk: '#145055',
  edgeWash: '#E3F2F3',
  gold: '#A56B1E',
  goldWash: '#F6E7C8',
  good: '#2C6B45',
};

function family(name: string, fallback: string): string {
  return Platform.OS === 'web' ? `${name}, ${fallback}` : name;
}

export const type = {
  display: {
    fontFamily: family('Fraunces_700Bold', 'Georgia, serif'),
    color: colors.ink,
  } satisfies TextStyle,
  displaySoft: {
    fontFamily: family('Fraunces_600SemiBold', 'Georgia, serif'),
    color: colors.ink,
  } satisfies TextStyle,
  body: {
    fontFamily: family('DMSans_400Regular', 'sans-serif'),
    color: colors.ink,
  } satisfies TextStyle,
  bodyMedium: {
    fontFamily: family('DMSans_500Medium', 'sans-serif'),
    color: colors.ink,
  } satisfies TextStyle,
  bodyBold: {
    fontFamily: family('DMSans_700Bold', 'sans-serif'),
    color: colors.ink,
  } satisfies TextStyle,
};

export const webPressable = Platform.select<ViewStyle>({
  web: { cursor: 'pointer' },
  default: {},
});
