import React from 'react';
import { CatalogManagement } from '../components/CatalogManagement';
import { CatalogConfig } from '../types';

interface CatalogManagerProps {
  config: CatalogConfig;
  onSave: (config: CatalogConfig) => Promise<void>;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({ config, onSave }) => {
  return (
    <CatalogManagement config={config} onSave={onSave} />
  );
};