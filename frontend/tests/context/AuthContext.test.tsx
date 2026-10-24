import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';
import { apiClient, setAuthToken } from '../../src/api/client';

describe('AuthContext (Unit & State Test)', () => {
  beforeEach(() => {
    localStorage.clear();
    setAuthToken(null);
    vi.restoreAllMocks();
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('initializes with unauthenticated state when no token is in storage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('restores authenticated user session on mount if valid token is in storage', async () => {
    localStorage.setItem('auth_token', 'saved-valid-jwt');
    const mockUser = {
      _id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'customer' as const,
      createdAt: '2026-10-24T00:00:00Z',
      updatedAt: '2026-10-24T00:00:00Z',
    };

    vi.spyOn(apiClient, 'get').mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(result.current.user?.name).toBe('John Doe');
    expect(result.current.isAdmin).toBe(false);
    expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
  });

  it('logs in successfully and persists token', async () => {
    const mockAuthResponse = {
      token: 'jwt-customer-token',
      user: {
        _id: 'user-123',
        name: 'Alice Customer',
        email: 'alice@example.com',
        role: 'customer' as const,
        createdAt: '2026-10-24T00:00:00Z',
        updatedAt: '2026-10-24T00:00:00Z',
      },
    };

    vi.spyOn(apiClient, 'post').mockResolvedValue(mockAuthResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('alice@example.com', 'Password123');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('alice@example.com');
    expect(result.current.isAdmin).toBe(false);
    expect(localStorage.getItem('auth_token')).toBe('jwt-customer-token');
  });

  it('recognizes administrator role and sets isAdmin to true', async () => {
    const mockAdminResponse = {
      token: 'jwt-admin-token',
      user: {
        _id: 'admin-123',
        name: 'System Admin',
        email: 'admin@dealership.com',
        role: 'admin' as const,
        createdAt: '2026-10-24T00:00:00Z',
        updatedAt: '2026-10-24T00:00:00Z',
      },
    };

    vi.spyOn(apiClient, 'post').mockResolvedValue(mockAdminResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('admin@dealership.com', 'AdminPass123');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(true);
  });

  it('clears state and token on logout', async () => {
    localStorage.setItem('auth_token', 'jwt-token-to-clear');

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});
