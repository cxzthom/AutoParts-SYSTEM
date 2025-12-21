import React from 'react';
import { PurchasingDashboard } from '../components/PurchasingDashboard';
import { Order, AutoPart, OrderStatus, SaleRecord } from '../types';

interface PurchasingDashboardPageProps {
  orders: Order[];
  parts: AutoPart[];
  sales: SaleRecord[];
  currentUser: { name: string };
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onUpdateOrderItems: (id: string, items: any[]) => void;
  onUpdatePartSupplier: (id: string, data: any) => void;
  onCompleteSale: (sale: SaleRecord) => void;
}

export const PurchasingDashboardPage: React.FC<PurchasingDashboardPageProps> = ({
  orders, parts, sales, currentUser, onUpdateStatus, onUpdateOrderItems, onUpdatePartSupplier, onCompleteSale
}) => {
  return (
    <PurchasingDashboard 
      orders={orders} 
      parts={parts} 
      onUpdateStatus={onUpdateStatus} 
      onUpdateOrderItems={onUpdateOrderItems} 
      onUpdatePartSupplier={onUpdatePartSupplier} 
      salesHistory={sales} 
      onCompleteSale={onCompleteSale} 
      currentUserName={currentUser.name} 
    />
  );
};