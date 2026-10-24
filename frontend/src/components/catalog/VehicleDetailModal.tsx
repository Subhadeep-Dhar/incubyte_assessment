import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Vehicle } from '../../types/api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatPrice } from './VehicleCard';

export interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onPurchase?: (vehicle: Vehicle) => void;
  isPurchasing?: boolean;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  onPurchase,
  isPurchasing = false,
}) => {
  if (!vehicle) return null;

  const isOutOfStock = vehicle.quantityInStock === 0;
  const isLowStock = vehicle.quantityInStock > 0 && vehicle.quantityInStock <= 2;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-charcoal-primary/40 backdrop-blur-xs z-50 transition-opacity animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-xl border border-surface-border p-6 shadow-xl z-50 focus:outline-none animate-in fade-in zoom-in-95">
          <div className="flex items-start justify-between pb-4 border-b border-surface-border">
            <div>
              <div className="flex items-center space-x-2 text-xs text-charcoal-secondary font-medium mb-1">
                <span>{vehicle.year || 'Model Year'}</span>
                <span>•</span>
                <span className="font-semibold">{vehicle.category}</span>
                <span>•</span>
                {isOutOfStock ? (
                  <Badge variant="out-of-stock">Out of Stock</Badge>
                ) : isLowStock ? (
                  <Badge variant="low-stock">Low Stock ({vehicle.quantityInStock} units)</Badge>
                ) : (
                  <Badge variant="in-stock">In Stock ({vehicle.quantityInStock} units)</Badge>
                )}
              </div>
              <Dialog.Title className="text-xl font-bold tracking-tight text-charcoal-primary">
                {vehicle.make} {vehicle.model}
              </Dialog.Title>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="text-charcoal-muted hover:text-charcoal-primary p-1.5 rounded-md hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
              >
                ✕
              </button>
            </Dialog.Close>
          </div>

          <div className="py-5 space-y-4">
            {vehicle.imageUrl && (
              <div className="aspect-16/9 rounded-lg overflow-hidden border border-surface-border bg-surface-muted">
                <img
                  src={vehicle.imageUrl}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <Dialog.Description className="text-sm text-charcoal-secondary leading-relaxed">
              {vehicle.description ||
                'Exclusively curated luxury automotive engineering conforming to verified craftsmanship standards.'}
            </Dialog.Description>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-surface-muted border border-surface-border text-xs">
              <div>
                <span className="text-charcoal-muted uppercase tracking-wider block font-medium">
                  Category
                </span>
                <span className="font-semibold text-charcoal-primary text-sm mt-0.5 block">
                  {vehicle.category}
                </span>
              </div>
              <div>
                <span className="text-charcoal-muted uppercase tracking-wider block font-medium">
                  Available Stock
                </span>
                <span className="font-semibold text-charcoal-primary text-sm mt-0.5 block">
                  {vehicle.quantityInStock} units
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-surface-border flex items-center justify-between gap-4">
            <div>
              <span className="block text-[10px] font-medium tracking-wide uppercase text-charcoal-muted">
                Acquisition Price
              </span>
              <span className="text-xl font-extrabold font-mono text-charcoal-primary">
                {formatPrice(vehicle.price)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isOutOfStock}
                loading={isPurchasing}
                onClick={() => onPurchase?.(vehicle)}
              >
                {isOutOfStock ? 'Out of Stock' : 'Purchase Vehicle'}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
