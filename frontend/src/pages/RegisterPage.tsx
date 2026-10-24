import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { ApiClientError } from '../api/client';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const errs: { name?: string; email?: string; password?: string } = {};

    if (!name.trim()) {
      errs.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      errs.name = 'Full name must be at least 2 characters';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      errs.password =
        'Password must contain at least one uppercase letter, one lowercase letter, and one number';
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
      await register(name.trim(), email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setApiError(err.message || 'Registration failed');
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
            Create Account
          </h2>
          <p className="text-sm text-charcoal-secondary">
            Join Incubyte Dealership to reserve and purchase verified luxury vehicles.
          </p>
        </div>

        {apiError && (
          <Alert variant="error" title="Registration Error">
            {apiError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            label="Full Name"
            id="register-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={e => setName(e.target.value)}
            error={errors.name}
            placeholder="e.g. Eleanor Vance"
          />

          <Input
            label="Email Address"
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            error={errors.email}
            placeholder="e.g. eleanor@example.com"
          />

          <Input
            label="Password"
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            error={errors.password}
            helperText="Minimum 8 characters with at least one uppercase, lowercase, and number"
            placeholder="••••••••"
          />

          <Button type="submit" className="w-full mt-2" size="md" loading={isSubmitting}>
            Create Account
          </Button>
        </form>

        <div className="text-center text-xs text-charcoal-secondary pt-2 border-t border-surface-border">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-forest-700 hover:text-forest-800 underline underline-offset-2"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
