import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from '../../src/components/layout/Navbar';
import { useAuth } from '../../src/context/AuthContext';

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Navbar Component (Layout & Navigation Test)', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders brand identity and public catalog navigation link', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByText(/^aurelia$/i)).toBeInTheDocument();
    expect(screen.queryByText(/incubyte dealership/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /inventory/i })).toBeInTheDocument();
  });

  it('displays Sign In and Register links when unauthenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /my purchases/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/admin portal/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
  });

  it('displays user greeting and Logout button for authenticated customer without admin link', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        _id: '123',
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        role: 'customer',
        createdAt: '',
        updatedAt: '',
      },
      isAuthenticated: true,
      isAdmin: false,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByText(/sarah connor/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /my purchases/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    expect(screen.queryByText(/admin portal/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('displays Admin Portal link for authenticated administrator', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        _id: 'admin-1',
        name: 'Chief Admin',
        email: 'admin@dealership.com',
        role: 'admin',
        createdAt: '',
        updatedAt: '',
      },
      isAuthenticated: true,
      isAdmin: true,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /admin portal/i })).toBeInTheDocument();
    expect(screen.getByText(/chief admin/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });
});
