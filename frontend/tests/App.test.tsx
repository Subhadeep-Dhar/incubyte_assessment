import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('App Root Component — Phase 01 Smoke Test', () => {
  it('renders the brand title and main heading correctly', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Incubyte Dealership/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /Vehicle Inventory/i }),
    ).toBeInTheDocument();
  });

  it('renders the catalog placeholder section with proper accessibility landmark', () => {
    render(<App />);

    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();

    const placeholder = screen.getByTestId('catalog-placeholder');
    expect(placeholder).toBeInTheDocument();
  });
});
