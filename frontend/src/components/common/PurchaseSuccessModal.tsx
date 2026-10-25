import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { Vehicle } from '../../types/api';
import { formatCurrency } from '../../utils/format';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface PurchaseSuccessModalProps {
  isOpen: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
}

interface ConfettiPiece {
  id: number;
  left: string;
  size: number;
  color: string;
  delay: string;
  duration: string;
  rotation: number;
  shape: 'rect' | 'circle';
}

const CONFETTI_COLORS = [
  '#1b4332', // Forest 700
  '#2d6a4f', // Forest 600
  '#d4af37', // Gold
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#ec4899', // Rose
  '#0284c7', // Sky
];

export const PurchaseSuccessModal: React.FC<PurchaseSuccessModalProps> = ({
  isOpen,
  vehicle,
  onClose,
}) => {
  // Generate deterministic particles for confetti burst
  const confettiPieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${((i * 2.5 + (i % 3) * 1.5) % 96) + 2}%`,
      size: (i % 3 === 0 ? 10 : 7) + (i % 4),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: `${((i % 7) * 0.15).toFixed(2)}s`,
      duration: `${(2.2 + (i % 5) * 0.3).toFixed(2)}s`,
      rotation: (i * 47) % 360,
      shape: i % 2 === 0 ? 'rect' : 'circle',
    }));
  }, []);

  // Keyboard navigation: Escape key dismisses modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-dismiss after 6 seconds of celebration
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      onClose();
    }, 6000);

    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen || !vehicle) {
    return null;
  }

  const vehicleTitle = `${vehicle.year ? vehicle.year + ' ' : ''}${vehicle.make} ${vehicle.model}`;

  return (
    <div
      data-testid="purchase-success-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-success-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-charcoal-primary/60 backdrop-blur-xs transition-opacity duration-200"
    >
      {/* Scoped CSS for celebratory confetti and reduced-motion adherence */}
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          85% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(105vh) rotate(720deg);
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .confetti-container {
            display: none !important;
          }
        }
      `}</style>

      {/* Confetti Animation Layer */}
      <div
        data-testid="confetti-container"
        className="confetti-container pointer-events-none fixed inset-0 overflow-hidden z-10"
        aria-hidden="true"
      >
        {confettiPieces.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              top: '-15px',
              left: p.left,
              width: `${p.size}px`,
              height: p.shape === 'rect' ? `${p.size * 1.5}px` : `${p.size}px`,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : '2px',
              transform: `rotate(${p.rotation}deg)`,
              animation: `confettiFall ${p.duration} linear ${p.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* Dialog Card Container */}
      <div className="relative z-20 bg-white rounded-2xl shadow-2xl border border-surface-border p-6 sm:p-8 max-w-lg w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="absolute top-4 right-4 p-1.5 rounded-full text-charcoal-muted hover:text-charcoal-primary hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Celebration Badge */}
        <div className="mx-auto w-16 h-16 rounded-full bg-forest-50 border-2 border-forest-600/30 flex items-center justify-center text-forest-700 shadow-xs">
          <CheckCircle2 className="w-10 h-10 stroke-[2.2]" aria-hidden="true" />
        </div>

        {/* Copy */}
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-forest-700">
            Ownership Confirmed
          </span>
          <h2
            id="purchase-success-heading"
            className="text-2xl sm:text-3xl font-extrabold text-charcoal-primary tracking-tight"
          >
            Purchase Confirmed!
          </h2>
          <p className="text-sm text-charcoal-secondary max-w-sm mx-auto">
            Congratulations! You have successfully acquired the{' '}
            <span className="font-semibold text-charcoal-primary">{vehicleTitle}</span>. Your
            transaction is recorded in the permanent inventory ledger.
          </p>
        </div>

        {/* Vehicle Summary Receipt Snippet */}
        <div className="bg-surface-muted rounded-xl p-4 border border-surface-border text-left flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Badge variant="neutral">{vehicle.category}</Badge>
              <span className="text-xs text-charcoal-muted font-medium">1 Unit</span>
            </div>
            <div className="font-bold text-charcoal-primary text-base truncate">{vehicleTitle}</div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs text-charcoal-muted block">Purchase Price</span>
            <span className="text-lg font-bold font-mono text-forest-700">
              {formatCurrency(vehicle.price)}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link to="/purchases" onClick={onClose} className="flex-1">
            <Button variant="primary" size="lg" className="w-full text-sm font-semibold">
              <ShoppingBag className="w-4 h-4 mr-2" aria-hidden="true" />
              <span>View My Purchases</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={onClose}
            className="text-sm text-charcoal-secondary"
          >
            <span>Continue Browsing</span>
            <ArrowRight className="w-4 h-4 ml-1.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
};
