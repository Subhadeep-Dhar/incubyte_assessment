import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  CarFront,
  Calendar,
  CheckCircle2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { apiClient, ApiClientError } from '../api/client';
import { Purchase, Pagination } from '../types/api';
import { formatCurrency } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Skeleton } from '../components/ui/Skeleton';

const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

export const PurchasesPage: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchases = useCallback(async (pageToFetch = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getPaginated<Purchase>('/purchases', {
        params: {
          page: pageToFetch,
          limit: 10,
        },
      });

      setPurchases(response.data || []);
      setPagination(response.pagination || DEFAULT_PAGINATION);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message || 'Failed to load purchase history');
      } else {
        setError('A network error occurred while retrieving your purchase records.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases(1);
  }, [fetchPurchases]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.page) {
      fetchPurchases(newPage);
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // Safe no-op in testing/jsdom environments
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateString;
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
                Customer Portfolio
              </span>
              <h1
                data-testid="purchases-heading"
                className="text-3xl sm:text-4xl font-extrabold tracking-tight text-charcoal-primary mt-1"
              >
                My Purchases
              </h1>
              <p className="text-sm text-charcoal-secondary mt-1 max-w-2xl">
                View your verified acquisition ledger, vehicle details, purchase prices, and
                permanent ownership records.
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-xs font-medium text-charcoal-muted block">
                Total Acquisitions
              </span>
              <span className="text-2xl font-bold font-mono text-charcoal-primary">
                {pagination.total} Units
              </span>
            </div>
          </div>
        </header>

        {/* Error State with Retry Action */}
        {error && (
          <Alert
            variant="error"
            title="Purchase History Error"
            action={
              <Button size="sm" variant="outline" onClick={() => fetchPurchases(pagination.page)}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div data-testid="purchases-loading-skeleton" className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-surface-border p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && purchases.length === 0 && (
          <div
            data-testid="empty-purchases-state"
            className="text-center py-16 px-4 bg-white rounded-2xl border border-surface-border shadow-xs space-y-5"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-surface-muted border border-surface-border flex items-center justify-center text-charcoal-muted">
              <ShoppingBag className="w-8 h-8 stroke-[1.75]" aria-hidden="true" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl font-bold text-charcoal-primary">No purchase records found</h2>
              <p className="text-sm text-charcoal-secondary">
                You have not acquired any vehicles yet. Explore our curated automotive showroom to
                purchase verified luxury and performance inventory.
              </p>
            </div>
            <Link to="/">
              <Button variant="primary" size="lg" className="text-sm font-semibold mt-2">
                <CarFront className="w-4 h-4 mr-2" aria-hidden="true" />
                <span>Browse Vehicle Showroom</span>
              </Button>
            </Link>
          </div>
        )}

        {/* Purchase History Ledger List */}
        {!loading && purchases.length > 0 && (
          <div className="space-y-4">
            {purchases.map(purchase => {
              const details = purchase.vehicleDetails;
              const vehicleTitle = details
                ? `${details.year ? details.year + ' ' : ''}${details.make} ${details.model}`
                : 'Vehicle Acquisition';
              const category = details?.category || 'Luxury';

              return (
                <div
                  key={purchase._id}
                  className="bg-white rounded-xl border border-surface-border p-6 shadow-xs hover:border-forest-600/30 transition-colors space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-surface-border/60 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-forest-50 border border-forest-600/20 flex items-center justify-center text-forest-700 shrink-0">
                        <CarFront className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-lg font-bold text-charcoal-primary">
                            {vehicleTitle}
                          </h2>
                          <Badge variant="neutral">{category}</Badge>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-charcoal-muted mt-0.5">
                          <span className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                            {formatDate(purchase.purchasedAt)}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[11px]">ID: {purchase._id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-charcoal-muted block">Purchase Price</span>
                      <span className="text-xl font-bold font-mono text-forest-700">
                        {formatCurrency(purchase.priceAtPurchase)}
                      </span>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-charcoal-secondary pt-1">
                    <div className="flex items-center space-x-4">
                      <span className="inline-flex items-center text-forest-800 bg-forest-50 px-2 py-0.5 rounded font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-forest-700" />
                        Verified Ownership
                      </span>
                      <span className="font-medium text-charcoal-primary">
                        Quantity: <span className="font-bold">{purchase.quantity ?? 1} Unit</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center text-charcoal-muted">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1 text-forest-700" />
                        Ledger Record Preserved
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && pagination.totalPages > 1 && (
          <nav
            aria-label="Purchase History Pagination"
            className="flex items-center justify-between border-t border-surface-border pt-6"
          >
            <div
              data-testid="pagination-page-indicator"
              className="text-sm text-charcoal-secondary font-medium"
            >
              Page <span className="font-bold text-charcoal-primary">{pagination.page}</span> of{' '}
              <span className="font-bold text-charcoal-primary">{pagination.totalPages}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                aria-label="Next page"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </Button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};
