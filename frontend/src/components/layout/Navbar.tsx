import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CarFront, ShieldCheck, UserRound, LogOut, LogIn, ShoppingBag } from 'lucide-react';
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
          aria-label="AURELIA Home"
          className="flex items-center space-x-3 text-charcoal-primary hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 rounded-md p-1"
        >
          <span className="w-3 h-3 rounded-full bg-forest-700 inline-block shadow-xs" />
          <span className="text-lg font-bold tracking-tight text-charcoal-primary">AURELIA</span>
        </Link>

        {/* Center / Left Nav */}
        <nav aria-label="Main Navigation" className="flex items-center space-x-1 sm:space-x-3">
          <Link
            to="/"
            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive('/')
                ? 'text-forest-700 bg-forest-50'
                : 'text-charcoal-secondary hover:text-charcoal-primary hover:bg-surface-muted'
            }`}
          >
            <CarFront className="w-4 h-4 mr-1.5 shrink-0" aria-hidden="true" />
            <span>Inventory</span>
          </Link>

          {isAuthenticated && (
            <Link
              to="/purchases"
              data-testid="nav-my-purchases"
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive('/purchases')
                  ? 'text-forest-700 bg-forest-50'
                  : 'text-charcoal-secondary hover:text-charcoal-primary hover:bg-surface-muted'
              }`}
            >
              <ShoppingBag className="w-4 h-4 mr-1.5 shrink-0" aria-hidden="true" />
              <span>My Purchases</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive('/admin')
                  ? 'text-forest-700 bg-forest-50'
                  : 'text-charcoal-secondary hover:text-charcoal-primary hover:bg-surface-muted'
              }`}
            >
              <ShieldCheck className="w-4 h-4 mr-1.5 shrink-0" aria-hidden="true" />
              <span>Admin Portal</span>
            </Link>
          )}
        </nav>

        {/* Auth Actions */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              <span className="text-xs text-charcoal-secondary hidden sm:inline-flex sm:items-center">
                <UserRound
                  className="w-3.5 h-3.5 mr-1 shrink-0 text-charcoal-secondary"
                  aria-hidden="true"
                />
                <span>
                  Hello, <span className="font-semibold text-charcoal-primary">{user.name}</span>
                </span>
                {isAdmin && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-forest-100 text-forest-800 font-bold uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </span>
              <Button variant="outline" size="sm" onClick={logout} className="text-xs">
                <LogOut className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                <span>Sign Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-xs">
                  <LogIn className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                  <span>Sign In</span>
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
