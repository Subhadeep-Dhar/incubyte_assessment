import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { ApiClientError } from '../api/client';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const validate = (): boolean => {
    const errs: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setApiError(err.message || 'Invalid email or password');
      } else {
        setApiError('A network or server error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl border border-surface-border shadow-sm">
        <div className="text-center space-y-2">
          <span className="inline-block w-3 h-3 rounded-full bg-forest-700" />
          <h2 className="text-2xl font-bold tracking-tight text-charcoal-primary">
            Sign In to Your Account
          </h2>
          <p className="text-sm text-charcoal-secondary">
            Access inventory purchasing, vehicle history, and dealership services.
          </p>
        </div>

        {apiError && (
          <Alert variant="error" title="Authentication Error">
            {apiError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            label="Email Address"
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="e.g. customer@example.com"
          />

          <Input
            label="Password"
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            placeholder="••••••••"
          />

          <Button
            type="submit"
            className="w-full mt-2"
            size="md"
            loading={isSubmitting}
          >
            Sign In
          </Button>
        </form>

        <div className="text-center text-xs text-charcoal-secondary pt-2 border-t border-surface-border">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-forest-700 hover:text-forest-800 underline underline-offset-2"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};
