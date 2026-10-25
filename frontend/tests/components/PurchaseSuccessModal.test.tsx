import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PurchaseSuccessModal } from '../../src/components/common/PurchaseSuccessModal';
import { Vehicle } from '../../src/types/api';

const mockVehicle: Vehicle = {
  _id: 'veh-101',
  make: 'Porsche',
  model: '911 Carrera',
  year: 2024,
  category: 'Coupe',
  price: 114000,
  quantityInStock: 2,
  description: 'Precision sports car',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('PurchaseSuccessModal Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  const renderModal = (props: {
    isOpen: boolean;
    vehicle: Vehicle | null;
    onClose: () => void;
  }) => {
    return render(
      <BrowserRouter>
        <PurchaseSuccessModal {...props} />
      </BrowserRouter>,
    );
  };

  it('renders nothing when isOpen is false or vehicle is null', () => {
    const { container } = renderModal({
      isOpen: false,
      vehicle: mockVehicle,
      onClose: vi.fn(),
    });
    expect(container.firstChild).toBeNull();

    const { container: containerNull } = renderModal({
      isOpen: true,
      vehicle: null,
      onClose: vi.fn(),
    });
    expect(containerNull.firstChild).toBeNull();
  });

  it('renders celebratory purchase success notification with vehicle name and price when open', () => {
    renderModal({
      isOpen: true,
      vehicle: mockVehicle,
      onClose: vi.fn(),
    });

    expect(screen.getByTestId('purchase-success-modal')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /purchase confirmed/i })).toBeInTheDocument();
    expect(screen.getAllByText(/porsche 911 carrera/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/\$114,000/i)).toBeInTheDocument();
    expect(screen.getByTestId('confetti-container')).toBeInTheDocument();
  });

  it('renders accessible close button and triggers onClose when clicked', () => {
    const handleClose = vi.fn();
    renderModal({
      isOpen: true,
      vehicle: mockVehicle,
      onClose: handleClose,
    });

    const closeButton = screen.getByLabelText(/close notification/i);
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('dismisses when "Continue Browsing" button is clicked', () => {
    const handleClose = vi.fn();
    renderModal({
      isOpen: true,
      vehicle: mockVehicle,
      onClose: handleClose,
    });

    const continueButton = screen.getByRole('button', { name: /continue browsing/i });
    fireEvent.click(continueButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('provides navigation link to /purchases', () => {
    renderModal({
      isOpen: true,
      vehicle: mockVehicle,
      onClose: vi.fn(),
    });

    const purchasesLink = screen.getByRole('link', { name: /view my purchases/i });
    expect(purchasesLink).toBeInTheDocument();
    expect(purchasesLink).toHaveAttribute('href', '/purchases');
  });

  it('dismisses when Escape key is pressed', () => {
    const handleClose = vi.fn();
    renderModal({
      isOpen: true,
      vehicle: mockVehicle,
      onClose: handleClose,
    });

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after duration timeout', () => {
    const handleClose = vi.fn();
    renderModal({
      isOpen: true,
      vehicle: mockVehicle,
      onClose: handleClose,
    });

    expect(handleClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
