
import React, { useState, useMemo } from 'react';
import { AutoPart, PartStatus, PartCategory, OrderItem, VehicleInfo, MaintenanceSystem, POPULAR_BRANDS, Order, OrderStatus } from '../types';
import { Search, Trash2, Edit2, Filter, Calendar, Tag, Barcode, CheckSquare, Square, FileText, ZoomIn, ZoomOut, X, ShoppingCart, CheckCircle2, ImageOff, AlertTriangle, Bus, Wrench, Cog, PlusCircle, HelpCircle, ArrowRight, Inbox, PackageCheck, Forward, Eye, FileWarning, ExternalLink, Plus } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

interface ClientListProps {
  clients: AutoPart[];
  onDelete: (id: string) => void;
  onCreateOrder: (items: OrderItem[], priority: 'NORMAL' | 'URGENTE', vehicleData?: VehicleInfo, maintenanceSystem?: MaintenanceSystem, maintenanceNotes?: string) => void;
  onRequestRegistration?: (description: string, brand?: string) => void; 
  onReportCorrection?: (partId: string, partName: string, notes: string) => void;
  canEdit?: boolean;
  isMechanicView?: boolean;
  viewOnly?: boolean;
  vehiclesDB?: VehicleInfo[];
  
  // Props para o Inbox de Solicitações (Estoque)
  pendingRequests?: Order[];
  pendingOrders?: Order[];
  pendingCorrections?: Order[];
  onProcessRequest?: (request: Order) => void;
  onOrderAction?: (orderId: string, action: 'DELIVER' | 'FORWARD_PURCHASING' | 'REJECT' | 'RESOLVE_CORRECTION') => void;

  // Novos props para Vendas (PDV)
  showPrice?: boolean;
  onAddToCart?: (part: AutoPart) => void;
  
  // Configuração dinâmica
  customBrands?: string[];
  customCategories?: string[];
}

