import React, { useState } from 'react';
import { VehicleInfo } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { Bus, Save, Trash2, PlusCircle, Search } from 'lucide-react';

interface FleetManagementProps {
  vehicles: VehicleInfo[];
  onAddVehicle: (vehicle: VehicleInfo) => void;
  onDeleteVehicle: (prefix: string) => void;
}

export const FleetManagement: React.FC<FleetManagementProps> = ({ vehicles, onAddVehicle, onDeleteVehicle }) => {
  const [formData, setFormData] = useState<VehicleInfo>({
    prefix: '',
    plate: '',
    model: '',
    year: '',
    bodyType: '',
    vin: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.prefix || !formData.plate || !formData.model) {
      alert("Prefixo, Placa e Modelo são obrigatórios.");
      return;
    }
    
    // Check duplication
    if (vehicles.some(v => v.prefix === formData.prefix)) {
      alert("Já existe um veículo com este Prefixo.");
      return;
    }

    onAddVehicle(formData);
    setFormData({ prefix: '', plate: '', model: '', year: '', bodyType: '', vin: '' });
  };

  const filteredVehicles = vehicles.filter(v => 
    v.prefix.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-md border border-gray-300 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Bus className="w-5 h-5 text-gray-600" /> Frota Ativa
            </h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar veículo..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-bold">Prefixo</th>
                  <th className="px-6 py-3 font-bold">Identificação</th>
                  <th className="px-6 py-3 font-bold">Detalhes Técnicos</th>
                  <th className="px-6 py-3 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">Nenhum veículo encontrado.</td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.prefix} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <Bus className="w-5 h-5 text-gray-400" /> {vehicle.prefix}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{vehicle.plate}</div>
                        <div className="text-xs text-gray-500 font-mono">VIN: {vehicle.vin || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-700 font-medium">{vehicle.model}</div>
                        <div className="text-xs text-gray-500">{vehicle.bodyType} • {vehicle.year}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button 
                           onClick={() => onDeleteVehicle(vehicle.prefix)}
                           className="text-gray-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-colors"
                           title="Remover Veículo"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-md border border-gray-300 shadow-sm sticky top-6">
           <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
             <div className="bg-blue-100 p-2 rounded">
                <PlusCircle className="w-5 h-5 text-blue-600" />
             </div>
             <div>
               <h3 className="font-bold text-gray-800">Novo Veículo</h3>
               <p className="text-xs text-gray-500">Adicionar à base de dados</p>
             </div>
           </div>

           <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Prefixo (Nº)" 
                  value={formData.prefix}
                  onChange={(e) => setFormData({...formData, prefix: e.target.value})}
                  placeholder="Ex: 1050"
                  required
                  className="font-bold"
                />
                <Input 
                  label="Placa" 
                  value={formData.plate}
                  onChange={(e) => setFormData({...formData, plate: e.target.value.toUpperCase()})}
                  placeholder="ABC-1234"
                  required
                />
              </div>

              <Input 
                label="Modelo do Chassi" 
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                placeholder="Ex: Volvo B270F"
                required
              />

              <Input 
                label="Número VIN / Chassi" 
                value={formData.vin}
                onChange={(e) => setFormData({...formData, vin: e.target.value.toUpperCase()})}
                placeholder="17 caracteres"
                maxLength={17}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Ano Fab/Mod" 
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                  placeholder="2023/2024"
                />
                <Input 
                  label="Tipo Carroceria" 
                  value={formData.bodyType}
                  onChange={(e) => setFormData({...formData, bodyType: e.target.value})}
                  placeholder="Padron/Artic."
                />
              </div>

              <div className="bg-blue-50 p-3 rounded border border-blue-100 text-xs text-blue-800 mt-2">
                Este veículo estará disponível imediatamente para abertura de ordens de serviço na oficina.
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 border-blue-600" icon={<Save className="w-4 h-4"/>}>
                Salvar Veículo
              </Button>
           </form>
        </div>
      </div>
    </div>
  );
};