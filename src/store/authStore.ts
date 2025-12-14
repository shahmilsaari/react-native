import { create } from 'zustand';

export type AuthUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type AuthState = {
  isAuthenticated: boolean;
  error?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUser;
  setAuthenticated: (value: boolean) => void;
  setError: (value?: string) => void;
  setSession: (session: AuthSession) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  error: undefined,
  accessToken: undefined,
  refreshToken: undefined,
  user: undefined,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setError: (value) => set({ error: value }),
  setSession: (session) =>
    set({
      isAuthenticated: true,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
      error: undefined
    }),
  logout: () =>
    set({
      isAuthenticated: false,
      error: undefined,
      accessToken: undefined,
      refreshToken: undefined,
      user: undefined
    })
}));