export const ClientList: React.FC<ClientListProps> = ({ 
  clients: parts, 
  onDelete, 
  onCreateOrder, 
  onRequestRegistration,
  onReportCorrection,
  canEdit = true, 
  isMechanicView = false,
  viewOnly = false,
  vehiclesDB = [],
  pendingRequests = [],
  pendingOrders = [],
  pendingCorrections = [],
  onProcessRequest,
  onOrderAction,
  showPrice = false,
  onAddToCart,
  customBrands = [],
  customCategories = []
}) => {
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterBrand, setFilterBrand] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('');
  
  // Seleção e Pedidos
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderPriority, setOrderPriority] = useState<'NORMAL' | 'URGENTE'>('NORMAL');
  
  // Solicitação de Cadastro (Mecânico)
  const [isRequestPartModalOpen, setIsRequestPartModalOpen] = useState(false);
  const [requestPartDescription, setRequestPartDescription] = useState('');

  // Reporte de Erro (Mecânico)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPart, setReportPart] = useState<AutoPart | null>(null);
  const [reportNotes, setReportNotes] = useState('');

  // Dados Específicos de Mecânica (Estado Estendido)
  const [vehicleData, setVehicleData] = useState<VehicleInfo>({
    prefix: '',
    plate: '',
    vin: '',
    model: '',
    year: '',
    bodyType: ''
  });
  const [maintenanceSystem, setMaintenanceSystem] = useState<MaintenanceSystem>(MaintenanceSystem.ENGINE);
  const [maintenanceNotes, setMaintenanceNotes] = useState('');

  // Visualizador de Manual
  const [viewingManualPart, setViewingManualPart] = useState<AutoPart | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Combine static and custom data
  const availableBrands = useMemo(() => [...POPULAR_BRANDS, ...customBrands], [customBrands]);
  const availableCategories = useMemo(() => [...Object.values(PartCategory), ...customCategories], [customCategories]);

  const filteredParts = useMemo(() => {
    return parts.filter(part => {
      const matchesSearch = 
        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.internalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.originalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'ALL' || part.status === filterStatus;
      const matchesCategory = filterCategory === 'ALL' || part.category === filterCategory;
      
      const matchesBrand = filterBrand === 'ALL' || (
        (part.compatibleBrands && part.compatibleBrands.includes(filterBrand)) ||
        part.name.toLowerCase().includes(filterBrand.toLowerCase()) ||
        part.description.toLowerCase().includes(filterBrand.toLowerCase())
      );
      
      let matchesDate = true;
      if (filterDate) {
        const partDate = new Date(part.createdAt).toISOString().split('T')[0];
        matchesDate = partDate === filterDate;
      }

      return matchesSearch && matchesStatus && matchesCategory && matchesDate && matchesBrand;
    });
  }, [parts, searchTerm, filterStatus, filterCategory, filterBrand, filterDate]);

  // --- Handlers de Seleção ---
  const toggleSelection = (id: string) => {
    if (viewOnly) return; 

    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
      const newQtys = {...quantities};
      delete newQtys[id];
      setQuantities(newQtys);
    } else {
      newSet.add(id);
      setQuantities(prev => ({...prev, [id]: 1})); 
    }
    setSelectedIds(newSet);
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    setQuantities(prev => ({...prev, [id]: qty}));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setQuantities({});
    setIsOrderModalOpen(false);
    setOrderPriority('NORMAL');
    setVehicleData({ prefix: '', plate: '', vin: '', model: '', year: '', bodyType: '' });
    setMaintenanceNotes('');
    setMaintenanceSystem(MaintenanceSystem.ENGINE);
  };

  const handleFinishOrder = () => {
    if (isMechanicView) {
      if (!vehicleData.prefix.trim()) {
        alert("O Prefixo do veículo é obrigatório.");
        return;
      }
      if (!vehicleData.plate.trim()) {
        alert("Veículo não identificado na base de frota.");
        return;
      }
    }

    const selectedIdsArray = Array.from(selectedIds) as string[];
    const items: OrderItem[] = selectedIdsArray.map(id => {
      const part = parts.find(p => p.id === id);
      return {
        partId: id,
        partName: part?.name || 'Unknown',
        internalCode: part?.internalCode || 'N/A',
        quantity: quantities[id] || 1
      };
    });

    onCreateOrder(items, orderPriority, vehicleData, maintenanceSystem, maintenanceNotes);
    clearSelection();
  };

  const handlePrefixBlur = () => {
    if (!vehicleData.prefix || !vehiclesDB.length) return;
    
    const foundVehicle = vehiclesDB.find(v => v.prefix === vehicleData.prefix);
    if (foundVehicle) {
      setVehicleData(foundVehicle);
    } else {
      setVehicleData(prev => ({...prev, plate: '', vin: '', model: '', year: '', bodyType: ''}));
    }
  };

  const handleSubmitRegistrationRequest = () => {
    if (!requestPartDescription.trim()) {
      alert("Por favor, descreva a peça que você precisa.");
      return;
    }
    if (onRequestRegistration) {
      onRequestRegistration(requestPartDescription, filterBrand !== 'ALL' ? filterBrand : undefined);
      setIsRequestPartModalOpen(false);
      setRequestPartDescription('');
    }
  };

  const openReportModal = (part: AutoPart) => {
    setReportPart(part);
    setReportNotes('');
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = () => {
    if (reportPart && reportNotes && onReportCorrection) {
      onReportCorrection(reportPart.id, reportPart.name, reportNotes);
      setIsReportModalOpen(false);
      setReportPart(null);
      setReportNotes('');
    }
  };

  // --- Visual Helpers ---
  const getStatusColor = (status: PartStatus) => {
    switch (status) {
      case PartStatus.IN_STOCK: return 'bg-green-100 text-green-800 border-green-200';
      case PartStatus.LOW_STOCK: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case PartStatus.OUT_OF_STOCK: return 'bg-red-100 text-red-800 border-red-200';
      case PartStatus.DISCONTINUED: return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 pb-24">

      {/* SECTION: Inbox - Notificações de Correção */}
      {!isMechanicView && !viewOnly && !showPrice && pendingCorrections && pendingCorrections.length > 0 && (
         <div className="bg-gradient-to-r from-red-50 to-white p-5 rounded-md border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <FileWarning className="w-5 h-5 text-red-600" />
              </div>
              <div>
                 <h3 className="text-lg font-bold text-gray-900">Inconsistências Reportadas</h3>
                 <p className="text-xs text-gray-500">A oficina identificou erros em cadastros ou manuais.</p>
              </div>
              <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {pendingCorrections.length} alertas
              </span>
           </div>

           <div className="space-y-3">
              {pendingCorrections.map(req => (
                <div key={req.id} className="bg-white border border-red-100 rounded-lg p-4 shadow-sm flex flex-col justify-between gap-2">
                   <div>
                     <p className="text-[10px] text-red-600 font-bold uppercase mb-1">
                       Reportado por: {req.requesterName.split('(')[0]}
                     </p>
                     <p className="text-gray-800 font-medium text-sm mb-1">
                       Peça Alvo: <span className="font-bold">{req.items[0]?.partName}</span> ({req.items[0]?.internalCode})
                     </p>
                     <p className="text-gray-600 text-xs italic bg-gray-50 p-2 rounded border border-gray-100">
                       "{req.notes}"
                     </p>
                   </div>
                   <div className="flex justify-end pt-2">
                      <Button 
                       size="sm" 
                       onClick={() => onOrderAction && onOrderAction(req.id, 'RESOLVE_CORRECTION')}
                       className="bg-red-100 hover:bg-red-200 text-red-800 border-red-200 text-xs"
                       icon={<CheckCircle2 className="w-3 h-3" />}
                     >
                       Marcar como Resolvido
                     </Button>
                   </div>
                </div>
              ))}
           </div>
         </div>
      )}

      {/* SECTION: Inbox - Requisições de Saída */}
      {!isMechanicView && !viewOnly && !showPrice && pendingOrders.length > 0 && (
         <div className="bg-gradient-to-r from-orange-50 to-white p-5 rounded-md border border-orange-200 shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-orange-100 p-2 rounded-full">
                <PackageCheck className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                 <h3 className="text-lg font-bold text-gray-900">Requisições de Balcão Pendentes</h3>
                 <p className="text-xs text-gray-500">Solicitações da oficina aguardando separação ou compra.</p>
              </div>
              <span className="ml-auto bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {pendingOrders.length} aguardando
              </span>
           </div>

           <div className="space-y-3">
              {pendingOrders.map(order => (
                <div key={order.id} className="bg-white border border-orange-100 rounded-lg p-4 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                   <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                         <span className="text-xs font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">#{order.id}</span>
                         <span className="text-xs text-orange-600 font-bold">{order.requesterName}</span>
                         {order.priority === 'URGENTE' && (
                            <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200 flex items-center gap-0.5">
                               <AlertTriangle className="w-3 h-3"/> URGENTE
                            </span>
                         )}
                      </div>
                      <div className="space-y-1">
                         {order.items.map((item, i) => (
                           <div key={i} className="flex items-center justify-between text-sm text-gray-700 border-b border-gray-50 pb-1 last:border-0">
                              <span>{item.partName}</span>
                              <span className="font-mono font-bold bg-gray-50 px-2 rounded">x{item.quantity}</span>
                           </div>
                         ))}
                      </div>
                      {order.vehicleInfo?.prefix && (
                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                           <Bus className="w-3 h-3" /> Veículo: {order.vehicleInfo.prefix} ({order.vehicleInfo.plate})
                        </div>
                      )}
                   </div>
                   
                   <div className="flex flex-row md:flex-col gap-2 justify-center min-w-[140px]">
                      <Button 
                        size="sm" 
                        onClick={() => onOrderAction && onOrderAction(order.id, 'DELIVER')}
                        className="w-full bg-green-600 hover:bg-green-700 border-green-600 text-xs"
                        icon={<CheckCircle2 className="w-3 h-3" />}
                      >
                        Atender (Estoque)
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => onOrderAction && onOrderAction(order.id, 'FORWARD_PURCHASING')}
                        className="w-full text-xs"
                        icon={<Forward className="w-3 h-3" />}
                      >
                        Enviar p/ Compras
                      </Button>
                   </div>
                </div>
              ))}
           </div>
         </div>
      )}

      {/* SECTION: Inbox - Solicitações de CADASTRO */}
      {!isMechanicView && !viewOnly && !showPrice && pendingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-white p-5 rounded-md border border-purple-200 shadow-sm animate-in fade-in slide-in-from-top-4">
           <div className="flex items-center gap-2 mb-4">
              <div className="bg-purple-100 p-2 rounded-full">
                <Inbox className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                 <h3 className="text-lg font-bold text-gray-900">Solicitações de Cadastro Pendentes</h3>
                 <p className="text-xs text-gray-500">Mecânicos solicitaram a inclusão destas peças no catálogo.</p>
              </div>
              <span className="ml-auto bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {pendingRequests.length} novos
              </span>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingRequests.map(req => (
                <div key={req.id} className="bg-white border border-purple-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20">
                      <PlusCircle className="w-12 h-12 text-purple-600" />
                   </div>
                   <div className="relative z-10">
                     <p className="text-[10px] text-purple-600 font-bold uppercase mb-1">
                       Solicitado por: {req.requesterName.split('(')[0]}
                     </p>
                     <p className="text-gray-800 font-medium text-sm line-clamp-2 italic mb-3">
                       "{req.notes?.replace('SOLICITAÇÃO DE PEÇA NOVA: ', '')}"
                     </p>
                     <Button 
                       size="sm" 
                       onClick={() => onProcessRequest && onProcessRequest(req)}
                       className="w-full bg-purple-600 hover:bg-purple-700 border-purple-600 text-xs"
                       icon={<ArrowRight className="w-3 h-3" />}
                     >
                       Cadastrar Agora
                     </Button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Brand Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
        <button
          onClick={() => setFilterBrand('ALL')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition-all ${
            filterBrand === 'ALL' 
              ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Todas as Marcas
        </button>
        {availableBrands.map(brand => (
          <button
            key={brand}
            onClick={() => setFilterBrand(brand)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition-all flex items-center gap-1 ${
              filterBrand === brand 
                ? 'bg-red-600 text-white border-red-600 shadow-md' 
                : 'bg-white text-gray-600 border-gray-300 hover:border-red-300 hover:text-red-600'
            }`}
          >
            {brand === 'Mercedes-Benz' && <span className="font-serif">MB</span>}
            {brand}
          </button>
        ))}
      </div>

      {/* Advanced Search & Filters */}
      <div className="bg-white p-5 rounded-md shadow-sm border border-gray-300 space-y-4">
        {viewOnly && !showPrice && (
          <div className="mb-2 bg-blue-50 text-blue-800 p-2 rounded text-xs font-bold border border-blue-200 flex items-center gap-2">
            <Eye className="w-4 h-4"/> Modo de Consulta Ativo: Seleção de peças desabilitada.
          </div>
        )}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar SKU, Nome, Código OEM ou Fornecedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600 flex items-center gap-1 uppercase">
              <Tag className="w-3 h-3" /> Categoria
            </label>
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <option value="ALL">Todas</option>
              {availableCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600 flex items-center gap-1 uppercase">
              <Filter className="w-3 h-3" /> Status
            </label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <option value="ALL">Todos</option>
              {Object.values(PartStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600 flex items-center gap-1 uppercase">
              <Calendar className="w-3 h-3" /> Data Cadastro
            </label>
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          {/* Botão de Solicitação de Peça para Mecânicos */}
          {isMechanicView && !viewOnly && onRequestRegistration && (
            <div className="flex">
               <Button 
                variant="secondary"
                onClick={() => setIsRequestPartModalOpen(true)}
                className="w-full border-dashed border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400"
                icon={<HelpCircle className="w-4 h-4"/>}
              >
                Não encontrou? Solicitar Cadastro
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredParts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-md border border-dashed border-gray-300 flex flex-col items-center">
            <p className="text-gray-500 font-medium mb-4">Nenhum registro encontrado.</p>
            {isMechanicView && !viewOnly && onRequestRegistration && (
               <Button 
                onClick={() => setIsRequestPartModalOpen(true)}
                icon={<PlusCircle className="w-4 h-4"/>}
              >
                Solicitar Cadastro de Peça Nova
              </Button>
            )}
          </div>
        ) : (
          filteredParts.map((part) => {
            const isSelected = selectedIds.has(part.id);
            return (
              <div 
                key={part.id} 
                className={`bg-white p-5 rounded-md shadow-sm border transition-all hover:border-gray-400 relative overflow-hidden group ${isSelected ? 'border-red-500 ring-1 ring-red-500 bg-red-50/10' : 'border-gray-200'}`}
              >
                {/* Checkbox Area - HIDDEN IF VIEW ONLY */}
                {!viewOnly && (
                  <div 
                    onClick={() => toggleSelection(part.id)}
                    className="absolute top-0 left-0 bottom-0 w-12 cursor-pointer z-20 flex items-center justify-center hover:bg-gray-50 transition-colors border-r border-transparent group-hover:border-gray-100"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-red-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
                    )}
                  </div>
                )}

                <div className={`${viewOnly ? 'pl-0' : 'pl-10'} flex flex-col md:flex-row justify-between gap-6 relative z-10`}>
                  
                  {/* Image Thumbnail */}
                  <div className="flex-shrink-0 md:self-start">
                    <div className="w-full md:w-32 h-32 rounded bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                      {part.imageUrl ? (
                        <img 
                          src={part.imageUrl} 
                          alt={part.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <ImageOff className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-widest">
                            {part.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-widest ${getStatusColor(part.status)}`}>
                            {part.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900">{part.name}</h3>
                      </div>
                      
                      {/* Price Tag (Sales View) */}
                      {showPrice && part.price && (
                        <div className="text-right">
                          <span className="block text-[10px] text-gray-500 uppercase font-bold">Preço Unitário</span>
                          <span className="block text-xl font-bold text-green-700">R$ {part.price.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                          <Barcode className="w-3 h-3" /> SKU / OEM
                        </p>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-gray-500">Interno:</span>
                          <span className="font-mono font-bold text-sm text-gray-800">{part.internalCode}</span>
                        </div>
                        <div className="flex justify-between items-baseline mt-1 border-t border-gray-100 pt-1">
                           <span className="text-xs text-gray-500">Original:</span>
                           <span className="font-mono text-sm text-gray-600">{part.originalCode}</span>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded border border-gray-200">
                         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Fabricante</p>
                         <p className="font-semibold text-gray-800 text-sm truncate">{part.supplierName}</p>
                         <p className="text-xs text-gray-500 truncate">{part.supplierEmail}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                       <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 border-l-2 border-gray-200 pl-3">
                        {part.description}
                       </p>
                       
                       {/* Compatible Brands Tags */}
                       {part.compatibleBrands && part.compatibleBrands.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3 ml-3">
                            {part.compatibleBrands.map(brand => (
                              <span key={brand} className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 flex items-center gap-1">
                                <Cog className="w-3 h-3" /> {brand}
                              </span>
                            ))}
                          </div>
                       )}
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 justify-start min-w-[140px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4">
                     <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => {
                          setZoomLevel(1);
                          setViewingManualPart(part);
                        }}
                        className="w-full text-xs border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                        icon={<FileText className="w-3.5 h-3.5" />}
                      >
                        {part.manualUrl ? 'Abrir Manual' : 'Datasheet'}
                      </Button>

                      {/* Botão Reportar Erro */}
                      {(isMechanicView || (viewOnly && !showPrice)) && onReportCorrection && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openReportModal(part)}
                          className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100"
                          icon={<FileWarning className="w-3.5 h-3.5" />}
                        >
                          Reportar Erro
                        </Button>
                      )}
                      
                      {/* Botão Add to Cart (Vendas) */}
                      {onAddToCart && (
                        <Button 
                          size="sm"
                          onClick={() => onAddToCart(part)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white border-none mt-auto"
                          icon={<Plus className="w-4 h-4" />}
                        >
                          Vender
                        </Button>
                      )}

                      {canEdit && !viewOnly && !showPrice && (
                        <div className="flex gap-2 w-full mt-auto">
                          <Button variant="ghost" className="flex-1 text-gray-500 border border-gray-200 rounded" title="Editar">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border border-gray-200 rounded" onClick={() => onDelete(part.id)} title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Order Bar - HIDDEN IF VIEW ONLY OR SALES MODE */}
      {!viewOnly && !showPrice && selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800 shadow-2xl z-30 animate-in slide-in-from-bottom-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <div className="bg-red-600 text-white w-10 h-10 rounded flex items-center justify-center font-bold shadow-lg border border-red-500">
                {selectedIds.size}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-100">Itens Selecionados</span>
                <span className="text-xs text-gray-400">{canEdit ? 'Prontos para requisição' : 'Solicitação de Peças para Reparo'}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800" onClick={clearSelection}>Cancelar</Button>
              <Button 
                variant="primary"
                onClick={() => setIsOrderModalOpen(true)}
                icon={<ShoppingCart className="w-4 h-4" />}
                className="bg-white text-gray-900 hover:bg-gray-100 border-none font-bold"
              >
                Revisar {canEdit ? 'Pedido' : 'Solicitação'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ... (Modals remain unchanged, just ensuring they don't break) ... */}
      {viewingManualPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded shadow-2xl overflow-hidden flex flex-col">
            <div className="p-3 border-b border-gray-300 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="bg-gray-200 p-2 rounded">
                  <FileText className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Documentação Técnica Oficial</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-2 font-mono">
                    <span className="bg-gray-200 px-1 rounded">{viewingManualPart.internalCode}</span>
                    <span>{viewingManualPart.originalCode}</span>
                    {viewingManualPart.manualUrl && <span className="text-green-600 font-bold ml-2">• Manual Carregado</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 {!viewingManualPart.manualUrl?.includes('.pdf') && (
                   <>
                    <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))} className="p-1.5 hover:bg-gray-200 rounded border border-gray-300 bg-white"><ZoomOut className="w-4 h-4" /></button>
                    <span className="text-xs font-mono w-12 text-center font-bold text-gray-600">{Math.round(zoomLevel * 100)}%</span>
                    <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))} className="p-1.5 hover:bg-gray-200 rounded border border-gray-300 bg-white"><ZoomIn className="w-4 h-4" /></button>
                    <div className="h-6 w-px bg-gray-300 mx-2"></div>
                   </>
                 )}
                <button onClick={() => setViewingManualPart(null)} className="p-2 hover:bg-red-600 hover:text-white rounded"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative bg-gray-200 flex items-center justify-center shadow-inner">
               <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)`, backgroundSize: '40px 40px' }}></div>
               {viewingManualPart.manualUrl ? (
                 viewingManualPart.manualUrl.startsWith('data:image') ? (
                    <div className="transition-transform duration-200 ease-out origin-center p-4 bg-white shadow-xl max-w-[90%] max-h-[90%] overflow-auto border border-gray-400" style={{ transform: `scale(${zoomLevel})` }}>
                       <img src={viewingManualPart.manualUrl} alt="Manual" className="max-w-full h-auto" />
                    </div>
                 ) : (
                    <div className="w-full h-full bg-white p-4">
                       <iframe src={viewingManualPart.manualUrl} className="w-full h-full border-0" title="Manual Viewer"></iframe>
                    </div>
                 )
               ) : (
                 <div className="transition-transform duration-200 ease-out origin-center p-8 bg-white shadow-xl max-w-[90%] max-h-[90%] overflow-auto border border-gray-400" style={{ transform: `scale(${zoomLevel})` }}>
                   <div className="relative">
                      <div className="absolute top-0 left-0 border border-black px-2 py-0.5 font-mono font-bold text-[10px] bg-white text-black">REF: {viewingManualPart.originalCode}</div>
                      <img src={`https://placehold.co/800x600/ffffff/000000?text=MANUAL+NAO+CADASTRADO\n${viewingManualPart.category.toUpperCase()}&font=roboto`} alt="Esquema Técnico Genérico" className="max-w-full h-auto object-contain grayscale" draggable={false} />
                   </div>
                 </div>
               )}
            </div>

            <div className="p-3 bg-white border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
               <p className="font-mono">{viewingManualPart.manualUrl ? 'DOCUMENTO CARREGADO' : 'VISUALIZAÇÃO GENÉRICA'}</p>
               {!viewOnly && !showPrice && (
                  <Button size="sm" onClick={() => { if (!selectedIds.has(viewingManualPart.id)) { toggleSelection(viewingManualPart.id); } setViewingManualPart(null); }} icon={selectedIds.has(viewingManualPart.id) ? <CheckCircle2 className="w-3 h-3"/> : <CheckSquare className="w-3 h-3"/>} variant={selectedIds.has(viewingManualPart.id) ? "secondary" : "primary"}>
                    {selectedIds.has(viewingManualPart.id) ? "ITEM SELECIONADO" : "ADICIONAR AO PEDIDO"}
                  </Button>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal - Only shown if logic allows */}
      {!viewOnly && !showPrice && isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white w-full max-w-2xl rounded shadow-2xl overflow-hidden p-0 border border-gray-400 max-h-[95vh] flex flex-col">
              {/* ... (Existing Modal Content) ... */}
              <div className="bg-gray-900 p-4 flex items-center gap-3 border-b border-gray-800 shrink-0">
                <ShoppingCart className="w-6 h-6 text-red-500" />
                <h2 className="text-lg font-bold text-white">Confirmação de {canEdit ? 'Requisição' : 'Solicitação'}</h2>
              </div>
              
              <div className="p-6 space-y-4 overflow-y-auto">
                 {/* ... (Same as before, reusing existing logic) ... */}
                 {isMechanicView && (
                    <div className="bg-orange-50 p-4 rounded border border-orange-200 space-y-4 mb-2">
                       {/* Vehicle Fields */}
                       <h4 className="text-xs font-bold uppercase text-orange-800 flex items-center gap-1 border-b border-orange-200 pb-1">
                         <Bus className="w-4 h-4" /> Identificação do Veículo
                       </h4>
                       <div className="grid grid-cols-2 gap-4 relative">
                          <div className="col-span-2 sm:col-span-1">
                            <Input label="Prefixo (Nº Carro)" value={vehicleData.prefix} onChange={(e) => setVehicleData({...vehicleData, prefix: e.target.value})} onBlur={handlePrefixBlur} placeholder="Digite e tecle Tab" required className="font-bold text-gray-900" icon={<Search className="w-3 h-3 text-orange-500"/>} />
                          </div>
                          <div className="col-span-2 border-t border-orange-200 my-1 pt-1"></div>
                          <div className="col-span-2 grid grid-cols-2 gap-4 opacity-80">
                             <Input label="Placa" value={vehicleData.plate} readOnly className="bg-gray-100 text-gray-500 cursor-not-allowed" />
                             <Input label="Modelo" value={vehicleData.model} readOnly className="bg-gray-100 text-gray-500 cursor-not-allowed" />
                          </div>
                       </div>
                    </div>
                 )}

                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded bg-gray-50 divide-y divide-gray-200">
                    {parts.filter(p => selectedIds.has(p.id)).map(part => (
                      <div key={part.id} className="p-3 flex justify-between items-center hover:bg-white transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-bold text-gray-800 text-sm truncate">{part.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{part.internalCode}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <input type="number" min="1" value={quantities[part.id] || 1} onChange={(e) => updateQuantity(part.id, parseInt(e.target.value))} className="w-16 px-2 py-1 text-xs border border-gray-300 rounded text-center" />
                           <button onClick={() => toggleSelection(part.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>

              <div className="p-6 pt-0 flex gap-3 mt-auto bg-white">
                <Button variant="secondary" className="flex-1" onClick={() => setIsOrderModalOpen(false)}>Retornar</Button>
                <Button className="flex-1" onClick={handleFinishOrder}>{canEdit ? 'Enviar para Compras' : 'Solicitar ao Estoque'}</Button>
              </div>
           </div>
        </div>
      )}
      
      {/* Modais de Cadastro e Reporte (Mantidos) */}
      {isRequestPartModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white w-full max-w-lg rounded shadow-2xl p-6">
             <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-red-600" /> Solicitar Cadastro</h3>
                <button onClick={() => setIsRequestPartModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
             </div>
             <textarea className="w-full border border-gray-300 rounded p-3 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none" rows={4} placeholder="Descreva a peça..." value={requestPartDescription} onChange={(e) => setRequestPartDescription(e.target.value)} />
             <div className="flex justify-end gap-3 mt-4">
                <Button variant="secondary" onClick={() => setIsRequestPartModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmitRegistrationRequest}>Enviar</Button>
             </div>
           </div>
         </div>
      )}
    </div>
  );
};
