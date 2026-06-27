import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { dark, light, type Theme, type ThemeMode } from '../theme/tokens';

const STORAGE_KEY = 'folio_theme_mode';

interface ThemeState {
  mode: ThemeMode;
  colors: Theme;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  loadSavedMode: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',
  colors: dark,

  toggleMode: () => {
    const next = get().mode === 'dark' ? 'light' : 'dark';
    SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {});
    set({ mode: next, colors: next === 'dark' ? dark : light });
  },

  setMode: (mode) => {
    SecureStore.setItemAsync(STORAGE_KEY, mode).catch(() => {});
    set({ mode, colors: mode === 'dark' ? dark : light });
  },

  loadSavedMode: async () => {
    try {
      const saved = await SecureStore.getItemAsync(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        set({ mode: saved, colors: saved === 'dark' ? dark : light });
      }
    } catch {
      // keep default
    }
  },
}));
