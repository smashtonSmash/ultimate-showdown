import { StyleSheet, Text, View } from 'react-native';
import { stageName } from '@/game/engine';
import type { BracketMatch, GameSession } from '@/game/types';
import { colors, type } from '@/theme';

export function BracketBoard({ session }: { session: GameSession }) {
  const bracket = session.bracket;
  if (!bracket) return null;
  const rounds = [...new Set(bracket.matches.map((match) => match.round))].sort((a, b) => a - b);
  return (
    <View style={styles.board}>
      {rounds.map((round) => (
        <View key={round} style={styles.round}>
          <Text style={styles.stage}>{stageName(round, rounds.length)}</Text>
          {bracket.matches
            .filter((match) => match.round === round)
            .map((match) => (
              <MatchRow
                key={match.id}
                session={session}
                match={match}
                current={match.id === bracket.currentMatchId && session.phase.type !== 'champion'}
              />
            ))}
        </View>
      ))}
    </View>
  );
}

function MatchRow({
  session,
  match,
  current,
}: {
  session: GameSession;
  match: BracketMatch;
  current: boolean;
}) {
  return (
    <View style={[styles.match, current && styles.current, match.winnerId && styles.done]}>
      {match.playerIds.map((id, index) => {
        const winner = id !== null && id === match.winnerId;
        return (
          <Text key={`${match.id}-${index}`} style={[styles.name, winner && styles.winner]}>
            {slotName(session, id, match.bye)}
          </Text>
        );
      })}
    </View>
  );
}

function slotName(session: GameSession, id: string | null, bye: boolean): string {
  if (!id) return bye ? 'Bye' : 'Waiting';
  return session.players.find((player) => player.id === id)?.name ?? 'Waiting';
}

const styles = StyleSheet.create({
  board: {
    gap: 16,
  },
  round: {
    gap: 8,
  },
  stage: {
    ...type.bodyBold,
    color: colors.gold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  match: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2,
  },
  current: {
    borderColor: colors.gold,
    backgroundColor: colors.goldWash,
  },
  done: {
    borderColor: colors.ink,
  },
  name: {
    ...type.bodyMedium,
    fontSize: 16,
  },
  winner: {
    ...type.bodyBold,
    color: colors.gold,
  },
});
