
import React, { useState, useMemo, useRef } from 'react';
import { AutoPart, PartStatus, PartCategory, OrderItem, VehicleInfo, MaintenanceSystem, POPULAR_BRANDS, Order, OrderStatus } from '../types';
import { Search, Trash2, Edit2, Filter, Calendar, Tag, Barcode, CheckSquare, Square, FileText, ZoomIn, ZoomOut, X, ShoppingCart, CheckCircle2, ImageOff, AlertTriangle, Bus, Wrench, Cog, PlusCircle, HelpCircle, ArrowRight, Inbox, PackageCheck, Forward, Eye, FileWarning, ExternalLink, Plus, Maximize2, Move, RotateCcw, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

interface ClientListProps {
  clients: AutoPart[];
  onDelete: (id: string) => void;
  onCreateOrder: (items: OrderItem[], priority: 'NORMAL' | 'URGENTE', vehicleData?: VehicleInfo, maintenanceSystem?: MaintenanceSystem, maintenanceNotes?: string) => void;
  onRequestRegistration?: (description: string, brand?: string) => void; 
  onReportCorrection?: (partId: string, partName: string, notes: string) => void;
  onEdit?: (id: string) => void;
  canEdit?: boolean;
  isMechanicView?: boolean;
  viewOnly?: boolean;
  vehiclesDB?: VehicleInfo[];
  
  pendingRequests?: Order[];
  pendingOrders?: Order[];
  pendingCorrections?: Order[];
  onProcessRequest?: (request: Order) => void;
  onOrderAction?: (orderId: string, action: 'DELIVER' | 'FORWARD_PURCHASING' | 'REJECT' | 'RESOLVE_CORRECTION') => void;

  showPrice?: boolean;
  onAddToCart?: (part: AutoPart) => void;
  
  customBrands?: string[];
  customCategories?: string[];
}

export const ClientList: React.FC<ClientListProps> = ({ 
  clients: parts, 
  onDelete, 
  onCreateOrder, 
  onRequestRegistration,
  onReportCorrection,
  onEdit,
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterBrand, setFilterBrand] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('');
  
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderPriority, setOrderPriority] = useState<'NORMAL' | 'URGENTE'>('NORMAL');
  
  const [isRequestPartModalOpen, setIsRequestPartModalOpen] = useState(false);
  const [requestPartDescription, setRequestPartDescription] = useState('');

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPart, setReportPart] = useState<AutoPart | null>(null);
  const [reportNotes, setReportNotes] = useState('');

  const [vehicleData, setVehicleData] = useState<VehicleInfo>({
    prefix: '', plate: '', vin: '', model: '', year: '', bodyType: ''
  });
  const [maintenanceSystem, setMaintenanceSystem] = useState<MaintenanceSystem>(MaintenanceSystem.ENGINE);
  const [maintenanceNotes, setMaintenanceNotes] = useState('');

  // Image Viewer State
  const [expandedImages, setExpandedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imgZoom, setImgZoom] = useState(1);
  const [imgPos, setImgPos] = useState({ x: 0, y: 0 });
  const [isImgDragging, setIsImgDragging] = useState(false);
  const [imgDragStart, setImgDragStart] = useState({ x: 0, y: 0 });
  
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

  // Handlers de Imagem (Zoom/Pan)
  const openImage = (images: string[]) => { setExpandedImages(images); setCurrentImageIndex(0); setImgZoom(1); setImgPos({ x: 0, y: 0 }); };
  const closeImage = () => { setExpandedImages([]); };
  const nextImage = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev + 1) % expandedImages.length); setImgZoom(1); setImgPos({x:0, y:0}); };
  const prevImage = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev - 1 + expandedImages.length) % expandedImages.length); setImgZoom(1); setImgPos({x:0, y:0}); };

  const handleImageWheel = (e: React.WheelEvent) => { e.stopPropagation(); const delta = e.deltaY * -0.001; setImgZoom(prev => Math.min(Math.max(0.5, prev + delta), 5)); };
  const handleImageMouseDown = (e: React.MouseEvent) => { e.preventDefault(); setIsImgDragging(true); setImgDragStart({ x: e.clientX - imgPos.x, y: e.clientY - imgPos.y }); };
  const handleImageMouseMove = (e: React.MouseEvent) => { if (isImgDragging) { e.preventDefault(); setImgPos({ x: e.clientX - imgDragStart.x, y: e.clientY - imgDragStart.y }); } };
  const handleImageMouseUp = () => { setIsImgDragging(false); };
  const resetImageTransform = () => { setImgZoom(1); setImgPos({ x: 0, y: 0 }); };

  const toggleSelection = (id: string) => {
    if (viewOnly) return; 
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) { newSet.delete(id); const newQtys = {...quantities}; delete newQtys[id]; setQuantities(newQtys); } 
    else { newSet.add(id); setQuantities(prev => ({...prev, [id]: 1})); }
    setSelectedIds(newSet);
  };

  const updateQuantity = (id: string, qty: number) => { if (qty < 1) return; setQuantities(prev => ({...prev, [id]: qty})); };
  const clearSelection = () => { setSelectedIds(new Set()); setQuantities({}); setIsOrderModalOpen(false); setOrderPriority('NORMAL'); setVehicleData({ prefix: '', plate: '', vin: '', model: '', year: '', bodyType: '' }); setMaintenanceNotes(''); setMaintenanceSystem(MaintenanceSystem.ENGINE); };

  const handleFinishOrder = () => {
    if (isMechanicView) {
      if (!vehicleData.prefix.trim()) { alert("O Prefixo do veículo é obrigatório."); return; }
      if (!vehicleData.plate.trim()) { alert("Veículo não identificado na base de frota."); return; }
    }
    const selectedIdsArray = Array.from(selectedIds) as string[];
    const items: OrderItem[] = selectedIdsArray.map(id => {
      const part = parts.find(p => p.id === id);
      return { partId: id, partName: part?.name || 'Unknown', internalCode: part?.internalCode || 'N/A', quantity: quantities[id] || 1 };
    });
    onCreateOrder(items, orderPriority, vehicleData, maintenanceSystem, maintenanceNotes);
    clearSelection();
  };

  const handlePrefixBlur = () => {
    if (!vehicleData.prefix || !vehiclesDB.length) return;
    const foundVehicle = vehiclesDB.find(v => v.prefix === vehicleData.prefix);
    if (foundVehicle) setVehicleData(foundVehicle);
    else setVehicleData(prev => ({...prev, plate: '', vin: '', model: '', year: '', bodyType: ''}));
  };

  const handleSubmitRegistrationRequest = () => {
    if (!requestPartDescription.trim()) { alert("Por favor, descreva a peça que você precisa."); return; }
    if (onRequestRegistration) { onRequestRegistration(requestPartDescription, filterBrand !== 'ALL' ? filterBrand : undefined); setIsRequestPartModalOpen(false); setRequestPartDescription(''); }
  };

  const openReportModal = (part: AutoPart) => { setReportPart(part); setReportNotes(''); setIsReportModalOpen(true); };
  const handleSubmitReport = () => { if (reportPart && reportNotes && onReportCorrection) { onReportCorrection(reportPart.id, reportPart.name, reportNotes); setIsReportModalOpen(false); setReportPart(null); setReportNotes(''); } };

  const getPartImages = (part: AutoPart): string[] => {
    if (part.imageUrls && part.imageUrls.length > 0) return part.imageUrls;
    if (part.imageUrl) return [part.imageUrl];
    return [];
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Brand Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x p-1 -mx-4 px-4 md:mx-0 md:px-0">
        <button onClick={() => setFilterBrand('ALL')} className={`flex-shrink-0 snap-start px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition-all ${filterBrand === 'ALL' ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>Todas as Marcas</button>
        {availableBrands.map(brand => (
          <button key={brand} onClick={() => setFilterBrand(brand)} className={`flex-shrink-0 snap-start px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition-all flex items-center gap-1 ${filterBrand === brand ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-gray-600 border-gray-300 hover:text-red-600'}`}>
            {brand === 'Mercedes-Benz' && <span className="font-serif">MB</span>}{brand}
          </button>
        ))}
      </div>

      {/* Advanced Search & Filters */}
      <div className="bg-white p-4 rounded-md shadow-sm border border-gray-300 space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input type="text" placeholder="Buscar SKU, Nome, Código OEM ou Fornecedor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-shadow hover:shadow-sm text-base" />
        </div>
        
        {/* Mobile Filter Toggle Button */}
        <div className="md:hidden">
           <button 
             onClick={() => setShowMobileFilters(!showMobileFilters)} 
             className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded text-sm font-bold text-gray-700 active:bg-gray-100"
           >
             <span className="flex items-center gap-2"><Filter className="w-4 h-4"/> Filtros Avançados</span>
             {showMobileFilters ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
           </button>
        </div>

        {/* Collapsible Filter Section */}
        <div className={`${showMobileFilters ? 'grid' : 'hidden'} md:grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2`}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600 flex items-center gap-1 uppercase"><Tag className="w-3 h-3" /> Categoria</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full px-3 py-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20">
              <option value="ALL">Todas</option>
              {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600 flex items-center gap-1 uppercase"><Filter className="w-3 h-3" /> Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-3 py-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20">
              <option value="ALL">Todos</option>
              {Object.values(PartStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600 flex items-center gap-1 uppercase"><Calendar className="w-3 h-3" /> Data Cadastro</label>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full px-3 py-3 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
          </div>
          {isMechanicView && !viewOnly && onRequestRegistration && (
            <div className="flex items-end">
               <Button variant="secondary" onClick={() => setIsRequestPartModalOpen(true)} className="w-full h-[46px] border-dashed border-red-300 bg-red-50 text-red-700 hover:bg-red-100" icon={<HelpCircle className="w-4 h-4"/>}>Não encontrou? Solicitar</Button>
            </div>
          )}
        </div>
      </div>

      {/* Inbox Sections (Estoque Only) */}
      {!isMechanicView && canEdit && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {pendingRequests.length > 0 && (
             <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 shadow-sm animate-pulse">
                <div className="flex items-center gap-2 mb-3 text-purple-800 font-bold uppercase text-xs tracking-wider border-b border-purple-200 pb-2">
                  <Inbox className="w-4 h-4" /> Solicitações de Cadastro
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="bg-white p-3 rounded border border-purple-100 shadow-sm">
                       <p className="text-sm font-bold text-gray-800">{req.notes}</p>
                       <div className="flex justify-between items-center mt-2">
                          <span className="text-[10px] text-gray-500">{req.requesterName}</span>
                          <div className="flex gap-2">
                             <button onClick={() => onOrderAction?.(req.id, 'REJECT')} className="text-red-600 hover:text-red-800 text-[10px] font-bold uppercase" title="Rejeitar Solicitação">Rejeitar</button>
                             <button onClick={() => onProcessRequest?.(req)} className="text-purple-600 hover:text-purple-800 text-[10px] font-bold uppercase" title="Cadastrar Peça Agora">Cadastrar</button>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
           )}

           {pendingCorrections.length > 0 && (
             <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-red-800 font-bold uppercase text-xs tracking-wider border-b border-red-200 pb-2">
                  <FileWarning className="w-4 h-4" /> Reportes de Erro
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {pendingCorrections.map(req => (
                    <div key={req.id} className="bg-white p-3 rounded border border-red-100 shadow-sm">
                       <p className="text-sm font-bold text-gray-800">{req.items[0]?.partName}</p>
                       <p className="text-xs text-red-600 italic">"{req.notes}"</p>
                       <div className="flex justify-end items-center mt-2">
                          <button onClick={() => onOrderAction?.(req.id, 'RESOLVE_CORRECTION')} className="text-green-600 hover:text-green-800 text-[10px] font-bold uppercase flex items-center gap-1" title="Marcar como Resolvido"><CheckCircle2 className="w-3 h-3"/> Resolvido</button>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
           )}

           {pendingOrders.length > 0 && (
             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-yellow-800 font-bold uppercase text-xs tracking-wider border-b border-yellow-200 pb-2">
                  <PackageCheck className="w-4 h-4" /> Requisições de Peças
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {pendingOrders.map(order => (
                    <div key={order.id} className="bg-white p-3 rounded border border-yellow-100 shadow-sm">
                       <div className="flex justify-between items-start">
                          <div>
                             <p className="text-xs font-bold text-gray-500">{order.requesterName}</p>
                             <p className="text-sm font-bold text-gray-800">{order.items.length} itens</p>
                          </div>
                          {order.priority === 'URGENTE' && <span className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0.5 rounded font-bold">URGENTE</span>}
                       </div>
                       <div className="flex gap-2 mt-2">
                          <button onClick={() => onOrderAction?.(order.id, 'DELIVER')} className="flex-1 bg-green-100 hover:bg-green-200 text-green-800 text-[10px] font-bold py-1 rounded transition-colors" title="Entregar do Estoque">Atender</button>
                          <button onClick={() => onOrderAction?.(order.id, 'FORWARD_PURCHASING')} className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-[10px] font-bold py-1 rounded transition-colors" title="Sem estoque, comprar">Comprar</button>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
           )}
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredParts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-md border border-dashed border-gray-300">
            <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>Nenhuma peça encontrada.</p>
          </div>
        ) : (
          filteredParts.map((part) => {
            const images = getPartImages(part);
            const mainImage = images[0];
            return (
            <div key={part.id} className={`group bg-white rounded-xl border transition-all duration-300 flex flex-col overflow-hidden relative ${selectedIds.has(part.id) ? 'border-red-600 ring-2 ring-red-100 shadow-lg' : 'border-gray-200 hover:border-red-300 hover:shadow-lg hover:-translate-y-1'}`}>
              
              {/* Card Image Area */}
              <div className="relative h-40 bg-gray-100 border-b border-gray-100 group">
                 {mainImage ? (
                   <>
                     <img src={mainImage} alt={part.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                     <div 
                       className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center cursor-pointer"
                       onClick={() => openImage(images)}
                       title="Ampliar Imagem"
                     >
                        <div className="bg-white/90 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                           <ZoomIn className="w-5 h-5 text-gray-700" />
                        </div>
                     </div>
                     {images.length > 1 && (
                       <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                         <ImageOff className="w-3 h-3 rotate-180" /> +{images.length - 1}
                       </div>
                     )}
                   </>
                 ) : (
                   <div className="flex flex-col items-center justify-center h-full text-gray-400">
                     <ImageOff className="w-8 h-8 mb-1 opacity-50" />
                     <span className="text-[10px] uppercase font-bold">Sem Foto</span>
                   </div>
                 )}
                 
                 {/* Status Badge */}
                 <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold border shadow-sm ${part.status === PartStatus.IN_STOCK ? 'bg-green-100 text-green-800 border-green-200' : part.status === PartStatus.LOW_STOCK ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                      {part.status}
                    </span>
                 </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                   <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-1" title={part.name}>{part.name}</h3>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 border border-gray-200" title="Código Interno">{part.internalCode}</span>
                         {part.originalCode && <span className="text-[10px] font-mono text-gray-400 truncate" title="Código Original (OEM)">OEM: {part.originalCode}</span>}
                      </div>
                   </div>
                </div>

                <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                   <div className="text-xs text-gray-500">
                      <p className="line-clamp-1" title={part.supplierName}>{part.supplierName}</p>
                      <p className="text-[10px] text-gray-400">{part.category}</p>
                   </div>
                   
                   {/* Price Display */}
                   {showPrice && part.price && (
                     <div className="text-right">
                       <span className="text-[10px] text-gray-400 block">Preço Unit.</span>
                       <span className="text-lg font-bold text-green-700">R$ {part.price.toFixed(2)}</span>
                     </div>
                   )}
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                 
                 {/* Selection Checkbox Area */}
                 {!viewOnly && (
                   <div 
                     className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${selectedIds.has(part.id) ? 'bg-red-50 text-red-700' : 'hover:bg-gray-200 text-gray-500'}`}
                     onClick={() => toggleSelection(part.id)}
                     title={selectedIds.has(part.id) ? "Desmarcar item" : "Selecionar para pedido"}
                   >
                      {selectedIds.has(part.id) ? <CheckSquare className="w-5 h-5"/> : <Square className="w-5 h-5"/>}
                      {selectedIds.has(part.id) && (
                        <input 
                          type="number" 
                          min="1" 
                          className="w-10 text-xs text-center border border-red-200 rounded focus:outline-none focus:border-red-500 bg-white"
                          value={quantities[part.id] || 1}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateQuantity(part.id, parseInt(e.target.value))}
                        />
                      )}
                   </div>
                 )}

                 {/* Sales Add to Cart */}
                 {showPrice && onAddToCart && (
                   <Button 
                     size="sm" 
                     onClick={() => onAddToCart(part)} 
                     className="bg-green-600 hover:bg-green-700 flex-1 h-8 text-xs"
                     icon={<ShoppingCart className="w-3 h-3" />}
                     title="Adicionar ao Carrinho de Vendas"
                   >
                     Vender
                   </Button>
                 )}

                 {/* Action Buttons */}
                 <div className="flex items-center gap-1 ml-auto">
                    {part.manualUrl && (
                      <button onClick={() => window.open(part.manualUrl, '_blank')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Ver Manual Técnico / Datasheet">
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                    
                    {isMechanicView && onReportCorrection && (
                      <button onClick={() => openReportModal(part)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="Reportar erro no cadastro">
                        <FileWarning className="w-4 h-4" />
                      </button>
                    )}

                    {canEdit && onEdit && (
                      <button onClick={() => onEdit(part.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Editar informações da peça">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canEdit && (
                      <button onClick={() => onDelete(part.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Excluir peça do sistema">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                 </div>
              </div>
            </div>
          )})
        )}
      </div>

      {/* Floating Action Bar (Order) */}
      {!viewOnly && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-6 border-2 border-white/20 animate-in slide-in-from-bottom-4">
           <div className="flex items-center gap-3">
              <span className="bg-red-600 text-white font-bold px-2 py-0.5 rounded text-sm">{selectedIds.size}</span>
              <span className="text-sm font-medium">itens selecionados</span>
           </div>
           
           <div className="h-6 w-px bg-gray-700"></div>
           
           <button onClick={clearSelection} className="text-xs text-gray-400 hover:text-white uppercase font-bold tracking-wider">Cancelar</button>
           <button onClick={() => setIsOrderModalOpen(true)} className="bg-white text-gray-900 hover:bg-gray-100 px-6 py-2 rounded-full font-bold text-sm shadow-md transition-transform hover:scale-105 flex items-center gap-2">
             <ShoppingCart className="w-4 h-4" /> Finalizar Pedido
           </button>
        </div>
      )}

      {/* Modal: Image Viewer */}
      {expandedImages.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center animate-in fade-in backdrop-blur-sm" onClick={closeImage}>
           <div className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-move"
                onWheel={handleImageWheel}
                onMouseDown={handleImageMouseDown}
                onMouseMove={handleImageMouseMove}
                onMouseUp={handleImageMouseUp}
                onMouseLeave={handleImageMouseUp}
           >
              <img 
                src={expandedImages[currentImageIndex]} 
                alt="Expanded" 
                className="max-w-none transition-transform duration-75 ease-linear"
                style={{ transform: `translate(${imgPos.x}px, ${imgPos.y}px) scale(${imgZoom})` }}
                draggable={false}
              />
              
              {/* Image Navigation (if multiple) */}
              {expandedImages.length > 1 && (
                <>
                  <button className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 rounded-full hover:bg-white/40 text-white" onClick={prevImage}>
                    <ChevronLeft className="w-8 h-8"/>
                  </button>
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 rounded-full hover:bg-white/40 text-white" onClick={nextImage}>
                    <ChevronRight className="w-8 h-8"/>
                  </button>
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-white text-xs font-bold pointer-events-none">
                    {currentImageIndex + 1} / {expandedImages.length}
                  </div>
                </>
              )}

              {/* Controls */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-gray-800/80 backdrop-blur text-white px-4 py-2 rounded-full flex gap-4 shadow-lg border border-gray-700" onClick={(e) => e.stopPropagation()}>
                 <button onClick={() => setImgZoom(z => Math.max(0.5, z - 0.25))}><ZoomOut className="w-5 h-5"/></button>
                 <span className="font-mono text-sm w-12 text-center">{Math.round(imgZoom * 100)}%</span>
                 <button onClick={() => setImgZoom(z => Math.min(5, z + 0.25))}><ZoomIn className="w-5 h-5"/></button>
                 <div className="w-px h-6 bg-gray-600"></div>
                 <button onClick={resetImageTransform} title="Resetar"><RotateCcw className="w-5 h-5"/></button>
                 <button onClick={closeImage} title="Fechar"><X className="w-5 h-5"/></button>
              </div>

              <div className="absolute top-4 left-4 text-white/50 text-xs pointer-events-none">
                 <p className="flex items-center gap-2"><Move className="w-4 h-4"/> Arraste para mover</p>
                 <p className="flex items-center gap-2 mt-1"><Maximize2 className="w-4 h-4"/> Scroll para zoom</p>
              </div>
           </div>
        </div>
      )}

      {/* Modal: Confirm Order */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white p-8 rounded-lg shadow-2xl max-w-lg w-full border-t-4 border-red-600">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-red-600" /> Confirmar Requisição
              </h2>
              
              <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6 max-h-40 overflow-y-auto">
                 <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Resumo do Pedido</h3>
                 <ul className="space-y-2 text-sm">
                   {Array.from(selectedIds).map(id => {
                     const part = parts.find(p => p.id === id);
                     return (
                       <li key={id} className="flex justify-between">
                         <span className="truncate max-w-[250px]">{part?.name}</span>
                         <span className="font-bold font-mono">x{quantities[id] || 1}</span>
                       </li>
                     );
                   })}
                 </ul>
              </div>

              {isMechanicView && (
                <div className="space-y-4 mb-6">
                   <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                     <Bus className="w-3 h-3" /> Dados do Veículo (Obrigatório)
                   </h3>
                   <div className="grid grid-cols-3 gap-3">
                      <Input 
                        label="Prefixo" 
                        value={vehicleData.prefix} 
                        onChange={(e) => setVehicleData({...vehicleData, prefix: e.target.value})}
                        onBlur={handlePrefixBlur}
                        placeholder="Ex: 567"
                        required
                        className="font-bold bg-yellow-50 border-yellow-200"
                      />
                      <div className="col-span-2">
                        <Input 
                          label="Placa" 
                          value={vehicleData.plate} 
                          onChange={(e) => setVehicleData({...vehicleData, plate: e.target.value})}
                          readOnly
                          className="bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <Input label="Modelo" value={vehicleData.model} readOnly className="bg-gray-100 text-gray-500 text-xs" />
                      <Input label="VIN" value={vehicleData.vin} readOnly className="bg-gray-100 text-gray-500 text-xs" />
                   </div>

                   <div className="pt-2 border-t border-gray-100">
                      <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Detalhes da Manutenção</h3>
                      <div className="grid grid-cols-1 gap-3">
                         <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-700 uppercase">Sistema Afetado</label>
                            <select 
                              value={maintenanceSystem} 
                              onChange={(e) => setMaintenanceSystem(e.target.value as MaintenanceSystem)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            >
                              {Object.values(MaintenanceSystem).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                         </div>
                         <Input 
                           label="Motivo / Diagnóstico" 
                           value={maintenanceNotes} 
                           onChange={(e) => setMaintenanceNotes(e.target.value)} 
                           placeholder="Ex: Vazamento de óleo, Desgaste natural..." 
                         />
                      </div>
                   </div>
                </div>
              )}

              <div className="mb-6">
                 <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Nível de Prioridade</h3>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => setOrderPriority('NORMAL')}
                      className={`flex-1 py-2 rounded font-bold text-sm border ${orderPriority === 'NORMAL' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-500 border-gray-200'}`}
                    >
                      Normal
                    </button>
                    <button 
                      onClick={() => setOrderPriority('URGENTE')}
                      className={`flex-1 py-2 rounded font-bold text-sm border flex items-center justify-center gap-2 ${orderPriority === 'URGENTE' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-500 border-gray-200'}`}
                    >
                      <AlertTriangle className="w-4 h-4" /> Urgente
                    </button>
                 </div>
              </div>

              <div className="flex justify-end gap-3">
                 <Button variant="secondary" onClick={() => setIsOrderModalOpen(false)}>Cancelar</Button>
                 <Button onClick={handleFinishOrder}>Confirmar Pedido</Button>
              </div>
           </div>
        </div>
      )}

      {/* Modal: Request New Part */}
      {isRequestPartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full border-t-4 border-purple-600">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-purple-800">
                <HelpCircle className="w-5 h-5" /> Solicitar Cadastro de Peça
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Descreva a peça que você não encontrou. O setor de compras/estoque será notificado.
              </p>
              
              <textarea 
                className="w-full h-32 p-3 border border-gray-300 rounded focus:outline-none focus:border-purple-500 text-sm mb-4"
                placeholder="Ex: Filtro de ar para o novo ônibus Volvo (não achei pelo código)..."
                value={requestPartDescription}
                onChange={(e) => setRequestPartDescription(e.target.value)}
              />

              <div className="flex justify-end gap-2">
                 <Button variant="secondary" onClick={() => setIsRequestPartModalOpen(false)}>Cancelar</Button>
                 <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSubmitRegistrationRequest}>Enviar Solicitação</Button>
              </div>
           </div>
        </div>
      )}

      {/* Modal: Report Correction */}
      {isReportModalOpen && reportPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full border-t-4 border-orange-500">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-orange-800">
                <FileWarning className="w-5 h-5" /> Reportar Inconsistência
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Identificou um erro no cadastro da peça <strong>{reportPart.name}</strong>?
              </p>
              
              <textarea 
                className="w-full h-32 p-3 border border-gray-300 rounded focus:outline-none focus:border-orange-500 text-sm mb-4"
                placeholder="Ex: O código OEM está errado, a foto não corresponde à peça, ou a descrição está incompleta..."
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
              />

              <div className="flex justify-end gap-2">
                 <Button variant="secondary" onClick={() => setIsReportModalOpen(false)}>Cancelar</Button>
                 <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleSubmitReport}>Enviar Reporte</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};