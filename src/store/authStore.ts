import { create } from 'zustand';

type AuthState = {
  isAuthenticated: boolean;
  loading: boolean;
  error?: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  loading: false,
  error: undefined,
  login: async (email, password) => {
    set({ loading: true, error: undefined });

    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!email || !password) {
      set({ loading: false, error: 'Email and password are required.' });
      return;
    }

    set({ isAuthenticated: true, loading: false, error: undefined });
  },
  logout: () => set({ isAuthenticated: false })
}));
