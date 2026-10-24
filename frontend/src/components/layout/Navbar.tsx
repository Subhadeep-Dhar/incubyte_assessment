import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b border-surface-border bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center space-x-3 text-charcoal-primary hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 rounded-md p-1"
        >
          <span className="w-3 h-3 rounded-full bg-forest-700 inline-block shadow-xs" />
          <span className="text-lg font-bold tracking-tight text-charcoal-primary">
            Incubyte Dealership
          </span>
        </Link>

        {/* Center / Left Nav */}
        <nav aria-label="Main Navigation" className="flex items-center space-x-1 sm:space-x-3">
          <Link
            to="/"
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive('/')
                ? 'text-forest-700 bg-forest-50'
                : 'text-charcoal-secondary hover:text-charcoal-primary hover:bg-surface-muted'
            }`}
          >
            Inventory
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive('/admin')
                  ? 'text-forest-700 bg-forest-50'
                  : 'text-charcoal-secondary hover:text-charcoal-primary hover:bg-surface-muted'
              }`}
            >
              Admin Portal
            </Link>
          )}
        </nav>

        {/* Auth Actions */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              <span className="text-xs text-charcoal-secondary hidden sm:inline-block">
                Hello, <span className="font-semibold text-charcoal-primary">{user.name}</span>
                {isAdmin && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-forest-100 text-forest-800 font-bold uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-xs"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-xs">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm" className="text-xs">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
