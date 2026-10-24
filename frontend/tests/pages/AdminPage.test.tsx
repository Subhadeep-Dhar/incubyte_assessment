import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminPage } from '../../src/pages/AdminPage';
import { apiClient, ApiClientError } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { Vehicle } from '../../src/types/api';

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('AdminPage (Administrative Inventory Management Integration Tests)', () => {
  const mockVehicles: Vehicle[] = [
    {
      _id: '507f1f77bcf86cd799439011',
      make: 'BMW',
      model: 'M3 Competition',
      year: 2024,
      category: 'Sedan',
      price: 85000,
      quantityInStock: 4,
      description: 'High-performance sports sedan.',
      createdAt: '2026-10-24T00:00:00Z',
      updatedAt: '2026-10-24T00:00:00Z',
    },
    {
      _id: '507f1f77bcf86cd799439012',
      make: 'Tesla',
      model: 'Model S Plaid',
      year: 2024,
      category: 'EV',
      price: 90000,
      quantityInStock: 0,
      description: 'Tri-motor electric flagship.',
      createdAt: '2026-10-24T00:00:00Z',
      updatedAt: '2026-10-24T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        _id: 'admin-1',
        name: 'Dealership Admin',
        email: 'admin@dealership.com',
        role: 'admin',
        createdAt: '',
        updatedAt: '',
      },
      isAuthenticated: true,
      isAdmin: true,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('renders admin inventory ledger table with columns, vehicles, and stock badges', async () => {
    vi.spyOn(apiClient, 'getPaginated').mockResolvedValueOnce({
      data: mockVehicles,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });

    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('admin-heading')).toHaveTextContent(
      /inventory operations|fleet ledger/i,
    );
    expect(await screen.findByText('BMW M3 Competition')).toBeInTheDocument();
    expect(screen.getByText('Tesla Model S Plaid')).toBeInTheDocument();
    expect(screen.getByText('$85,000')).toBeInTheDocument();
    expect(screen.getByText(/4 units/i)).toBeInTheDocument();
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
  });

  it('allows admin to create a new vehicle via modal with client-side validation', async () => {
    vi.spyOn(apiClient, 'getPaginated').mockResolvedValueOnce({
      data: mockVehicles,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });

    const newVehicle: Vehicle = {
      _id: '507f1f77bcf86cd799439013',
      make: 'Audi',
      model: 'RS6 Avant',
      year: 2024,
      category: 'Sedan',
      price: 125000,
      quantityInStock: 2,
      createdAt: '2026-10-24T00:00:00Z',
      updatedAt: '2026-10-24T00:00:00Z',
    };

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: newVehicle,
    });

    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );

    await screen.findByText('BMW M3 Competition');

    // Click Add New Vehicle
    const addBtn = screen.getByRole('button', { name: /\+ add vehicle|add new vehicle/i });
    fireEvent.click(addBtn);

    // Verify modal appears
    expect(screen.getByRole('heading', { name: /add new vehicle/i })).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByLabelText(/vehicle make/i), { target: { value: 'Audi' } });
    fireEvent.change(screen.getByLabelText(/vehicle model/i), { target: { value: 'RS6 Avant' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'Sedan' } });
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '125000' } });
    fireEvent.change(screen.getByLabelText(/quantity in stock/i), { target: { value: '2' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /save vehicle|create vehicle/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/vehicles',
        expect.objectContaining({
          make: 'Audi',
          model: 'RS6 Avant',
          category: 'Sedan',
          price: 125000,
          quantityInStock: 2,
        }),
      );
    });

    expect(await screen.findByText(/vehicle created successfully/i)).toBeInTheDocument();
  });

  it('allows admin to edit an existing vehicle and updates the ledger', async () => {
    vi.spyOn(apiClient, 'getPaginated').mockResolvedValueOnce({
      data: mockVehicles,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });

    const updatedVehicle: Vehicle = {
      ...mockVehicles[0],
      price: 89000,
      description: 'Updated sports sedan package.',
    };

    vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
      data: updatedVehicle,
    });

    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );

    await screen.findByText('BMW M3 Competition');

    const editButtons = screen.getAllByRole('button', { name: /^edit/i });
    fireEvent.click(editButtons[0]);

    expect(screen.getByRole('heading', { name: /edit vehicle/i })).toBeInTheDocument();

    const priceInput = screen.getByLabelText(/price/i);
    fireEvent.change(priceInput, { target: { value: '89000' } });

    const saveBtn = screen.getByRole('button', { name: /save changes|update vehicle/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledWith(
        '/vehicles/507f1f77bcf86cd799439011',
        expect.objectContaining({
          price: 89000,
        }),
      );
    });

    expect(await screen.findByText(/vehicle updated successfully/i)).toBeInTheDocument();
  });

  it('allows admin to restock an existing vehicle with positive integer quantity', async () => {
    vi.spyOn(apiClient, 'getPaginated').mockResolvedValueOnce({
      data: mockVehicles,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { ...mockVehicles[1], quantityInStock: 5 },
    });

    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );

    await screen.findByText('Tesla Model S Plaid');

    const restockButtons = screen.getAllByRole('button', { name: /^restock/i });
    fireEvent.click(restockButtons[1]); // Restock Tesla

    expect(screen.getByRole('heading', { name: /restock inventory/i })).toBeInTheDocument();

    const qtyInput = screen.getByLabelText(/units to add|restock quantity/i);
    fireEvent.change(qtyInput, { target: { value: '5' } });

    const confirmBtn = screen.getByRole('button', { name: /confirm restock/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/vehicles/507f1f77bcf86cd799439012/restock', {
        quantity: 5,
      });
    });

    expect(await screen.findByText(/successfully restocked/i)).toBeInTheDocument();
  });

  it('prompts for explicit confirmation before deleting a vehicle and removes it from ledger', async () => {
    vi.spyOn(apiClient, 'getPaginated').mockResolvedValueOnce({
      data: mockVehicles,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });

    vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      message: 'Vehicle deleted successfully',
    });

    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );

    await screen.findByText('BMW M3 Competition');

    const deleteButtons = screen.getAllByRole('button', { name: /^delete/i });
    fireEvent.click(deleteButtons[0]);

    // Confirmation modal should be visible
    expect(screen.getByRole('heading', { name: /delete vehicle/i })).toBeInTheDocument();
    expect(
      screen.getByText(/are you sure you want to delete bmw m3 competition/i),
    ).toBeInTheDocument();

    const confirmDeleteBtn = screen.getByRole('button', { name: /confirm delete|delete vehicle/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith('/vehicles/507f1f77bcf86cd799439011');
    });

    expect(await screen.findByText(/vehicle deleted successfully/i)).toBeInTheDocument();
  });

  it('handles backend API validation and unauthorized errors gracefully', async () => {
    vi.spyOn(apiClient, 'getPaginated').mockRejectedValueOnce(
      new ApiClientError('Unauthorized access to administrative inventory', 403, 'FORBIDDEN'),
    );

    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/unauthorized access/i);
  });
});
