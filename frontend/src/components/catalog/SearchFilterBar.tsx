import React from 'react';

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

export const SearchFilterBar: React.FC<SearchFilterBarProps> = () => {
  return <div>SearchFilterBar Stub</div>;
};
