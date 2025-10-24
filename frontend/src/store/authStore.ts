import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: string | null;
  sessionId: string | null;
  login: (username: string, token: string) => void;
  logout: () => void;
  getUniqueUserId: () => string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      sessionId: null,
      login: (username: string, token: string) => {
        // Only generate new session ID if we don't have one
        const currentState = get();
        const sessionId = currentState.sessionId || `${username}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set({
          isAuthenticated: true,
          token,
          user: username,
          sessionId,
        });
      },
      logout: () => {
        set({
          isAuthenticated: false,
          token: null,
          user: null,
          sessionId: null,
        });
      },
      getUniqueUserId: () => {
        const state = get();
        return state.sessionId || `${state.user}_${Date.now()}`;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
