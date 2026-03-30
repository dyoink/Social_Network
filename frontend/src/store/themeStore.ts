import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored === 'dark' || stored === 'light') return stored;
    // Nếu chưa lưu, dùng preference hệ thống
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch { /* ignore */ }
  return 'light';
}

function applyTheme(theme: Theme) {
  const doc = document.documentElement;
  if (theme === 'dark') {
    doc.classList.add('dark');
  } else {
    doc.classList.remove('dark');
  }
  localStorage.setItem('theme', theme);
}

const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),

  toggleTheme: () => set((state) => {
    const next = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    return { theme: next };
  }),

  setTheme: (t) => {
    applyTheme(t);
    set({ theme: t });
  },
}));

// Áp dụng theme ngay khi module được import (đảm bảo đồng bộ với class trên <html>)
applyTheme(useThemeStore.getState().theme);

export default useThemeStore;
