import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { CatalogPage } from './pages/CatalogPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminPage } from './pages/AdminPage';
import { AdminRoute } from './components/auth/RouteGuards';

export const AppRoutes: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-base text-charcoal-primary font-sans antialiased selection:bg-forest-100 selection:text-forest-900">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/catalog" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-surface-border bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-charcoal-secondary">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-forest-700" />
            <span className="font-semibold text-charcoal-primary">AURELIA Inventory System</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="text-charcoal-muted font-mono text-[11px]">
            Engineered with strict TDD, TypeScript & Craftsmanship
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
