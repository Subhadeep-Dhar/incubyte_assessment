import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { VehicleGrid } from '../../src/components/catalog/VehicleGrid';
import { Vehicle } from '../../src/types/api';

describe('VehicleGrid Component (Layout & State Test)', () => {
  const mockVehicles: Vehicle[] = [
    {
      _id: 'veh-1',
      make: 'BMW',
      model: 'M4',
      year: 2024,
      category: 'Coupe',
      price: 78000,
      quantityInStock: 3,
      createdAt: '',
      updatedAt: '',
    },
    {
      _id: 'veh-2',
      make: 'Tesla',
      model: 'Model S',
      year: 2023,
      category: 'EV',
      price: 85000,
      quantityInStock: 0,
      createdAt: '',
      updatedAt: '',
    },
  ];

  it('renders skeleton cards when loading', () => {
    render(<VehicleGrid vehicles={[]} loading={true} />);

    const skeletons = screen.getAllByTestId('skeleton-loader');
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.queryByText(/bmw m4/i)).not.toBeInTheDocument();
  });

  it('renders empty state message and reset CTA when vehicles array is empty', () => {
    const handleReset = vi.fn();
    render(<VehicleGrid vehicles={[]} loading={false} onResetFilters={handleReset} />);

    expect(screen.getByText(/no vehicles match your search/i)).toBeInTheDocument();
    const resetBtn = screen.getByRole('button', { name: /reset filters/i });
    expect(resetBtn).toBeInTheDocument();

    fireEvent.click(resetBtn);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it('renders grid of vehicle cards when vehicles are provided', () => {
    render(<VehicleGrid vehicles={mockVehicles} loading={false} />);

    expect(screen.getByText(/bmw m4/i)).toBeInTheDocument();
    expect(screen.getByText(/tesla model s/i)).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
});
