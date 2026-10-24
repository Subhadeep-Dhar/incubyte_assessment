import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchFilterBar, FilterState } from '../../src/components/catalog/SearchFilterBar';

describe('SearchFilterBar Component (Filter & Search Controls Test)', () => {
  const initialFilters: FilterState = {
    keyword: '',
    category: '',
    minPrice: '',
    maxPrice: '',
  };

  it('renders search input, category dropdown, price inputs, and reset button', () => {
    render(<SearchFilterBar filters={initialFilters} onFilterChange={vi.fn()} onReset={vi.fn()} />);

    expect(screen.getByPlaceholderText(/search make or model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/min price/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/max price/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('fires onFilterChange when keyword search is updated', () => {
    const handleFilterChange = vi.fn();
    render(
      <SearchFilterBar
        filters={initialFilters}
        onFilterChange={handleFilterChange}
        onReset={vi.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search make or model/i);
    fireEvent.change(searchInput, { target: { value: 'BMW' } });

    expect(handleFilterChange).toHaveBeenCalledWith(expect.objectContaining({ keyword: 'BMW' }));
  });

  it('fires onFilterChange when category is selected', () => {
    const handleFilterChange = vi.fn();
    render(
      <SearchFilterBar
        filters={initialFilters}
        onFilterChange={handleFilterChange}
        onReset={vi.fn()}
      />,
    );

    const categorySelect = screen.getByLabelText(/category/i);
    fireEvent.change(categorySelect, { target: { value: 'SUV' } });

    expect(handleFilterChange).toHaveBeenCalledWith(expect.objectContaining({ category: 'SUV' }));
  });

  it('displays validation message when min price exceeds max price', () => {
    const invalidPriceFilters: FilterState = {
      keyword: '',
      category: '',
      minPrice: '70000',
      maxPrice: '30000',
    };

    render(
      <SearchFilterBar filters={invalidPriceFilters} onFilterChange={vi.fn()} onReset={vi.fn()} />,
    );

    expect(screen.getByText(/min price cannot exceed max price/i)).toBeInTheDocument();
  });

  it('calls onReset when reset button is clicked', () => {
    const handleReset = vi.fn();
    render(
      <SearchFilterBar
        filters={{ keyword: 'Tesla', category: 'EV', minPrice: '50000', maxPrice: '100000' }}
        onFilterChange={vi.fn()}
        onReset={handleReset}
      />,
    );

    const resetBtn = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetBtn);

    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
