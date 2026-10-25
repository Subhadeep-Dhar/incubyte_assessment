import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, ApiClientError } from '../api/client';
import { Vehicle, Pagination } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { SearchFilterBar, FilterState } from '../components/catalog/SearchFilterBar';
import { VehicleGrid } from '../components/catalog/VehicleGrid';
import { VehicleDetailModal } from '../components/catalog/VehicleDetailModal';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

export const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filters, setFilters] = useState<FilterState>({
    keyword: '',
    category: '',
    minPrice: '',
    maxPrice: '',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selected vehicle for modal inspection
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // In-flight purchase tracking
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const fetchInventory = useCallback(
    async (pageToFetch = currentPage, activeFilters = filters) => {
      setLoading(true);
      setError(null);

      const hasActiveFilters = Boolean(
        activeFilters.keyword.trim() ||
        activeFilters.category ||
        activeFilters.minPrice ||
        activeFilters.maxPrice,
      );

      try {
        if (hasActiveFilters) {
          const params: Record<string, string | number> = {
            page: pageToFetch,
            limit: 10,
          };

          if (activeFilters.keyword.trim()) {
            params.make = activeFilters.keyword.trim();
            params.model = activeFilters.keyword.trim();
          }

          if (activeFilters.category) {
            params.category = activeFilters.category;
          }

          if (activeFilters.minPrice) {
            params.minPrice = Number(activeFilters.minPrice);
          }

          if (activeFilters.maxPrice) {
            params.maxPrice = Number(activeFilters.maxPrice);
          }

          const response = await apiClient.getPaginated<Vehicle>('/vehicles/search', {
            params,
          });
          setVehicles(response.data || []);
          setPagination(response.pagination || DEFAULT_PAGINATION);
        } else {
          const response = await apiClient.getPaginated<Vehicle>('/vehicles', {
            params: { page: pageToFetch, limit: 10 },
          });
          setVehicles(response.data || []);
          setPagination(response.pagination || DEFAULT_PAGINATION);
        }
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message || 'Failed to fetch inventory. Please try again.');
        } else {
          setError('A network or server error occurred. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    },
    [currentPage, filters],
  );

  useEffect(() => {
    fetchInventory(currentPage, filters);
  }, [fetchInventory, currentPage, filters]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      keyword: '',
      category: '',
      minPrice: '',
      maxPrice: '',
    });
    setCurrentPage(1);
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
  };

  const handlePurchase = async (vehicle: Vehicle) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (vehicle.quantityInStock <= 0) {
      setError('Cannot purchase an out-of-stock vehicle.');
      return;
    }

    setPurchasingId(vehicle._id);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await apiClient.post<{ vehicle: Vehicle; purchase: unknown }>(
        `/vehicles/${vehicle._id}/purchase`,
      );

      // Decrement stock in local state
      setVehicles(prev =>
        prev.map(v =>
          v._id === vehicle._id
            ? { ...v, quantityInStock: response.vehicle?.quantityInStock ?? v.quantityInStock - 1 }
            : v,
        ),
      );

      // If the modal was viewing this vehicle, update its state
      if (selectedVehicle?._id === vehicle._id) {
        setSelectedVehicle(prev =>
          prev
            ? {
                ...prev,
                quantityInStock: response.vehicle?.quantityInStock ?? prev.quantityInStock - 1,
              }
            : null,
        );
      }

      setSuccessMessage(
        `Purchase successful! Congratulations on acquiring the ${vehicle.make} ${vehicle.model}.`,
      );
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message || 'Failed to complete vehicle purchase.');
      } else {
        setError('A network error occurred while processing your purchase.');
      }
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface-base py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Editorial Header */}
        <header className="border-b border-surface-border pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-widest text-forest-700">
                Curated Automotive Showroom
              </span>
              <h1
                data-testid="catalog-heading"
                className="text-3xl sm:text-4xl font-extrabold tracking-tight text-charcoal-primary mt-1"
              >
                Exclusive Vehicle Inventory
              </h1>
              <p className="text-sm text-charcoal-secondary mt-1 max-w-2xl">
                Explore our precision-engineered luxury and performance vehicles with real-time
                stock transparency.
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-xs font-medium text-charcoal-muted block">
                Available Inventory
              </span>
              <span className="text-2xl font-bold font-mono text-charcoal-primary">
                {pagination?.total ?? 0} Units
              </span>
            </div>
          </div>
        </header>

        {/* User Feedback Alerts */}
        {error && (
          <Alert
            variant="error"
            title="Inventory Error"
            action={
              <Button size="sm" variant="outline" onClick={() => fetchInventory()}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert
            variant="success"
            title="Transaction Confirmed"
            onClose={() => setSuccessMessage(null)}
          >
            {successMessage}
          </Alert>
        )}

        {/* Search & Filter Controls */}
        <SearchFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Inventory Grid with Skeletons and Empty State */}
        <VehicleGrid
          vehicles={vehicles}
          loading={loading}
          purchasingVehicleId={purchasingId}
          onSelect={handleSelectVehicle}
          onPurchase={handlePurchase}
          onResetFilters={handleResetFilters}
        />

        {/* Pagination Navigation */}
        {!loading && (pagination?.totalPages ?? 0) > 1 && (
          <div className="pt-6 border-t border-surface-border flex items-center justify-between">
            <span className="text-xs text-charcoal-secondary">
              Page {pagination?.page ?? 1} of {pagination?.totalPages ?? 1} (
              {pagination?.total ?? 0} vehicles)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                <span>Previous</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= (pagination?.totalPages ?? 1)}
                onClick={() => setCurrentPage(p => Math.min(pagination?.totalPages ?? 1, p + 1))}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}

        {/* Detailed Specs Modal */}
        <VehicleDetailModal
          vehicle={selectedVehicle}
          isOpen={isModalOpen}
          isPurchasing={purchasingId === selectedVehicle?._id}
          onClose={handleCloseModal}
          onPurchase={handlePurchase}
        />
      </div>
    </div>
  );
};
