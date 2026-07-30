import { create } from 'zustand';
import { authService, type User, type LoginDto, type RegisterDto } from '../services/auth.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  login: async (dto) => {
    set({ isLoading: true });
    try {
      const res = await authService.login(dto);
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', res.tokens.accessToken);
        localStorage.setItem('refreshToken', res.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(res.user));
      }
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (dto) => {
    set({ isLoading: true });
    try {
      const res = await authService.register(dto);
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', res.tokens.accessToken);
        localStorage.setItem('refreshToken', res.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(res.user));
      }
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ user: null, isAuthenticated: false, isInitialized: true });
      return;
    }

    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true, isInitialized: true });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false, isInitialized: true });
    }
  },
}));
