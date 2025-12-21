import React from 'react';
import { AutoPart, Order, OrderItem, VehicleInfo, MaintenanceSystem, OrderStatus } from '../types';
import { ClientList } from '../components/ClientList';
import { ClientForm } from '../components/ClientForm';

interface StockDashboardProps {
  view: 'list' | 'register';
  parts: AutoPart[];
  orders: Order[];
  config: { customBrands: string[]; customCategories: string[] };
  editingPart?: AutoPart;
  registrationPrefill?: { description: string };
  onDeletePart: (id: string) => void;
  onCreateOrder: (items: OrderItem[], priority: 'NORMAL' | 'URGENTE', vehicleData?: VehicleInfo, maintenanceSystem?: MaintenanceSystem, maintenanceNotes?: string) => void;
  onOrderAction: (orderId: string, action: 'DELIVER' | 'FORWARD_PURCHASING' | 'REJECT' | 'RESOLVE_CORRECTION') => void;
  onEditPart: (id: string) => void;
  onSavePart: (part: any) => void;
  onUpdatePart: (id: string, part: any) => void;
  onCancelEdit: () => void;
  onProcessRequest: (request: Order) => void;
}

export const StockDashboard: React.FC<StockDashboardProps> = ({
  view,
  parts,
  orders,
  config,
  editingPart,
  registrationPrefill,
  onDeletePart,
  onCreateOrder,
  onOrderAction,
  onEditPart,
  onSavePart,
  onUpdatePart,
  onCancelEdit,
  onProcessRequest
}) => {
  if (view === 'register') {
    return (
      <ClientForm 
        onSave={editingPart ? (data) => onUpdatePart(editingPart.id, data) : onSavePart} 
        onCancel={onCancelEdit} 
        initialData={registrationPrefill} 
        partData={editingPart} 
        customBrands={config.customBrands} 
        customCategories={config.customCategories} 
      />
    );
  }

  return (
    <ClientList 
      clients={parts} 
      onDelete={onDeletePart} 
      onCreateOrder={onCreateOrder} 
      onEdit={onEditPart} 
      canEdit={true} 
      pendingRequests={orders.filter(o => o.status === OrderStatus.REGISTRATION_REQUEST)} 
      pendingOrders={orders.filter(o => o.status === OrderStatus.PENDING)} 
      pendingCorrections={orders.filter(o => o.status === OrderStatus.DATA_CORRECTION)} 
      onProcessRequest={onProcessRequest} 
      onOrderAction={onOrderAction} 
      customBrands={config.customBrands} 
      customCategories={config.customCategories} 
    />
  );
};