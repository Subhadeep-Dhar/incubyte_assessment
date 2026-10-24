import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { VehicleCard } from '../../src/components/catalog/VehicleCard';
import { Vehicle } from '../../src/types/api';

describe('VehicleCard Component (Unit & Presentation Test)', () => {
  const mockVehicle: Vehicle = {
    _id: 'veh-1',
    make: 'Porsche',
    model: 'Taycan',
    year: 2024,
    category: 'EV',
    price: 90000,
    quantityInStock: 4,
    description: 'All-electric luxury sports saloon with dual permanent-magnet synchronous motors.',
    createdAt: '2026-10-24T00:00:00Z',
    updatedAt: '2026-10-24T00:00:00Z',
  };

  it('renders make, model, year, category, and formatted price', () => {
    render(<VehicleCard vehicle={mockVehicle} onPurchase={vi.fn()} />);

    expect(screen.getByText(/porsche taycan/i)).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getAllByText('EV').length).toBeGreaterThan(0);
    expect(screen.getByText('$90,000')).toBeInTheDocument();
  });

  it('renders in-stock badge when stock is 3 or more', () => {
    render(<VehicleCard vehicle={mockVehicle} onPurchase={vi.fn()} />);

    expect(screen.getByText(/in stock \(4 units\)/i)).toBeInTheDocument();
  });

  it('renders low-stock badge when stock is 1 or 2 units', () => {
    const lowStockVehicle = { ...mockVehicle, quantityInStock: 2 };
    render(<VehicleCard vehicle={lowStockVehicle} onPurchase={vi.fn()} />);

    expect(screen.getByText(/low stock \(2 units\)/i)).toBeInTheDocument();
  });

  it('renders out-of-stock badge and disables purchase button when stock is 0', () => {
    const outOfStockVehicle = { ...mockVehicle, quantityInStock: 0 };
    const handlePurchase = vi.fn();

    render(<VehicleCard vehicle={outOfStockVehicle} onPurchase={handlePurchase} />);

    expect(screen.getAllByText(/out of stock/i).length).toBe(2);
    const purchaseBtn = screen.getByRole('button', { name: /out of stock/i });
    expect(purchaseBtn).toBeDisabled();

    fireEvent.click(purchaseBtn);
    expect(handlePurchase).not.toHaveBeenCalled();
  });

  it('fires onPurchase callback when purchase button is clicked on in-stock vehicle', () => {
    const handlePurchase = vi.fn();
    render(<VehicleCard vehicle={mockVehicle} onPurchase={handlePurchase} />);

    const purchaseBtn = screen.getByRole('button', { name: /purchase/i });
    expect(purchaseBtn).not.toBeDisabled();

    fireEvent.click(purchaseBtn);
    expect(handlePurchase).toHaveBeenCalledWith(mockVehicle);
  });
});
