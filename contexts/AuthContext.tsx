import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Role } from '../types';
import { authService, AuthUser } from '../services/auth';

interface AuthContextType {
  user: (AuthUser & { name?: string }) | null;
  login: (email: string, password: string, role: Role) => Promise<boolean>;
  logout: () => void;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
    campId?: string;
    familyId?: string;
  }) => Promise<(AuthUser & { name?: string }) | null>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(AuthUser & { name?: string }) | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on initial load
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const currentUser = await authService.getCurrentUserProfile();
        // Compute the name from firstName and lastName
        const userWithFullName = currentUser ? {
          ...currentUser,
          name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
        } : null;
        setUser(userWithFullName);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, role: string): Promise<boolean> => {
    try {
      const userData = await authService.login(email, password, role as any);
      if (userData) {
        // Compute the name from firstName and lastName
        const userWithFullName = {
          ...userData,
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
        };
        setUser(userWithFullName);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
    campId?: string;
    familyId?: string;
  }) => {
    try {
      const newUser = await authService.register(userData);
      if (newUser) {
        // Compute the name from firstName and lastName
        return {
          ...newUser,
          name: `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim()
        };
      }
      return null;
    } catch (error) {
      console.error('Registration error:', error);
      return null;
    }
  };

  const value = {
    user,
    login,
    logout,
    register,
    isAuthenticated,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};