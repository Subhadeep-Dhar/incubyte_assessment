import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from '../../../src/pages/LoginPage';
import { RegisterPage } from '../../../src/pages/RegisterPage';
import { ProtectedRoute, AdminRoute } from '../../../src/components/auth/RouteGuards';
import { useAuth } from '../../../src/context/AuthContext';
import { ApiClientError } from '../../../src/api/client';

// Mock useAuth for fine-grained page tests
vi.mock('../../../src/context/AuthContext', async () => {
  const actual = await vi.importActual('../../../src/context/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

describe('Authentication Pages & Route Guards (Component & Flow Tests)', () => {
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LoginPage Component', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        loading: false,
        login: mockLogin,
        register: mockRegister,
        logout: mockLogout,
      });
    });

    it('renders login form inputs and submit button', () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('validates required fields before submitting', async () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      expect(mockLogin).not.toHaveBeenCalled();
      expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    });

    it('submits credentials and calls login when valid', async () => {
      mockLogin.mockResolvedValueOnce(undefined);

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'alice@dealership.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'Password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('alice@dealership.com', 'Password123');
      });
    });

    it('displays error alert when login fails with invalid credentials', async () => {
      mockLogin.mockRejectedValueOnce(
        new ApiClientError('Invalid email or password', 401, 'INVALID_CREDENTIALS'),
      );

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'alice@dealership.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'WrongPassword' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/invalid email or password/i);
    });
  });

  describe('RegisterPage Component', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        loading: false,
        login: mockLogin,
        register: mockRegister,
        logout: mockLogout,
      });
    });

    it('renders registration fields including name, email, and password', () => {
      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>,
      );

      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('renders AURELIA product branding and eliminates Incubyte references', () => {
      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>,
      );

      expect(screen.getByText(/join aurelia/i)).toBeInTheDocument();
      expect(screen.queryByText(/incubyte/i)).not.toBeInTheDocument();
    });

    it('validates password complexity (min 8 chars, 1 uppercase, 1 lowercase, 1 number)', async () => {
      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Bob Smith' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'bob@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'weakpass' },
      });
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      expect(mockRegister).not.toHaveBeenCalled();
      expect(
        await screen.findByText(
          /at least one uppercase letter, one lowercase letter, and one number/i,
        ),
      ).toBeInTheDocument();
    });

    it('submits valid registration and calls register', async () => {
      mockRegister.mockResolvedValueOnce(undefined);

      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Bob Smith' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'bob@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'SecurePass123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('Bob Smith', 'bob@example.com', 'SecurePass123');
      });
    });

    it('displays error alert when registration fails due to duplicate email (409 Conflict)', async () => {
      mockRegister.mockRejectedValueOnce(
        new ApiClientError('An account with this email already exists', 409, 'DUPLICATE_EMAIL'),
      );

      render(
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>,
      );

      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'Bob Smith' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'existing@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'SecurePass123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/an account with this email already exists/i);
    });
  });

  describe('Route Guards', () => {
    it('redirects unauthenticated user to /login from ProtectedRoute', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        loading: false,
        login: mockLogin,
        register: mockRegister,
        logout: mockLogout,
      });

      render(
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route path="/login" element={<div>Login Screen Destination</div>} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <div>Secret Profile Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.queryByText(/secret profile content/i)).not.toBeInTheDocument();
      expect(screen.getByText(/login screen destination/i)).toBeInTheDocument();
    });

    it('renders protected content when user is authenticated', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          _id: '1',
          name: 'Alice',
          email: 'alice@test.com',
          role: 'customer',
          createdAt: '',
          updatedAt: '',
        },
        isAuthenticated: true,
        isAdmin: false,
        loading: false,
        login: mockLogin,
        register: mockRegister,
        logout: mockLogout,
      });

      render(
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <div>Secret Profile Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText(/secret profile content/i)).toBeInTheDocument();
    });

    it('redirects non-admin customer to / from AdminRoute', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          _id: '1',
          name: 'Customer Bob',
          email: 'bob@test.com',
          role: 'customer',
          createdAt: '',
          updatedAt: '',
        },
        isAuthenticated: true,
        isAdmin: false,
        loading: false,
        login: mockLogin,
        register: mockRegister,
        logout: mockLogout,
      });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/" element={<div>Home Catalog Destination</div>} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <div>Admin Management Ledger</div>
                </AdminRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.queryByText(/admin management ledger/i)).not.toBeInTheDocument();
      expect(screen.getByText(/home catalog destination/i)).toBeInTheDocument();
    });

    it('renders admin content when user has admin role', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          _id: 'admin-1',
          name: 'Super Admin',
          email: 'admin@dealership.com',
          role: 'admin',
          createdAt: '',
          updatedAt: '',
        },
        isAuthenticated: true,
        isAdmin: true,
        loading: false,
        login: mockLogin,
        register: mockRegister,
        logout: mockLogout,
      });

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <div>Admin Management Ledger</div>
                </AdminRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText(/admin management ledger/i)).toBeInTheDocument();
    });
  });
});
