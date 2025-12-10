import React from 'react';
import { MechanicDashboard } from '../components/MechanicDashboard';
import { AutoPart, Order, OrderItem, VehicleInfo, MaintenanceSystem, AssemblyDiagram } from '../types';

interface MechanicDashboardPageProps {
  parts: AutoPart[];
  orders: Order[];
  vehicles: VehicleInfo[];
  diagrams: AssemblyDiagram[];
  currentUserId: string;
  onCreateOrder: (items: OrderItem[], priority: 'NORMAL' | 'URGENTE', vehicleData?: VehicleInfo, maintenanceSystem?: MaintenanceSystem, maintenanceNotes?: string) => void;
  onConfirmReceipt: (orderId: string) => void;
  onRequestRegistration: (description: string, brand?: string) => void;
  onReportCorrection: (partId: string, partName: string, notes: string) => void;
}

export const MechanicDashboardPage: React.FC<MechanicDashboardPageProps> = ({
  parts, orders, vehicles, diagrams, currentUserId, onCreateOrder, onConfirmReceipt, onRequestRegistration, onReportCorrection
}) => {
  return (
    <MechanicDashboard 
      parts={parts} 
      orders={orders} 
      currentUserId={currentUserId} 
      onCreateOrder={onCreateOrder} 
      onConfirmReceipt={onConfirmReceipt} 
      onRequestRegistration={onRequestRegistration} 
      onReportCorrection={onReportCorrection} 
      vehiclesDB={vehicles} 
      diagrams={diagrams} 
    />
  );
};