import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { Alert } from '../../src/components/ui/Alert';
import { Input } from '../../src/components/ui/Input';

describe('Shared UI Primitives (Component Tests)', () => {
  describe('Button Component', () => {
    it('renders with children and handles click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Purchase Vehicle</Button>);

      const btn = screen.getByRole('button', { name: /purchase vehicle/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders disabled state and prevents click handler execution', () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Out of Stock
        </Button>,
      );

      const btn = screen.getByRole('button', { name: /out of stock/i });
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders loading state with spinner and disables button', () => {
      const handleClick = vi.fn();
      render(
        <Button loading onClick={handleClick}>
          Purchasing...
        </Button>,
      );

      const btn = screen.getByRole('button', { name: /purchasing/i });
      expect(btn).toBeDisabled();
      expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Badge Component', () => {
    it('renders in-stock badge with correct styling and text', () => {
      render(<Badge variant="in-stock">In Stock (5 units)</Badge>);
      const badge = screen.getByText(/in stock \(5 units\)/i);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-emerald-50');
    });

    it('renders low-stock badge with amber alert styling', () => {
      render(<Badge variant="low-stock">Low Stock (2 units)</Badge>);
      const badge = screen.getByText(/low stock/i);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-amber-50');
    });

    it('renders out-of-stock badge with rose alert styling', () => {
      render(<Badge variant="out-of-stock">Out of Stock</Badge>);
      const badge = screen.getByText(/out of stock/i);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-rose-50');
    });
  });

  describe('Alert Component', () => {
    it('renders error alert with role="alert" and descriptive text', () => {
      render(
        <Alert variant="error" title="Purchase Failed">
          Insufficient stock available.
        </Alert>,
      );
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText(/purchase failed/i)).toBeInTheDocument();
      expect(screen.getByText(/insufficient stock available/i)).toBeInTheDocument();
    });

    it('renders success alert with positive feedback style', () => {
      render(
        <Alert variant="success" title="Purchase Complete">
          Order #123 confirmed.
        </Alert>,
      );
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText(/order #123 confirmed/i)).toBeInTheDocument();
    });
  });

  describe('Input Component', () => {
    it('renders label and input with matching htmlFor/id', () => {
      render(<Input label="Vehicle Make" id="make-input" placeholder="e.g. BMW" />);
      expect(screen.getByLabelText(/vehicle make/i)).toBeInTheDocument();
      const input = screen.getByPlaceholderText(/e\.g\. bmw/i);
      expect(input).toHaveAttribute('id', 'make-input');
    });

    it('displays validation error message with aria-invalid="true"', () => {
      render(<Input label="Price" id="price-input" error="Price must be a positive number" />);
      const input = screen.getByLabelText(/price/i);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText(/price must be a positive number/i)).toBeInTheDocument();
    });
  });
});
