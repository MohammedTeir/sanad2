// utils/authUtils.ts
import { Role } from '../types';
import { sessionService } from '../services/sessionService';

export const setAuthToken = (token: string, refreshToken?: string): void => {
  sessionService.setTokens(token, refreshToken);
};

export const getAuthToken = (): string | null => {
  return sessionService.getAccessToken();
};

export const removeAuthToken = (): void => {
  sessionService.clearTokens();
};

export const isAuthenticated = (): boolean => {
  return sessionService.isSessionValid();
};

export const getCurrentUser = (): { role: Role, id?: string } | null => {
  return sessionService.getCurrentUser();
};

export const refreshToken = async (): Promise<string> => {
  return sessionService.refreshToken();
};

// Decode JWT token to extract payload
export const decodeAuthToken = (token: string): { exp?: number; iat?: number; role?: string; id?: string; email?: string } | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Export the session service for direct access if needed
export { sessionService };