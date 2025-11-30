import React, { useState } from 'react';
import { CatalogConfig } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { Plus, Trash2, Save, Tag, PenTool, Bus, RefreshCw } from 'lucide-react';

interface CatalogManagementProps {
  config: CatalogConfig;
  onSave: (config: CatalogConfig) => Promise<void>;
}

export const CatalogManagement: React.FC<CatalogManagementProps> = ({ config, onSave }) => {
  const [formData, setFormData] = useState<CatalogConfig>(config);
  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newModel, setNewModel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const addItem = (field: keyof CatalogConfig, value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    if (formData[field].includes(value.trim())) {
      alert('Item já existe na lista.');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()]
    }));
    setter('');
  };

  const removeItem = (field: keyof CatalogConfig, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== value)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-md shadow-sm border border-gray-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-red-600" /> Gestão de Catálogo e Taxonomia
            </h2>
            <p className="text-sm text-gray-500">
              Personalize as listas de marcas, categorias e modelos disponíveis nos formulários.
            </p>
          </div>
          <Button onClick={handleSave} isLoading={isSaving} icon={<Save className="w-4 h-4" />}>
            Salvar Configurações
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Marcas */}
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 uppercase text-xs tracking-wider">
              <Tag className="w-4 h-4" /> Marcas Personalizadas
            </h3>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Nova Marca..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500"
              />
              <Button size="sm" onClick={() => addItem('customBrands', newBrand, setNewBrand)} icon={<Plus className="w-4 h-4" />} />
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {formData.customBrands.length === 0 && <p className="text-xs text-gray-400 italic">Nenhuma marca extra cadastrada.</p>}
              {formData.customBrands.map(item => (
                <div key={item} className="flex justify-between items-center bg-white px-3 py-2 rounded border border-gray-100 shadow-sm text-sm">
                  <span>{item}</span>
                  <button onClick={() => removeItem('customBrands', item)} className="text-gray-400 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Categorias */}
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 uppercase text-xs tracking-wider">
              <Tag className="w-4 h-4" /> Categorias Extras
            </h3>
            <div className="flex gap-2 mb-4">
               <input 
                type="text" 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nova Categoria..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500"
              />
              <Button size="sm" onClick={() => addItem('customCategories', newCategory, setNewCategory)} icon={<Plus className="w-4 h-4" />} />
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {formData.customCategories.length === 0 && <p className="text-xs text-gray-400 italic">Nenhuma categoria extra cadastrada.</p>}
              {formData.customCategories.map(item => (
                <div key={item} className="flex justify-between items-center bg-white px-3 py-2 rounded border border-gray-100 shadow-sm text-sm">
                  <span>{item}</span>
                  <button onClick={() => removeItem('customCategories', item)} className="text-gray-400 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Modelos de Veículo */}
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2 uppercase text-xs tracking-wider">
              <Bus className="w-4 h-4" /> Modelos de Veículo
            </h3>
            <div className="flex gap-2 mb-4">
               <input 
                type="text" 
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="Novo Modelo (ex: Scania R450)..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500"
              />
              <Button size="sm" onClick={() => addItem('vehicleModels', newModel, setNewModel)} icon={<Plus className="w-4 h-4" />} />
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {formData.vehicleModels.length === 0 && <p className="text-xs text-gray-400 italic">Nenhum modelo cadastrado.</p>}
              {formData.vehicleModels.map(item => (
                <div key={item} className="flex justify-between items-center bg-white px-3 py-2 rounded border border-gray-100 shadow-sm text-sm">
                  <span>{item}</span>
                  <button onClick={() => removeItem('vehicleModels', item)} className="text-gray-400 hover:text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};