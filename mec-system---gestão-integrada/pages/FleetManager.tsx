import React from 'react';
import { FleetManagement } from '../components/FleetManagement';
import { VehicleInfo } from '../types';

interface FleetManagerProps {
  vehicles: VehicleInfo[];
  onAddVehicle: (vehicle: VehicleInfo) => void;
  onDeleteVehicle: (prefix: string) => void;
}

export const FleetManager: React.FC<FleetManagerProps> = ({ vehicles, onAddVehicle, onDeleteVehicle }) => {
  return (
    <FleetManagement 
      vehicles={vehicles} 
      onAddVehicle={onAddVehicle} 
      onDeleteVehicle={onDeleteVehicle} 
    />
  );
};