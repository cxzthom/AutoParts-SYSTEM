import React, { useState } from 'react';
import { MaintenanceRecord } from '../types';
import { Search, Bus, Wrench, Calendar, User, Package, FileText } from 'lucide-react';

interface MaintenanceHistoryProps {
  records: MaintenanceRecord[];
}

export const MaintenanceHistory: React.FC<MaintenanceHistoryProps> = ({ records }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = records.filter(record => 
    record.vehicleInfo?.prefix.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.vehicleInfo?.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.vehicleInfo?.vin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header / Search */}
      <div className="bg-white p-6 rounded-md shadow-sm border border-gray-300 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div>
           <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
             <Wrench className="w-5 h-5 text-gray-600" /> Histórico de Manutenção de Frota
           </h2>
           <p className="text-sm text-gray-500">Consulte o registro de peças instaladas por veículo.</p>
        </div>
        <div className="relative w-full md:w-96">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
           <input
            type="text"
            placeholder="Buscar por Prefixo, Placa ou VIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-lg font-mono font-bold"
           />
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {searchTerm && filteredRecords.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-md border border-dashed border-gray-300">
             <Bus className="w-12 h-12 text-gray-300 mx-auto mb-2" />
             <p className="text-gray-500 font-medium">Nenhum registro encontrado para "{searchTerm}".</p>
          </div>
        ) : !searchTerm ? (
           <div className="text-center py-12 bg-gray-50 rounded-md border border-gray-200">
             <p className="text-gray-400">Digite o prefixo, placa ou chassi do veículo para filtrar o histórico.</p>
           </div>
        ) : (
          filteredRecords.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
            <div key={record.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex flex-col md:flex-row justify-between gap-4 mb-4 border-b border-gray-100 pb-4">
                  <div className="flex items-start gap-4">
                     <div className="bg-gray-100 p-3 rounded-md flex flex-col items-center justify-center min-w-[80px]">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Carro</span>
                        <span className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                           <Bus className="w-5 h-5 text-gray-400" /> {record.vehicleInfo?.prefix}
                        </span>
                     </div>
                     <div className="space-y-1">
                        <div className="text-sm font-bold text-gray-800">
                          {record.vehicleInfo?.plate} - {record.vehicleInfo?.model}
                        </div>
                        <div className="text-xs text-gray-500">
                           VIN: {record.vehicleInfo?.vin} | {record.vehicleInfo?.bodyType} ({record.vehicleInfo?.year})
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                           <Calendar className="w-4 h-4" /> {new Date(record.date).toLocaleDateString()}
                           <span className="mx-1">•</span>
                           <User className="w-4 h-4" /> {record.mechanicName}
                        </div>
                     </div>
                  </div>
                  <div className="md:text-right md:w-1/3 flex flex-col items-end">
                     <span className="text-[10px] font-bold text-white bg-gray-600 px-2 py-0.5 rounded uppercase mb-2">
                       {record.maintenanceSystem}
                     </span>
                     <p className="text-sm text-gray-800 italic bg-gray-50 p-2 rounded border border-gray-100 w-full text-right">
                        "{record.description}"
                     </p>
                  </div>
               </div>

               <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                     <Package className="w-3 h-3" /> Peças Utilizadas
                  </h4>
                  <div className="bg-gray-50 rounded border border-gray-200 divide-y divide-gray-200">
                     {record.items.map((item, idx) => (
                        <div key={idx} className="p-2 flex justify-between items-center text-sm">
                           <span className="text-gray-700">{item.partName} <span className="text-gray-400 text-xs">({item.internalCode})</span></span>
                           <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                              x{item.quantity}
                           </span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};