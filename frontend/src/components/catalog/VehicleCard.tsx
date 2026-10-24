import React from 'react';
import { Vehicle } from '../../types/api';

export interface VehicleCardProps {
  vehicle: Vehicle;
  onPurchase?: (vehicle: Vehicle) => void;
  onSelect?: (vehicle: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = () => {
  return <div>VehicleCard Stub</div>;
};
