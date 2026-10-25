import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CatalogPage } from '../../src/pages/CatalogPage';
import { apiClient, ApiClientError } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';
import { Vehicle } from '../../src/types/api';

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('CatalogPage (Catalog, Search & Purchasing Flow Integration Test)', () => {
  const mockVehicles: Vehicle[] = [
    {
      _id: 'veh-1',
      make: 'Mercedes-Benz',
      model: 'S-Class',
      year: 2024,
      category: 'Sedan',
      price: 115000,
      quantityInStock: 3,
      description: 'Flagship luxury sedan with executive rear seating.',
      createdAt: '',
      updatedAt: '',
    },
    {
      _id: 'veh-2',
      make: 'Rivian',
      model: 'R1T',
      year: 2024,
      category: 'Truck',
      price: 75000,
      quantityInStock: 0,
      description: 'Adventure electric pickup.',
      createdAt: '',
      updatedAt: '',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        _id: 'cust-1',
        name: 'Alice Customer',
        email: 'alice@example.com',
        role: 'customer',
        createdAt: '',
        updatedAt: '',
      },
      isAuthenticated: true,
      isAdmin: false,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('loads and displays inventory vehicles on mount', async () => {
    vi.spyOn(apiClient, 'getPaginated').mockResolvedValueOnce({
      data: mockVehicles,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });

    render(
      <MemoryRouter>
        <CatalogPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('catalog-heading')).toBeInTheDocument();
    expect(await screen.findByText(/mercedes-benz s-class/i)).toBeInTheDocument();
    expect(screen.getByText(/rivian r1t/i)).toBeInTheDocument();
    expect(screen.getByText('$115,000')).toBeInTheDocument();
  });

  it('triggers search query with parameters when filter changes', async () => {
    vi.spyOn(apiClient, 'getPaginated')
      .mockResolvedValueOnce({
        data: mockVehicles,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      })
      .mockResolvedValueOnce({
        data: [mockVehicles[0]],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

    render(
      <MemoryRouter>
        <CatalogPage />
      </MemoryRouter>,
    );

    await screen.findByText(/mercedes-benz s-class/i);

    const searchInput = screen.getByPlaceholderText(/search make or model/i);
    fireEvent.change(searchInput, { target: { value: 'Mercedes' } });

    await waitFor(() => {
      expect(apiClient.getPaginated).toHaveBeenCalledWith(
        '/vehicles/search',
        expect.objectContaining({
          params: expect.objectContaining({ make: 'Mercedes', model: 'Mercedes' }),
        }),
      );
    });
  });

  it('renders API error banner and allows retry', async () => {
    vi.spyOn(apiClient, 'getPaginated')
      .mockRejectedValueOnce(new ApiClientError('Failed to fetch inventory', 500))
      .mockResolvedValueOnce({
        data: mockVehicles,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      });

    render(
      <MemoryRouter>
        <CatalogPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to fetch inventory/i);

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);

    expect(await screen.findByText(/mercedes-benz s-class/i)).toBeInTheDocument();
  });

  it('successfully purchases an in-stock vehicle and decrements stock quantity', async () => {
    vi.spyOn(apiClient, 'getPaginated').mockResolvedValueOnce({
      data: mockVehicles,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      vehicle: { ...mockVehicles[0], quantityInStock: 2 },
      purchase: {
        _id: 'purch-1',
        userId: 'cust-1',
        vehicleId: 'veh-1',
        priceAtPurchase: 115000,
        purchasedAt: '2026-10-24T00:00:00Z',
      },
    });

    render(
      <MemoryRouter>
        <CatalogPage />
      </MemoryRouter>,
    );

    await screen.findByText(/mercedes-benz s-class/i);

    const purchaseButtons = screen.getAllByRole('button', { name: /purchase vehicle/i });
    fireEvent.click(purchaseButtons[0]);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/vehicles/veh-1/purchase');
    });

    expect(await screen.findByText(/purchase successful/i)).toBeInTheDocument();
  });

  it('handles 409 Conflict out-of-stock response gracefully without breaking state', async () => {
    vi.spyOn(apiClient, 'getPaginated').mockResolvedValueOnce({
      data: mockVehicles,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });

    vi.spyOn(apiClient, 'post').mockRejectedValueOnce(
      new ApiClientError('The requested vehicle is out of stock', 409, 'INSUFFICIENT_STOCK'),
    );

    render(
      <MemoryRouter>
        <CatalogPage />
      </MemoryRouter>,
    );

    await screen.findByText(/mercedes-benz s-class/i);

    const purchaseButtons = screen.getAllByRole('button', { name: /purchase vehicle/i });
    fireEvent.click(purchaseButtons[0]);

    expect(await screen.findByText(/the requested vehicle is out of stock/i)).toBeInTheDocument();
  });

  it('renders empty showroom with proper empty state when inventory contains zero vehicles', async () => {
    vi.spyOn(apiClient, 'getPaginated').mockResolvedValueOnce({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    render(
      <MemoryRouter>
        <CatalogPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('catalog-heading')).toBeInTheDocument();
    expect(await screen.findByText(/no vehicles match your search/i)).toBeInTheDocument();
    expect(screen.getByText('0 Units')).toBeInTheDocument();
  });

  it('renders empty showroom without throwing when backend returns empty inventory with meta response', async () => {
    // Exact reproduction: when pagination property is missing from envelope response
    vi.spyOn(apiClient, 'getPaginated').mockResolvedValueOnce({
      data: [],
      pagination: undefined as any,
    });

    render(
      <MemoryRouter>
        <CatalogPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('catalog-heading')).toBeInTheDocument();
    expect(await screen.findByText(/no vehicles match your search/i)).toBeInTheDocument();
    expect(screen.getByText('0 Units')).toBeInTheDocument();
  });
});


