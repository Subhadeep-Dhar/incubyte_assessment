import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../src/App';
import { AuthProvider } from '../src/context/AuthContext';
import { apiClient } from '../src/api/client';

describe('App Routing & Full Journey Integration Tests (Subphase 04F)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders public catalog page by default at root /', async () => {
    vi.spyOn(apiClient, 'getPaginated').mockResolvedValueOnce({
      data: [
        {
          _id: 'veh-101',
          make: 'Aston Martin',
          model: 'DB12',
          year: 2024,
          category: 'Coupe',
          price: 245000,
          quantityInStock: 2,
          createdAt: '',
          updatedAt: '',
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.getByTestId('catalog-heading')).toBeInTheDocument();
    expect(await screen.findByText('Aston Martin DB12')).toBeInTheDocument();
  });

  it('renders AURELIA Inventory System branding in application footer', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.getByText(/aurelia inventory system/i)).toBeInTheDocument();
    expect(screen.queryByText(/incubyte dealership system/i)).not.toBeInTheDocument();
  });

  it('renders login page when navigating to /login', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('renders register page when navigating to /register', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/register']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated user attempting to access /admin to /login', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/admin']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    });
  });

  it('allows authenticated admin to view /admin fleet ledger', async () => {
    localStorage.setItem('auth_token', 'valid-admin-jwt');
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      user: {
        _id: 'admin-1',
        name: 'Super Admin',
        email: 'admin@dealership.com',
        role: 'admin',
        createdAt: '',
        updatedAt: '',
      },
    });

    vi.spyOn(apiClient, 'getPaginated').mockResolvedValueOnce({
      data: [
        {
          _id: 'veh-201',
          make: 'Ferrari',
          model: '296 GTB',
          year: 2024,
          category: 'Coupe',
          price: 320000,
          quantityInStock: 1,
          createdAt: '',
          updatedAt: '',
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/admin']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(await screen.findByTestId('admin-heading')).toBeInTheDocument();
    expect(await screen.findByText('Ferrari 296 GTB')).toBeInTheDocument();
  });
});
