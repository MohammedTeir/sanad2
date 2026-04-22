// services/sessionService.ts

import { Role } from '../types';
import { makeAuthenticatedRequest } from '../utils/apiUtils';

export interface AuthTokenPayload {
  userId: string;
  role: Role;
  exp: number; // expiration time
  iat: number; // issued at time
  campId?: string; // camp ID for camp managers
  camp_id?: string; // alternative camp ID format
  refreshToken?: string; // refresh token (if provided by backend)
}

class SessionService {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_INFO_KEY = 'user_info';
  private refreshPromise: Promise<string> | null = null;

  /**
   * Set authentication tokens
   */
  setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem(SessionService.TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(SessionService.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(SessionService.TOKEN_KEY);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(SessionService.REFRESH_TOKEN_KEY);
  }

  /**
   * Remove all stored tokens
   */
  clearTokens(): void {
    localStorage.removeItem(SessionService.TOKEN_KEY);
    localStorage.removeItem(SessionService.REFRESH_TOKEN_KEY);
    localStorage.removeItem(SessionService.USER_INFO_KEY);
  }

  /**
   * Decode JWT token without validation
   */
  decodeToken(token: string): AuthTokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        // If it's not a real JWT format, try parsing as JSON (for backward compatibility)
        try {
          const parsedPayload = JSON.parse(token);
          return parsedPayload as AuthTokenPayload;
        } catch {
          return null;
        }
      }

      // Parse the payload part of the JWT
      const payload = parts[1];
      // Add padding if needed
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);

      let decodedPayload;
      try {
        decodedPayload = atob(paddedPayload);
      } catch {
        // If base64 decoding fails, return null
        return null;
      }

      try {
        const parsedPayload = JSON.parse(decodedPayload);
        return parsedPayload as AuthTokenPayload;
      } catch {
        // If JSON parsing fails, return null
        return null;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if the access token is expired
   */
  isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || this.getAccessToken();
    if (!tokenToCheck) {
      return true;
    }

    const decoded = this.decodeToken(tokenToCheck);
    if (!decoded) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp <= currentTime;
  }

  /**
   * Check if the session is valid (access token is not expired)
   */
  isSessionValid(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshToken(): Promise<string> {
    // If there's already a refresh promise in flight, return it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Create a new refresh promise to prevent multiple simultaneous refresh attempts
    this.refreshPromise = this.performTokenRefresh(refreshToken)
      .then(newAccessToken => {
        // Update the stored access token
        this.setTokens(newAccessToken);
        // Clear the refresh promise
        this.refreshPromise = null;
        return newAccessToken;
      })
      .catch(error => {
        // Clear the refresh promise on error
        this.refreshPromise = null;
        throw error;
      });

    return this.refreshPromise;
  }

  /**
   * Perform the actual token refresh request
   */
  private async performTokenRefresh(refreshToken: string): Promise<string> {
    try {
      // In a real implementation, this would be a call to your backend API
      // Example:
      /*
      const response = await fetch(`${process.env.BACKEND_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      return data.accessToken;
      */

      // For now, we'll simulate a refresh by creating a new token with extended expiration
      // This is just for demonstration purposes
      const currentToken = this.getAccessToken();
      if (!currentToken) {
        throw new Error('No current token to refresh');
      }

      const decoded = this.decodeToken(currentToken);
      if (!decoded) {
        throw new Error('Cannot decode current token');
      }

      // Create a new token with extended expiration (1 hour from now)
      const newExpiration = Math.floor(Date.now() / 1000) + 3600; // 1 hour
      
      // In a real implementation, you would call your backend to get a new token
      // For now, we'll just return the same token (simulating refresh failure)
      // This would need to be replaced with actual backend call
      throw new Error('Token refresh endpoint not implemented in mock backend');
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Clear tokens if refresh fails
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Get current user info
   */
  getCurrentUser(): { role: Role; id?: string; campId?: string; familyId?: string } | null {
    try {
      const token = this.getAccessToken();
      if (!token) {
        return null;
      }

      const decoded = this.decodeToken(token);
      if (!decoded) {
        return null;
      }

      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp <= currentTime) {
        this.clearTokens();
        return null;
      }

      // Validate that the role is one of the expected Role enum values
      const validRoles = Object.values(Role);
      if (!validRoles.includes(decoded.role)) {
        console.warn('Invalid role found in token, clearing tokens');
        this.clearTokens();
        return null;
      }

      const userInfo = {
        role: decoded.role,
        id: decoded.userId,
        campId: decoded.campId || decoded.camp_id,
        familyId: decoded.familyId || decoded.family_id
      };
      
      console.log('[sessionService] Current user:', userInfo);
      return userInfo;
    } catch (error) {
      console.error('Error getting current user:', error);
      // If there's an error, clear the problematic token
      this.clearTokens();
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.isSessionValid();
  }
}

// Create a singleton instance
export const sessionService = new SessionService();