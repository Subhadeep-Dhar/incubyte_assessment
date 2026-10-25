import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PurchasesPage } from '../../src/pages/PurchasesPage';
import { apiClient, ApiClientError } from '../../src/api/client';
import { Purchase } from '../../src/types/api';

const mockPurchases: Purchase[] = [
  {
    _id: 'purch-1',
    userId: 'user-1',
    vehicleId: 'veh-1',
    vehicleDetails: {
      make: 'Porsche',
      model: '911 Carrera',
      year: 2024,
      category: 'Coupe',
      description: 'Iconic sports car',
    },
    priceAtPurchase: 114000,
    quantity: 1,
    purchasedAt: '2026-10-25T14:30:00Z',
    createdAt: '2026-10-25T14:30:00Z',
    updatedAt: '2026-10-25T14:30:00Z',
  },
  {
    _id: 'purch-2',
    userId: 'user-1',
    vehicleId: 'veh-2',
    vehicleDetails: {
      make: 'BMW',
      model: 'M3 Competition',
      year: 2023,
      category: 'Sedan',
    },
    priceAtPurchase: 88000,
    quantity: 1,
    purchasedAt: '2026-10-24T10:15:00Z',
    createdAt: '2026-10-24T10:15:00Z',
    updatedAt: '2026-10-24T10:15:00Z',
  },
];

describe('PurchasesPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPurchasesPage = () => {
    return render(
      <BrowserRouter>
        <PurchasesPage />
      </BrowserRouter>,
    );
  };

  it('renders loading skeleton while fetching purchase history', () => {
    vi.spyOn(apiClient, 'getPaginated').mockReturnValue(new Promise(() => {}));

    renderPurchasesPage();

    expect(screen.getByTestId('purchases-heading')).toBeInTheDocument();
    expect(screen.getByTestId('purchases-loading-skeleton')).toBeInTheDocument();
  });

  it('renders purchase records with vehicle details, formatted prices, and dates', async () => {
    vi.spyOn(apiClient, 'getPaginated').mockResolvedValueOnce({
      data: mockPurchases,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });

    renderPurchasesPage();

    await waitFor(() => {
      expect(screen.queryByTestId('purchases-loading-skeleton')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/porsche 911 carrera/i)).toBeInTheDocument();
    expect(screen.getByText(/\$114,000/i)).toBeInTheDocument();
    expect(screen.getByText(/bmw m3 competition/i)).toBeInTheDocument();
    expect(screen.getByText(/\$88,000/i)).toBeInTheDocument();
    expect(screen.getAllByText(/1 unit/i).length).toBe(2);
    expect(screen.getAllByText(/verified ownership/i).length).toBe(2);
  });

  it('renders empty state when customer has no purchases with link to showroom', async () => {
    vi.spyOn(apiClient, 'getPaginated').mockResolvedValueOnce({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    renderPurchasesPage();

    await waitFor(() => {
      expect(screen.getByTestId('empty-purchases-state')).toBeInTheDocument();
    });

    expect(screen.getByText(/no purchase records found/i)).toBeInTheDocument();
    const showroomLink = screen.getByRole('link', { name: /browse vehicle showroom/i });
    expect(showroomLink).toBeInTheDocument();
    expect(showroomLink).toHaveAttribute('href', '/');
  });

  it('renders error alert with Retry button on API failure', async () => {
    vi.spyOn(apiClient, 'getPaginated').mockRejectedValueOnce(
      new ApiClientError('Failed to load purchase history', 500),
    );

    renderPurchasesPage();

    await waitFor(() => {
      expect(screen.getByText(/failed to load purchase history/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    // Mock successful reload
    vi.spyOn(apiClient, 'getPaginated').mockResolvedValueOnce({
      data: mockPurchases,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText(/porsche 911 carrera/i)).toBeInTheDocument();
    });
  });

  it('supports pagination controls when purchase history spans multiple pages', async () => {
    vi.spyOn(apiClient, 'getPaginated').mockResolvedValueOnce({
      data: [mockPurchases[0]],
      pagination: { page: 1, limit: 1, total: 2, totalPages: 2 },
    });

    renderPurchasesPage();

    await waitFor(() => {
      expect(screen.getByTestId('pagination-page-indicator')).toHaveTextContent(/page 1 of 2/i);
    });

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).not.toBeDisabled();

    const prevButton = screen.getByRole('button', { name: /previous/i });
    expect(prevButton).toBeDisabled();

    // Navigate to page 2
    vi.spyOn(apiClient, 'getPaginated').mockResolvedValueOnce({
      data: [mockPurchases[1]],
      pagination: { page: 2, limit: 1, total: 2, totalPages: 2 },
    });

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(apiClient.getPaginated).toHaveBeenCalledWith('/purchases', {
        params: { page: 2, limit: 10 },
      });
    });
  });
});
