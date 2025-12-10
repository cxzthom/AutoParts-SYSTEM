import React from 'react';
import { MaintenanceHistory } from '../components/MaintenanceHistory';
import { SystemHistory } from '../components/SystemHistory';
import { MaintenanceRecord, SystemLog } from '../types';

interface ReportsProps {
  activeTab: 'history' | 'logs';
  maintenanceRecords: MaintenanceRecord[];
  logs: SystemLog[];
}

export const Reports: React.FC<ReportsProps> = ({ activeTab, maintenanceRecords, logs }) => {
  return (
    <div className="space-y-6">
      {activeTab === 'history' && <MaintenanceHistory records={maintenanceRecords} />}
      {activeTab === 'logs' && <SystemHistory logs={logs} />}
    </div>
  );
};