import React from 'react';
import { VEHICLE_CATEGORIES } from '../../types/api';
import { Button } from '../ui/Button';

export interface FilterState {
  keyword: string;
  category: string;
  minPrice: string;
  maxPrice: string;
}

export interface SearchFilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const isPriceRangeInvalid =
    Boolean(filters.minPrice && filters.maxPrice) &&
    Number(filters.minPrice) > Number(filters.maxPrice);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, keyword: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, category: e.target.value });
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, minPrice: e.target.value });
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, maxPrice: e.target.value });
  };

  const hasActiveFilters = Boolean(
    filters.keyword || filters.category || filters.minPrice || filters.maxPrice,
  );

  return (
    <div className="bg-white rounded-xl border border-surface-border p-5 shadow-xs space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Keyword Search */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-search"
            className="block text-xs font-semibold tracking-wide uppercase text-charcoal-primary"
          >
            Search Inventory
          </label>
          <div className="relative">
            <input
              id="filter-search"
              type="text"
              value={filters.keyword}
              onChange={handleKeywordChange}
              placeholder="Search make or model (e.g. BMW, SUV)..."
              className="w-full px-3.5 py-2 text-sm rounded-md border border-surface-border bg-white text-charcoal-primary placeholder:text-charcoal-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 transition-colors"
            />
          </div>
        </div>

        {/* Category Select */}
        <div className="space-y-1.5">
          <label
            htmlFor="filter-category"
            className="block text-xs font-semibold tracking-wide uppercase text-charcoal-primary"
          >
            Category
          </label>
          <select
            id="filter-category"
            value={filters.category}
            onChange={handleCategoryChange}
            className="w-full px-3.5 py-2 text-sm rounded-md border border-surface-border bg-white text-charcoal-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 transition-colors"
          >
            <option value="">All Categories</option>
            {VEHICLE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Price Boundaries */}
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <label className="block text-xs font-semibold tracking-wide uppercase text-charcoal-primary">
            Price Range ($)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              aria-label="Minimum Price"
              placeholder="Min price"
              min="0"
              value={filters.minPrice}
              onChange={handleMinPriceChange}
              className={`w-full px-3 py-2 text-sm rounded-md border bg-white text-charcoal-primary placeholder:text-charcoal-muted focus-visible:outline-none focus-visible:ring-2 transition-colors ${
                isPriceRangeInvalid
                  ? 'border-rose-500 focus-visible:ring-rose-500'
                  : 'border-surface-border focus-visible:ring-forest-700'
              }`}
            />
            <input
              type="number"
              aria-label="Maximum Price"
              placeholder="Max price"
              min="0"
              value={filters.maxPrice}
              onChange={handleMaxPriceChange}
              className={`w-full px-3 py-2 text-sm rounded-md border bg-white text-charcoal-primary placeholder:text-charcoal-muted focus-visible:outline-none focus-visible:ring-2 transition-colors ${
                isPriceRangeInvalid
                  ? 'border-rose-500 focus-visible:ring-rose-500'
                  : 'border-surface-border focus-visible:ring-forest-700'
              }`}
            />
          </div>
        </div>

        {/* Reset Action */}
        <div className="flex items-center">
          <Button
            variant="outline"
            size="md"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="w-full text-xs"
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {isPriceRangeInvalid && (
        <p className="text-xs text-rose-600 font-medium">
          Min price cannot exceed max price. Please adjust price range.
        </p>
      )}
    </div>
  );
};
