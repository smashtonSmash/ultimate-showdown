import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { createSession, reduce } from '@/game/engine';
import type { DeckId, GameAction, GameSession } from '@/game/types';

type GameApi = {
  session: GameSession | null;
  pendingNames: string[] | null;
  deckIds: DeckId[];
  setPendingNames: (names: string[]) => void;
  toggleDeck: (id: DeckId) => void;
  startTable: (names: string[]) => void;
  dispatch: (action: GameAction) => void;
  reset: () => void;
};

const GameContext = createContext<GameApi | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [pendingNames, setPendingNames] = useState<string[] | null>(null);
  const [deckIds, setDeckIds] = useState<DeckId[]>(['house']);

  const toggleDeck = useCallback((id: DeckId) => {
    if (id === 'house') return;
    setDeckIds((current) =>
      current.includes(id) ? current.filter((deckId) => deckId !== id) : [...current, id],
    );
  }, []);

  const startTable = useCallback(
    (names: string[]) => {
      setSession(createSession(names, Math.random, deckIds));
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
      setPendingNames,
      toggleDeck,
      startTable,
      dispatch,
      reset,
    }),
    [session, pendingNames, deckIds, toggleDeck, startTable, dispatch, reset],
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
