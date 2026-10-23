import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GAME_NAME } from '@/brand';
import { GameProvider } from '@/state/GameProvider';
import { colors } from '@/theme';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.title = GAME_NAME;
    document.body.style.backgroundColor = colors.paper;
  }, []);

  if (!loaded && !error) {
    return <View style={{ flex: 1, backgroundColor: colors.paper }} />;
  }

  return (
    <GameProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.paper },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ title: GAME_NAME }} />
        <Stack.Screen name="setup" options={{ title: `Table · ${GAME_NAME}` }} />
        <Stack.Screen name="decks" options={{ title: `Decks · ${GAME_NAME}` }} />
        <Stack.Screen name="opening" options={{ title: `First fight · ${GAME_NAME}` }} />
        <Stack.Screen
          name="table"
          options={{ title: GAME_NAME, gestureEnabled: false }}
        />
      </Stack>
    </GameProvider>
  );
}
