import React from 'react';
import { Vehicle } from '../../types/api';
import { VehicleCard } from './VehicleCard';
import { Skeleton } from '../ui/Skeleton';
import { Button } from '../ui/Button';

export interface VehicleGridProps {
  vehicles: Vehicle[];
  loading?: boolean;
  onPurchase?: (vehicle: Vehicle) => void;
  onSelect?: (vehicle: Vehicle) => void;
  onResetFilters?: () => void;
  purchasingId?: string | null;
}

export const VehicleGrid: React.FC<VehicleGridProps> = ({
  vehicles,
  loading = false,
  onPurchase,
  onSelect,
  onResetFilters,
  purchasingId,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-surface-border bg-white overflow-hidden p-0 space-y-4 shadow-xs"
          >
            <Skeleton className="w-full aspect-16/9 rounded-none" />
            <div className="p-5 space-y-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-12 w-full mt-2" />
              <div className="pt-3 border-t border-surface-border flex justify-between items-center">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-8 w-1/3 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-surface-border bg-white p-12 text-center max-w-lg mx-auto my-8 space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-surface-muted text-charcoal-muted flex items-center justify-center mx-auto text-xl">
          🔍
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-charcoal-primary">
            No vehicles match your search
          </h3>
          <p className="text-xs text-charcoal-secondary max-w-xs mx-auto">
            Try adjusting your search terms, removing price bounds, or clearing filters.
          </p>
        </div>
        {onResetFilters && (
          <Button variant="outline" size="sm" onClick={onResetFilters} className="text-xs mt-2">
            Reset Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle._id}
          vehicle={vehicle}
          onPurchase={onPurchase}
          onSelect={onSelect}
          isPurchasing={purchasingId === vehicle._id}
        />
      ))}
    </div>
  );
};
