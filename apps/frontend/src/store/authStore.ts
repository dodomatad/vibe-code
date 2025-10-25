import { create } from 'zustand';
import { User } from '@quizflow/shared';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; role?: string }) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      const { user, token } = response.data.data;

      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Login failed');
    }
  },

  register: async (data) => {
    try {
      const response = await authApi.register(data);
      const { user, token } = response.data.data;

      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true });
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Registration failed');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const response = await authApi.me();
      set({
        user: response.data.data,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
