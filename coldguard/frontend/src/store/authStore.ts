import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  theme: 'light' | 'dark';
  isMuted: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  toggleTheme: () => void;
  toggleMute: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const savedToken = localStorage.getItem('coldguard_token');
  const savedUser = localStorage.getItem('coldguard_user');
  const savedTheme = (localStorage.getItem('coldguard_theme') as 'light' | 'dark') || 'light';
  const savedMute = localStorage.getItem('coldguard_muted') === 'true';

  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken,
    theme: savedTheme,
    isMuted: savedMute,
    setAuth: (user, token) => {
      localStorage.setItem('coldguard_token', token);
      localStorage.setItem('coldguard_user', JSON.stringify(user));
      set({ user, token });
    },
    logout: () => {
      localStorage.removeItem('coldguard_token');
      localStorage.removeItem('coldguard_user');
      set({ user: null, token: null });
    },
    toggleTheme: () => {
      const next = get().theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('coldguard_theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      set({ theme: next });
    },
    toggleMute: () => {
      const next = !get().isMuted;
      localStorage.setItem('coldguard_muted', String(next));
      set({ isMuted: next });
    },
  };
});

