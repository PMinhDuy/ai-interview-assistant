import { apiClient } from '@/lib/axios';
import type { LoginDto, RegisterDto, AuthResponse, User } from './types';

export const loginUser = async (dto: LoginDto): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', dto);
  return data;
};

export const registerUser = async (dto: RegisterDto): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', dto);
  return data;
};

export const getMe = async (): Promise<User> => {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
};

export const logoutUser = async (): Promise<void> => {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
  if (refreshToken) {
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore network errors on logout
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};
