
import React, { useState } from 'react';
import { AutoPart, Order, OrderItem, OrderStatus, VehicleInfo, MaintenanceSystem, AssemblyDiagram } from '../types';
import { ClientList } from './ClientList';
import { DiagramViewer } from './DiagramViewer';
import { FileText, Clock, Truck, CheckCircle, Package, AlertTriangle, Bus, Wrench, Info, Search, Map, ClipboardList, Filter } from 'lucide-react';
import { Button } from './Button';

interface MechanicDashboardProps {
  parts: AutoPart[];
  orders: Order[];
  currentUserId: string;
  onCreateOrder: (items: OrderItem[], priority: 'NORMAL' | 'URGENTE', vehicleData?: VehicleInfo, maintenanceSystem?: MaintenanceSystem, maintenanceNotes?: string) => void;
  onConfirmReceipt: (orderId: string) => void; // Finalizar manutenção
  onRequestRegistration: (description: string, brand?: string) => void; 
  onReportCorrection?: (partId: string, partName: string, notes: string) => void; 
  vehiclesDB: VehicleInfo[]; 
  diagrams: AssemblyDiagram[]; // Nova prop
}

export const MechanicDashboard: React.FC<MechanicDashboardProps> = ({ 
  parts, 
  orders, 
  currentUserId, 
  onCreateOrder,
  onConfirmReceipt,
  onRequestRegistration,
  onReportCorrection,
  vehiclesDB,
  diagrams
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'visual' | 'my-requests' | 'search' | 'history'>('catalog');
  const [selectedDiagram, setSelectedDiagram] = useState<AssemblyDiagram | null>(null);
  
  // Estado para busca no histórico geral
  const [historySearch, setHistorySearch] = useState('');

  const myOrders = orders.filter(o => o.requesterId === currentUserId);

  // Filtro do Histórico Geral
  const allHistoryOrders = orders.filter(order => {
    const term = historySearch.toLowerCase();
    
    // Busca por ID
    if (order.id.toLowerCase().includes(term)) return true;
    
    // Busca por Veículo (Prefixo/Placa)
    if (order.vehicleInfo?.prefix.toLowerCase().includes(term)) return true;
    if (order.vehicleInfo?.plate.toLowerCase().includes(term)) return true;

    // Busca por Itens (Nome ou Código)
    const hasItem = order.items.some(item => 
      item.partName.toLowerCase().includes(term) || 
      item.internalCode.toLowerCase().includes(term)
    );
    if (hasItem) return true;

    // Busca por Solicitante
    if (order.requesterName.toLowerCase().includes(term)) return true;

    return false;
  });

  const getStatusStep = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.REGISTRATION_REQUEST: return 0; 
      case OrderStatus.DATA_CORRECTION: return 0;
      case OrderStatus.PENDING: return 1;
      case OrderStatus.QUOTING: return 2;
      case OrderStatus.PURCHASED: return 3;
      case OrderStatus.IN_TRANSIT: return 3; 
      case OrderStatus.DELIVERED: return 4;
      case OrderStatus.INSTALLED: return 5;
      case OrderStatus.CANCELED: return 0;
      default: return 1;
    }
  };

  const renderOrderCard = (order: Order) => {
    const currentStep = getStatusStep(order.status);
    const isDelivered = order.status === OrderStatus.DELIVERED;
    const isFinished = order.status === OrderStatus.INSTALLED;
    const isRegistration = order.status === OrderStatus.REGISTRATION_REQUEST;
    const isCorrection = order.status === OrderStatus.DATA_CORRECTION;
    const vehicle = order.vehicleInfo;
    const isMine = order.requesterId === currentUserId;

    return (
      <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4 border-b border-gray-100 pb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span className="font-mono font-bold text-lg text-gray-900">#{order.id}</span>
              {!isMine && (
                 <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200 uppercase">
                   {order.requesterName.split('(')[0]}
                 </span>
              )}
              {order.priority === 'URGENTE' && (
                <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-red-200">
                  <AlertTriangle className="w-3 h-3" /> URGENTE
                </span>
              )}
              {isRegistration && (
                <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-purple-200">
                  <Info className="w-3 h-3" /> SOLICITAÇÃO CADASTRO
                </span>
              )}
               {isCorrection && (
                <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-red-200">
                  <Info className="w-3 h-3" /> REPORTE DE ERRO
                </span>
              )}
              <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            
            {isRegistration ? (
               <div className="mt-3 bg-gray-50 p-3 rounded border border-gray-100">
                 <p className="text-sm text-gray-700 italic">"{order.notes}"</p>
                 <p className="text-xs text-gray-500 mt-1">Aguardando análise do Almoxarifado para cadastro.</p>
               </div>
            ) : isCorrection ? (
               <div className="mt-3 bg-gray-50 p-3 rounded border border-gray-100">
                 <p className="text-sm font-bold text-gray-800">Peça: {order.items[0]?.partName}</p>
                 <p className="text-sm text-gray-700 italic">"{order.notes}"</p>
                 <p className="text-xs text-gray-500 mt-1">Notificação de erro enviada ao estoque.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 bg-gray-50 p-3 rounded border border-gray-100">
                 <div>
                    <div className="flex items-center gap-2 text-sm text-gray-700 font-bold mb-1">
                      <Bus className="w-4 h-4 text-orange-600" /> 
                      Carro {vehicle?.prefix || 'N/A'} <span className="text-gray-400 font-normal">({vehicle?.plate})</span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5 ml-6">
                       <p>{vehicle?.model} - {vehicle?.year}</p>
                       <p>Carroceria: {vehicle?.bodyType || 'Não inf.'}</p>
                       <p className="font-mono text-[10px]">VIN: {vehicle?.vin || 'N/A'}</p>
                    </div>
                 </div>
                 <div className="border-t md:border-t-0 md:border-l border-gray-200 pt-2 md:pt-0 md:pl-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700 font-bold mb-1">
                      <Wrench className="w-4 h-4 text-orange-600" />
                      {order.maintenanceSystem}
                    </div>
                    <p className="text-xs text-gray-500 italic">
                       "{order.maintenanceType}"
                    </p>
                 </div>
              </div>
            )}
          </div>
          
          <div className="flex items-end flex-col justify-center min-w-[150px]">
             {isDelivered && !isFinished && isMine && (
               <Button 
                 onClick={() => onConfirmReceipt(order.id)}
                 className="bg-green-600 hover:bg-green-700 border-green-600 animate-pulse w-full"
                 icon={<Wrench className="w-4 h-4" />}
               >
                 Finalizar
               </Button>
             )}
             {isFinished && (
               <span className="flex items-center gap-1 text-green-700 font-bold text-sm bg-green-50 px-3 py-1 rounded border border-green-200">
                 <CheckCircle className="w-4 h-4" /> Concluído
               </span>
             )}
             {/* Status Badge Simples para Histórico */}
             {!isFinished && !isDelivered && (
               <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {order.status}
               </span>
             )}
          </div>
        </div>

        {/* Order Items */}
        {!isRegistration && !isCorrection && (
          <div className="mb-6 space-y-1">
             <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Peças Solicitadas</div>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                 <div className="flex flex-col">
                   <span className="text-gray-700 font-medium">{item.partName}</span>
                   <span className="text-[10px] text-gray-400 font-mono">Cód: {item.internalCode}</span>
                 </div>
                 <span className="font-mono font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded">x{item.quantity}</span>
              </div>
            ))}
          </div>
        )}

        {/* Progress Tracker */}
        {!isRegistration && !isCorrection && (
          <div className="relative">
             <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
                <div style={{ width: `${(currentStep / 5) * 100}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${order.status === OrderStatus.CANCELED ? 'bg-red-500' : 'bg-orange-500'}`}></div>
             </div>
             <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:flex">
                <span className="text-orange-600">Solicitado</span>
                <span className={currentStep >= 2 ? 'text-orange-600' : ''}>Em Compra</span>
                <span className={currentStep >= 3 ? 'text-orange-600' : ''}>A Caminho</span>
                <span className={currentStep >= 4 ? 'text-orange-600' : ''}>Entregue</span>
                <span className={currentStep >= 5 ? 'text-green-600' : ''}>Instalado</span>
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex space-x-1 rounded-lg bg-gray-200 p-1 max-w-4xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 px-3 text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'catalog' 
              ? 'bg-white text-gray-900 shadow' 
              : 'text-gray-500 hover:bg-gray-300'
          }`}
        >
          <Package className="w-4 h-4" /> Solicitação
        </button>
        <button
          onClick={() => setActiveTab('visual')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 px-3 text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'visual' 
              ? 'bg-white text-gray-900 shadow' 
              : 'text-gray-500 hover:bg-gray-300'
          }`}
        >
          <Map className="w-4 h-4" /> Catálogo Visual
        </button>
        <button
          onClick={() => setActiveTab('my-requests')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 px-3 text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'my-requests' 
              ? 'bg-white text-gray-900 shadow' 
              : 'text-gray-500 hover:bg-gray-300'
          }`}
        >
          <FileText className="w-4 h-4" /> Minhas Solicitações
          {myOrders.filter(o => o.status !== OrderStatus.INSTALLED && o.status !== OrderStatus.CANCELED).length > 0 && (
             <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
               {myOrders.filter(o => o.status !== OrderStatus.INSTALLED && o.status !== OrderStatus.CANCELED).length}
             </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 px-3 text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'history' 
              ? 'bg-white text-gray-900 shadow' 
              : 'text-gray-500 hover:bg-gray-300'
          }`}
        >
          <ClipboardList className="w-4 h-4" /> Histórico Geral
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 px-3 text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'search' 
              ? 'bg-white text-gray-900 shadow' 
              : 'text-gray-500 hover:bg-gray-300'
          }`}
        >
          <Search className="w-4 h-4" /> Consulta Peças
        </button>
      </div>

      {activeTab === 'catalog' && (
        <ClientList 
          clients={parts} 
          onDelete={() => {}} 
          onCreateOrder={onCreateOrder}
          onRequestRegistration={onRequestRegistration}
          onReportCorrection={onReportCorrection}
          canEdit={false} 
          isMechanicView={true} 
          vehiclesDB={vehiclesDB}
        />
      )}
      
      {activeTab === 'search' && (
        <ClientList 
          clients={parts} 
          onDelete={() => {}} 
          onCreateOrder={() => {}} 
          onReportCorrection={onReportCorrection}
          canEdit={false} 
          isMechanicView={false} 
          viewOnly={true} 
        />
      )}

      {activeTab === 'visual' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {diagrams.length === 0 ? (
             <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded border border-dashed border-gray-300">
               <Map className="w-12 h-12 mx-auto mb-2 opacity-20" />
               <p>Nenhum diagrama cadastrado pelo estoque ainda.</p>
             </div>
           ) : (
             diagrams.map(diag => (
               <div key={diag.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group" onClick={() => setSelectedDiagram(diag)}>
                  <div className="h-48 bg-gray-100 relative overflow-hidden">
                    <img src={diag.imageUrl} alt={diag.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                       <span className="text-white text-xs font-bold uppercase tracking-wider bg-red-600 px-2 py-0.5 rounded">{diag.system}</span>
                    </div>
                  </div>
                  <div className="p-4">
                     <h3 className="font-bold text-gray-800">{diag.name}</h3>
                     <p className="text-xs text-gray-500 mt-1">{diag.hotspots.length} itens mapeados</p>
                  </div>
               </div>
             ))
           )}
        </div>
      )}

      {selectedDiagram && (
        <DiagramViewer 
          diagram={selectedDiagram}
          parts={parts}
          onAddToOrder={(items) => {
             setSelectedDiagram(null);
             setActiveTab('catalog');
             alert(`Por favor, localize a peça "${items[0].partName}" no catálogo para adicionar ao pedido do veículo.`);
          }}
          onClose={() => setSelectedDiagram(null)}
        />
      )}

      {activeTab === 'my-requests' && (
        <div className="space-y-4">
          {myOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-md border border-dashed border-gray-300">
              <p className="text-gray-500">Você ainda não realizou nenhuma solicitação de peças.</p>
            </div>
          ) : (
            myOrders.map(order => renderOrderCard(order))
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
           {/* Search Bar */}
           <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                 <input 
                   type="text" 
                   value={historySearch}
                   onChange={(e) => setHistorySearch(e.target.value)}
                   placeholder="Pesquisar por ID, Peça, Prefixo do Carro, Placa..."
                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                 />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Filter className="w-4 h-4" />
                <span>Mostrando {allHistoryOrders.length} registros</span>
              </div>
           </div>

           <div className="space-y-4">
             {allHistoryOrders.length === 0 ? (
               <div className="text-center py-12 bg-gray-50 rounded-md border border-dashed border-gray-300">
                 <Search className="w-12 h-12 mx-auto mb-2 opacity-20 text-gray-500" />
                 <p className="text-gray-500">Nenhum pedido encontrado com os termos pesquisados.</p>
               </div>
             ) : (
               allHistoryOrders.map(order => renderOrderCard(order))
             )}
           </div>
        </div>
      )}
    </div>
  );
};
