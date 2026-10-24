import React from 'react';
import { Vehicle } from '../../types/api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface VehicleCardProps {
  vehicle: Vehicle;
  onPurchase?: (vehicle: Vehicle) => void;
  onSelect?: (vehicle: Vehicle) => void;
  isPurchasing?: boolean;
}

import { formatPrice } from '../../utils/format';

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onPurchase,
  onSelect,
  isPurchasing = false,
}) => {
  const isOutOfStock = vehicle.quantityInStock === 0;
  const isLowStock = vehicle.quantityInStock > 0 && vehicle.quantityInStock <= 2;

  const handleCardClick = (e: React.MouseEvent) => {
    // If the click originated from the purchase button, don't trigger modal select
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onSelect?.(vehicle);
  };

  return (
    <article
      onClick={handleCardClick}
      className={`group rounded-xl border border-surface-border bg-white overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
        onSelect ? 'cursor-pointer' : ''
      }`}
    >
      {/* Visual Asset / Imagery Placeholder */}
      <div className="relative aspect-16/9 bg-gradient-to-br from-surface-muted to-surface-subdued border-b border-surface-border overflow-hidden flex items-center justify-center">
        {vehicle.imageUrl ? (
          <img
            src={vehicle.imageUrl}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="text-center p-4">
            <span className="text-3xl filter grayscale opacity-40 select-none">🏎️</span>
            <span className="block text-[11px] font-mono uppercase tracking-widest text-charcoal-muted mt-1">
              {vehicle.category}
            </span>
          </div>
        )}

        {/* Category Chip in Top-Right */}
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-xs text-charcoal-primary border border-surface-border shadow-xs">
          {vehicle.category}
        </span>
      </div>

      {/* Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs text-charcoal-secondary font-medium mb-1">
            <span>{vehicle.year || 'Model Year'}</span>
            {isOutOfStock ? (
              <Badge variant="out-of-stock">Out of Stock</Badge>
            ) : isLowStock ? (
              <Badge variant="low-stock">Low Stock ({vehicle.quantityInStock} units)</Badge>
            ) : (
              <Badge variant="in-stock">In Stock ({vehicle.quantityInStock} units)</Badge>
            )}
          </div>

          <h3 className="text-lg font-bold tracking-tight text-charcoal-primary group-hover:text-forest-700 transition-colors">
            {vehicle.make} {vehicle.model}
          </h3>

          {vehicle.description && (
            <p className="text-xs text-charcoal-secondary mt-1.5 line-clamp-2 leading-relaxed">
              {vehicle.description}
            </p>
          )}
        </div>

        {/* Footer: Price and CTA */}
        <div className="pt-3 border-t border-surface-border flex items-center justify-between gap-3">
          <div>
            <span className="block text-[10px] font-medium tracking-wide uppercase text-charcoal-muted">
              Price
            </span>
            <span className="text-lg font-extrabold font-mono text-charcoal-primary">
              {formatPrice(vehicle.price)}
            </span>
          </div>

          <Button
            size="sm"
            variant="primary"
            disabled={isOutOfStock}
            loading={isPurchasing}
            onClick={() => onPurchase?.(vehicle)}
            className="text-xs px-3.5"
          >
            {isOutOfStock ? 'Out of Stock' : 'Purchase Vehicle'}
          </Button>
        </div>
      </div>
    </article>
  );
};
