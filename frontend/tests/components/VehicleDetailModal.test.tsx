import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { VehicleDetailModal } from '../../src/components/catalog/VehicleDetailModal';
import { Vehicle } from '../../src/types/api';

describe('VehicleDetailModal Component (Modal & Specs View Test)', () => {
  const mockVehicle: Vehicle = {
    _id: 'veh-99',
    make: 'Aston Martin',
    model: 'Vantage',
    year: 2024,
    category: 'Coupe',
    price: 190000,
    quantityInStock: 2,
    description: 'Bespoke hand-crafted British sports car with twin-turbocharged 4.0-litre V8 engine.',
    createdAt: '',
    updatedAt: '',
  };

  it('renders detailed modal specs when open', () => {
    render(
      <VehicleDetailModal
        vehicle={mockVehicle}
        isOpen={true}
        onClose={vi.fn()}
        onPurchase={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/aston martin vantage/i)).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('$190,000')).toBeInTheDocument();
    expect(
      screen.getByText(/twin-turbocharged 4\.0-litre v8/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/low stock \(2 units\)/i)).toBeInTheDocument();
  });

  it('calls onPurchase when purchase button is clicked', () => {
    const handlePurchase = vi.fn();
    render(
      <VehicleDetailModal
        vehicle={mockVehicle}
        isOpen={true}
        onClose={vi.fn()}
        onPurchase={handlePurchase}
      />,
    );

    const purchaseBtn = screen.getByRole('button', { name: /purchase vehicle/i });
    fireEvent.click(purchaseBtn);

    expect(handlePurchase).toHaveBeenCalledWith(mockVehicle);
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <VehicleDetailModal
        vehicle={mockVehicle}
        isOpen={true}
        onClose={handleClose}
        onPurchase={vi.fn()}
      />,
    );

    const closeBtn = screen.getAllByRole('button', { name: /close/i })[0];
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
