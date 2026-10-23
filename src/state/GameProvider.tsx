import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { createSession, reduce } from '@/game/engine';
import type { DeckId, GameAction, GameSession, MatchMode, PlayStyle } from '@/game/types';

type GameApi = {
  session: GameSession | null;
  pendingNames: string[] | null;
  deckIds: DeckId[];
  matchMode: MatchMode;
  playStyle: PlayStyle;
  setPendingNames: (names: string[]) => void;
  toggleDeck: (id: DeckId) => void;
  setMatchMode: (mode: MatchMode) => void;
  setPlayStyle: (style: PlayStyle) => void;
  startTable: (
    names: string[],
    mode: MatchMode,
    fighters: readonly string[],
    playStyle: PlayStyle,
  ) => void;
  dispatch: (action: GameAction) => void;
  reset: () => void;
};

const GameContext = createContext<GameApi | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [pendingNames, setPendingNames] = useState<string[] | null>(null);
  const [deckIds, setDeckIds] = useState<DeckId[]>(['house']);
  const [matchMode, setMatchMode] = useState<MatchMode>('1v1');
  const [playStyle, setPlayStyle] = useState<PlayStyle>('free');

  const toggleDeck = useCallback((id: DeckId) => {
    if (id === 'house') return;
    setDeckIds((current) =>
      current.includes(id) ? current.filter((deckId) => deckId !== id) : [...current, id],
    );
  }, []);

  const startTable = useCallback(
    (names: string[], mode: MatchMode, fighters: readonly string[], style: PlayStyle) => {
      setMatchMode(mode);
      setPlayStyle(style);
      setSession(createSession(names, Math.random, deckIds, { mode, fighters, playStyle: style }));
      setPendingNames(null);
    },
    [deckIds],
  );

  const dispatch = useCallback((action: GameAction) => {
    setSession((current) => (current ? reduce(current, action) : current));
  }, []);

  const reset = useCallback(() => {
    setSession(null);
    setPendingNames(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      pendingNames,
      deckIds,
      matchMode,
      playStyle,
      setPendingNames,
      toggleDeck,
      setMatchMode,
      setPlayStyle,
      startTable,
      dispatch,
      reset,
    }),
    [session, pendingNames, deckIds, matchMode, playStyle, toggleDeck, startTable, dispatch, reset],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameApi {
  const value = useContext(GameContext);
  if (!value) {
    throw new Error('useGame must be used inside GameProvider');
  }
  return value;
}
