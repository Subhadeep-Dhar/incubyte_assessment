import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types/api';
import { apiClient, setAuthToken } from '../api/client';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface AuthResponse {
  token: string;
  user: User;
}

const TOKEN_STORAGE_KEY = 'auth_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    async function initSession() {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken) {
        setLoading(false);
        return;
      }

      setAuthToken(storedToken);
      try {
        const meResponse = await apiClient.get<{ user?: User } | User>('/auth/me');
        const currentUser = (meResponse as { user?: User })?.user || (meResponse as User);
        setUser(currentUser);
      } catch {
        // Stored token is invalid or expired
        logout();
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, [logout]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    setAuthToken(response.token);
    setUser(response.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<void> => {
      const response = await apiClient.post<AuthResponse>('/auth/register', {
        name,
        email,
        password,
      });
      localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      setAuthToken(response.token);
      setUser(response.user);
    },
    [],
  );

  const value: AuthContextType = {
    user,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
