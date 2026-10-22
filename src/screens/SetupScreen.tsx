import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, TextButton } from '@/components/Button';
import { Body, Eyebrow, ScreenFrame, Title } from '@/components/ui';
import { MAX_NAME_LENGTH, MAX_PLAYERS, MIN_PLAYERS, validateNames } from '@/game/engine';
import { useGame } from '@/state/GameProvider';
import { colors, type } from '@/theme';

const SAMPLE_TABLE = ['Alex', 'Jordan', 'Sam', 'Riley'];

export function SetupScreen() {
  const router = useRouter();
  const { pendingNames, setPendingNames } = useGame();
  const [players, setPlayers] = useState<string[]>(pendingNames ?? []);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  function addName(raw: string): string[] | null {
    const name = raw.trim();
    if (!name) return players;
    if (name.length > MAX_NAME_LENGTH) {
      setError(`Keep each name to ${MAX_NAME_LENGTH} characters.`);
      return null;
    }
    if (players.some((player) => player.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setError('Two players cannot share a name.');
      return null;
    }
    if (players.length >= MAX_PLAYERS) {
      setError(`Keep the table to ${MAX_PLAYERS} players.`);
      return null;
    }
    const next = [...players, name];
    setPlayers(next);
    setDraft('');
    setError(null);
    return next;
  }

  function start() {
    const pending = draft.trim();
    const next = pending ? addName(pending) : players;
    if (!next) return;
    const problem = validateNames(next);
    if (problem) {
      setError(problem);
      return;
    }
    setPendingNames(next);
    router.push('/decks');
  }

  const remaining = Math.max(0, MIN_PLAYERS - players.length);
  const helper =
    remaining > 0
      ? `Add ${remaining} more ${remaining === 1 ? 'player' : 'players'}.`
      : `First showdown: ${players[0]} vs ${players[1]}. Next, choose any expansions.`;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenFrame
        footer={
          <>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="Choose decks" onPress={start} disabled={players.length < MIN_PLAYERS && draft.trim().length === 0} />
          </>
        }
      >
        <TextButton label="Back" onPress={() => router.back()} />
        <Eyebrow>The table</Eyebrow>
        <Title>Who is sitting down?</Title>
        <Body>Add at least three people. Two fight each showdown. Everyone else judges.</Body>

        <View style={styles.entry}>
          <TextInput
            value={draft}
            onChangeText={(value) => {
              setDraft(value);
              setError(null);
            }}
            onSubmitEditing={() => addName(draft)}
            placeholder="Player name"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={MAX_NAME_LENGTH + 8}
            returnKeyType="done"
            style={styles.input}
            accessibilityLabel="Player name"
          />
          <Button label="Add" onPress={() => addName(draft)} disabled={draft.trim().length === 0} />
        </View>

        {players.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>The chairs are empty.</Text>
            <Text style={styles.emptyBody}>
              A showdown needs two fighters and at least one judge.
            </Text>
            <Button
              label="Seat a sample table"
              tone="ghost"
              onPress={() => {
                setPlayers(SAMPLE_TABLE);
                setDraft('');
                setError(null);
              }}
            />
          </View>
        ) : (
          <View style={styles.list}>
            {players.map((name, index) => (
              <View key={name} style={styles.row}>
                <Text style={styles.seat}>{index + 1}</Text>
                <Text style={styles.player}>{name}</Text>
                <TextButton
                  label="Remove"
                  onPress={() => {
                    setPlayers(players.filter((player) => player !== name));
                    setError(null);
                  }}
                />
              </View>
            ))}
          </View>
        )}

        <Text style={styles.helper}>{helper}</Text>
      </ScreenFrame>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  entry: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  input: {
    ...type.body,
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  empty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.line,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    backgroundColor: colors.card,
  },
  emptyTitle: {
    ...type.displaySoft,
    fontSize: 22,
    lineHeight: 26,
  },
  emptyBody: {
    ...type.body,
    color: colors.inkSoft,
    fontSize: 15,
    lineHeight: 21,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  seat: {
    ...type.display,
    width: 24,
    fontSize: 16,
    color: colors.gold,
  },
  player: {
    ...type.bodyMedium,
    flex: 1,
    fontSize: 16,
  },
  helper: {
    ...type.body,
    color: colors.inkSoft,
    fontSize: 15,
    lineHeight: 21,
  },
  error: {
    ...type.bodyMedium,
    color: colors.characterInk,
    fontSize: 14,
    lineHeight: 20,
  },
});
