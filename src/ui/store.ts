import { useEffect, useState } from 'react';
import type { DeckId, Game, MatchMode, PlayStyle } from '../engine/types';

export type Screen = 'home' | 'seats' | 'setup' | 'opening' | 'table';

export type AppState = {
  screen: Screen;
  names: string[];
  decks: DeckId[];
  style: PlayStyle;
  mode: MatchMode;
  game: Game | null;
};

const KEY = 'ultimate-showdown.table.v1';

export const initialState: AppState = {
  screen: 'home',
  names: [],
  decks: ['house'],
  style: 'free',
  mode: '1v1',
  game: null,
};

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState;
    const saved = JSON.parse(raw) as AppState;
    if (!saved || typeof saved !== 'object' || !Array.isArray(saved.names)) return initialState;
    // A saved table reopens at the table; anything else reopens at home.
    return { ...initialState, ...saved, screen: saved.game ? 'table' : 'home' };
  } catch {
    return initialState;
  }
}

/** App state that survives a refresh or a locked phone. */
export function useAppState(): [AppState, (fn: (s: AppState) => AppState) => void] {
  const [state, setState] = useState<AppState>(load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage can be full or blocked; the game still runs in memory */
    }
  }, [state]);
  return [state, setState];
}
