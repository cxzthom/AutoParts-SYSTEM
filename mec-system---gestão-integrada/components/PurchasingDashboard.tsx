
import React, { useState } from 'react';
import { Order, OrderStatus, AutoPart, SaleRecord } from '../types';
import { Button } from './Button';
import { Truck, CheckCircle, Clock, XCircle, FileText, AlertTriangle, Search, Package, Eye, X, Save, Edit2, ImageOff, ExternalLink, ShoppingCart, DollarSign, Calendar, User } from 'lucide-react';
import { Input } from './Input';
import { SalesDashboard } from './SalesDashboard';

interface PurchasingDashboardProps {
  orders: Order[];
  parts: AutoPart[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  onUpdatePartSupplier: (partId: string, supplierData: Partial<AutoPart>) => void;
  // Props para Vendas
  salesHistory: SaleRecord[];
  onCompleteSale: (sale: SaleRecord) => void;
  currentUserName: string;
  onUpdateOrderItems: (orderId: string, items: any[]) => void;
}

export const PurchasingDashboard: React.FC<PurchasingDashboardProps> = ({ 
  orders, 
  parts, 
  onUpdateStatus, 
  onUpdatePartSupplier,
  salesHistory,
  onCompleteSale,
  currentUserName,
  onUpdateOrderItems
}) => {
  const [activeTab, setActiveTab] = useState<'procurement' | 'sales'>('procurement');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Estado local para edição de fornecedor
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ supplierName: '', supplierEmail: '', supplierPhone: '', supplierDoc: '' });
  
  // Estado para edição de pedido (correção)
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editingItems, setEditingItems] = useState<any[]>([]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-bold border border-yellow-200 flex items-center gap-1"><Clock className="w-3 h-3"/> Pendente</span>;
      case OrderStatus.QUOTING:
        return <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200 flex items-center gap-1"><FileText className="w-3 h-3"/> Cotação</span>;
      case OrderStatus.PURCHASED:
        return <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Comprado</span>;
      case OrderStatus.IN_TRANSIT:
        return <span className="px-2 py-1 rounded bg-orange-100 text-orange-800 text-xs font-bold border border-orange-200 flex items-center gap-1"><Truck className="w-3 h-3"/> Trânsito</span>;
      case OrderStatus.DELIVERED:
        return <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-bold border border-green-200 flex items-center gap-1"><Package className="w-3 h-3"/> Entregue</span>;
      case OrderStatus.CANCELED:
        return <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200 flex items-center gap-1"><XCircle className="w-3 h-3"/> Cancelado</span>;
    }
  };

  const startEditing = (part: AutoPart) => {
    setEditingPartId(part.id);
    setEditForm({
      supplierName: part.supplierName,
      supplierEmail: part.supplierEmail,
      supplierPhone: part.supplierPhone,
      supplierDoc: part.supplierDoc
    });
  };

  const saveSupplier = (partId: string) => {
    onUpdatePartSupplier(partId, editForm);
    setEditingPartId(null);
  };

  const handleOpenOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setEditingItems(JSON.parse(JSON.stringify(order.items))); // Deep copy
    setIsEditingOrder(false);
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    const newItems = [...editingItems];
    newItems[index].quantity = newQty;
    setEditingItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = editingItems.filter((_, i) => i !== index);
    setEditingItems(newItems);
  };

  const handleSaveOrderCorrections = () => {
    if (selectedOrder) {
      onUpdateOrderItems(selectedOrder.id, editingItems);
      setSelectedOrder({ ...selectedOrder, items: editingItems }); // Optimistic update
      setIsEditingOrder(false);
    }
  };

  const getPartImage = (part: AutoPart) => {
    return (part.imageUrls && part.imageUrls.length > 0) ? part.imageUrls[0] : part.imageUrl;
  };

  const pendingCount = orders.filter(o => o.status === OrderStatus.PENDING).length;

  return (
    <div className="space-y-6 pb-20">
      
      {/* Module Switcher */}
      <div className="flex space-x-1 rounded-lg bg-gray-200 p-1 max-w-md mx-auto mb-8">
        <button
          onClick={() => setActiveTab('procurement')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-bold transition-all ${
            activeTab === 'procurement' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-300'
          }`}
        >
          <ShoppingCart className="w-4 h-4" /> Gestão de Compras
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-bold transition-all ${
            activeTab === 'sales' 
              ? 'bg-green-600 text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-300'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Frente de Caixa (Vendas)
        </button>
      </div>

      {activeTab === 'sales' ? (
        <SalesDashboard 
          parts={parts}
          salesHistory={salesHistory}
          onCompleteSale={onCompleteSale}
          currentUserName={currentUserName}
        />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-md border border-l-4 border-l-yellow-500 border-gray-200 shadow-sm">
               <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Aguardando Aprovação</p>
               <h3 className="text-2xl font-bold text-gray-900 mt-1">{pendingCount}</h3>
            </div>
             <div className="bg-white p-5 rounded-md border border-l-4 border-l-blue-500 border-gray-200 shadow-sm">
               <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Em Processo de Compra</p>
               <h3 className="text-2xl font-bold text-gray-900 mt-1">{orders.filter(o => o.status === OrderStatus.QUOTING || o.status === OrderStatus.PURCHASED).length}</h3>
            </div>
             <div className="bg-white p-5 rounded-md border border-l-4 border-l-green-600 border-gray-200 shadow-sm">
               <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Entregues este Mês</p>
               <h3 className="text-2xl font-bold text-gray-900 mt-1">{orders.filter(o => o.status === OrderStatus.DELIVERED).length}</h3>
            </div>
          </div>

          <div className="bg-white rounded-md border border-gray-300 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-gray-800 flex items-center gap-2">
                 <FileText className="w-5 h-5 text-red-600" /> Fila de Requisições
               </h3>
               <div className="relative">
                 <input type="text" placeholder="Filtrar pedidos..." className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-red-500" />
                 <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
               </div>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                Nenhuma requisição de compra encontrada no momento.
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-bold">ID / Data</th>
                        <th className="px-6 py-3 font-bold">Solicitante</th>
                        <th className="px-6 py-3 font-bold">Itens</th>
                        <th className="px-6 py-3 font-bold">Prioridade</th>
                        <th className="px-6 py-3 font-bold">Status</th>
                        <th className="px-6 py-3 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-mono font-bold text-gray-900">#{order.id.slice(0,6).toUpperCase()}</div>
                            <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-800">{order.requesterName}</div>
                            <div className="text-xs text-gray-500">Almoxarifado</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1 cursor-pointer group" onClick={() => handleOpenOrderDetails(order)}>
                              {order.items.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs text-gray-600 border-b border-gray-100 pb-1 last:border-0 group-hover:text-blue-600">
                                  <span className="truncate max-w-[150px]">{item.partName}</span>
                                  <span className="font-mono font-bold text-gray-900">x{item.quantity}</span>
                                </div>
                              ))}
                              {order.items.length > 2 && <div className="text-xs text-gray-400 italic">+ {order.items.length - 2} itens...</div>}
                              <div className="text-[10px] text-blue-600 font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                <Eye className="w-3 h-3" /> Ver Detalhes
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {order.priority === 'URGENTE' ? (
                              <span className="inline-flex items-center gap-1 text-red-700 font-bold text-xs uppercase animate-pulse">
                                <AlertTriangle className="w-3 h-3" /> Urgente
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs font-medium">Normal</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex flex-col gap-2 items-end">
                               {order.status === OrderStatus.PENDING && (
                                 <>
                                  <Button size="sm" onClick={() => onUpdateStatus(order.id, OrderStatus.QUOTING)} className="w-full text-xs">
                                    Iniciar Cotação
                                  </Button>
                                  <button onClick={() => onUpdateStatus(order.id, OrderStatus.CANCELED)} className="text-xs text-red-600 hover:underline">
                                    Recusar
                                  </button>
                                 </>
                               )}
                               {order.status === OrderStatus.QUOTING && (
                                 <Button size="sm" onClick={() => onUpdateStatus(order.id, OrderStatus.PURCHASED)} className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 border-indigo-600">
                                   Aprovar Compra
                                 </Button>
                               )}
                               {order.status === OrderStatus.PURCHASED && (
                                 <Button size="sm" onClick={() => onUpdateStatus(order.id, OrderStatus.IN_TRANSIT)} variant="secondary" className="w-full text-xs">
                                   Marcar Enviado
                                 </Button>
                               )}
                               {order.status === OrderStatus.IN_TRANSIT && (
                                 <Button size="sm" onClick={() => onUpdateStatus(order.id, OrderStatus.DELIVERED)} className="w-full text-xs bg-green-600 hover:bg-green-700 border-green-600">
                                   Confirmar Entrega
                                 </Button>
                               )}
                               {order.status === OrderStatus.DELIVERED && (
                                 <span className="text-xs text-gray-400 font-mono">ARQUIVADO</span>
                               )}
                               
                               <Button variant="ghost" size="sm" className="w-full text-xs text-gray-500 mt-1" onClick={() => handleOpenOrderDetails(order)}>
                                 <Eye className="w-3 h-3 mr-1" /> Analisar
                               </Button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4 bg-gray-50">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                        <div>
                          <div className="font-mono font-bold text-gray-900">#{order.id.slice(0,6).toUpperCase()}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Calendar className="w-3 h-3" /> {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-gray-500 flex items-center gap-1"><User className="w-3 h-3"/> Solicitante:</span>
                           <span className="font-medium text-gray-800">{order.requesterName}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-gray-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Prioridade:</span>
                           {order.priority === 'URGENTE' ? (
                             <span className="text-red-700 font-bold uppercase animate-pulse">Urgente</span>
                           ) : (
                             <span className="text-gray-600">Normal</span>
                           )}
                        </div>
                        <div className="bg-gray-50 p-2 rounded text-xs border border-gray-100">
                           <p className="font-bold text-gray-500 mb-1 uppercase">Resumo ({order.items.length} itens)</p>
                           {order.items.slice(0, 2).map((item, idx) => (
                             <div key={idx} className="flex justify-between py-0.5">
                               <span className="truncate max-w-[150px] text-gray-700">{item.partName}</span>
                               <span className="font-bold">x{item.quantity}</span>
                             </div>
                           ))}
                           {order.items.length > 2 && <span className="text-blue-600 italic">+ {order.items.length - 2} outros...</span>}
                        </div>
                      </div>

                      <div className="flex gap-2">
                         <Button variant="secondary" className="flex-1 text-xs" onClick={() => handleOpenOrderDetails(order)}>
                           <Eye className="w-3 h-3 mr-1" /> Detalhes
                         </Button>
                         
                         {order.status === OrderStatus.PENDING && (
                           <Button className="flex-1 text-xs" onClick={() => onUpdateStatus(order.id, OrderStatus.QUOTING)}>Cotar</Button>
                         )}
                         {order.status === OrderStatus.QUOTING && (
                           <Button className="flex-1 text-xs bg-indigo-600" onClick={() => onUpdateStatus(order.id, OrderStatus.PURCHASED)}>Comprar</Button>
                         )}
                         {order.status === OrderStatus.PURCHASED && (
                           <Button className="flex-1 text-xs bg-orange-500" onClick={() => onUpdateStatus(order.id, OrderStatus.IN_TRANSIT)}>Enviar</Button>
                         )}
                         {order.status === OrderStatus.IN_TRANSIT && (
                           <Button className="flex-1 text-xs bg-green-600" onClick={() => onUpdateStatus(order.id, OrderStatus.DELIVERED)}>Receber</Button>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Modal de Detalhes Completo */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white w-full max-w-5xl h-[90vh] rounded shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 bg-gray-900 text-white flex justify-between items-center border-b border-red-700">
                 <div className="flex items-center gap-3">
                   <div className="bg-red-600 p-2 rounded">
                     <FileText className="w-5 h-5 text-white" />
                   </div>
                   <div>
                     <h2 className="text-lg font-bold">Detalhes da Requisição #{selectedOrder.id}</h2>
                     <p className="text-xs text-gray-400">Solicitado por: {selectedOrder.requesterName} em {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                   </div>
                 </div>
                 <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white transition-colors">
                   <X className="w-6 h-6" />
                 </button>
              </div>

              {/* Toolbar de Correção */}
              <div className="bg-yellow-50 p-2 border-b border-yellow-200 flex justify-between items-center px-6">
                <div className="flex items-center gap-2">
                   <AlertTriangle className="w-4 h-4 text-yellow-600" />
                   <span className="text-xs font-bold text-yellow-800">MODO DE AUDITORIA:</span>
                   <span className="text-xs text-yellow-700 hidden md:inline">Verifique os itens e fornecedores antes de aprovar.</span>
                </div>
                {!isEditingOrder ? (
                  <Button size="sm" variant="secondary" onClick={() => setIsEditingOrder(true)} icon={<Edit2 className="w-3 h-3" />}>
                     Editar Itens
                  </Button>
                ) : (
                  <div className="flex gap-2">
                     <Button size="sm" variant="secondary" onClick={() => setIsEditingOrder(false)}>Cancelar</Button>
                     <Button size="sm" onClick={handleSaveOrderCorrections} icon={<Save className="w-3 h-3" />}>Salvar</Button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto bg-gray-100 p-6 space-y-6">
                 {/* Lista de Itens com Detalhes */}
                 {(isEditingOrder ? editingItems : selectedOrder.items).map((item, idx) => {
                   const fullPart = parts.find(p => p.id === item.partId);
                   const isEditingSupplier = editingPartId === item.partId;

                   if (!fullPart) return (
                     <div key={idx} className="bg-red-50 p-4 rounded text-red-600 border border-red-200">
                        Erro: Dados da peça original (ID: {item.partId}) não encontrados.
                     </div>
                   );

                   const partImage = getPartImage(fullPart);

                   return (
                     <div key={item.partId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
                        {/* Remove Button (Editing Mode) */}
                        {isEditingOrder && (
                          <button 
                            onClick={() => handleRemoveItem(idx)}
                            className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded hover:bg-red-600 hover:text-white z-10"
                            title="Remover Item"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}

                        {/* Cabeçalho do Item */}
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                           <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-700">Item #{idx + 1}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-600 border border-gray-300 uppercase">
                                {fullPart.category}
                              </span>
                           </div>
                           <div className="text-right flex items-center gap-2">
                              <span className="text-xs text-gray-500 uppercase font-bold">Qtd.</span>
                              {isEditingOrder ? (
                                <input 
                                  type="number" 
                                  min="1" 
                                  value={item.quantity} 
                                  onChange={(e) => handleUpdateItemQty(idx, parseInt(e.target.value))}
                                  className="w-16 px-2 py-1 text-sm font-bold text-red-700 bg-white border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                              ) : (
                                <span className="text-xl font-bold text-red-700 bg-red-50 px-3 py-1 rounded border border-red-100">{item.quantity}</span>
                              )}
                           </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                           {/* Coluna 1: Visual e Códigos */}
                           <div className="col-span-1 border-r border-gray-100 pr-4">
                              <div className="aspect-square w-full bg-gray-100 rounded border border-gray-200 mb-4 flex items-center justify-center overflow-hidden h-32 lg:h-auto">
                                 {partImage ? (
                                   <img src={partImage} alt={fullPart.name} className="w-full h-full object-cover" />
                                 ) : (
                                   <div className="flex flex-col items-center text-gray-400">
                                     <ImageOff className="w-8 h-8 mb-1" />
                                     <span className="text-xs">Sem Imagem</span>
                                   </div>
                                 )}
                              </div>
                              <div className="space-y-2">
                                 <div className="flex justify-between border-b border-gray-100 pb-1">
                                    <span className="text-xs text-gray-500 font-bold uppercase">SKU Interno</span>
                                    <span className="text-sm font-mono font-bold text-gray-800">{fullPart.internalCode}</span>
                                 </div>
                                 <div className="flex justify-between border-b border-gray-100 pb-1">
                                    <span className="text-xs text-gray-500 font-bold uppercase">OEM Original</span>
                                    <span className="text-sm font-mono text-gray-600">{fullPart.originalCode}</span>
                                 </div>
                              </div>
                           </div>

                           {/* Coluna 2: Dados Técnicos */}
                           <div className="col-span-1">
                              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <Package className="w-4 h-4 text-red-600" /> Especificações
                              </h4>
                              <h3 className="text-lg font-semibold text-gray-800 mb-2">{fullPart.name}</h3>
                              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                                {fullPart.description}
                              </p>
                              
                              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                 <p className="text-xs text-yellow-800 font-bold mb-1 flex items-center gap-1">
                                   <AlertTriangle className="w-3 h-3" /> Atenção Comprador:
                                 </p>
                                 <p className="text-xs text-yellow-700">
                                   Verifique a compatibilidade do código OEM antes de fechar a compra com o fornecedor alternativo.
                                 </p>
                              </div>
                           </div>

                           {/* Coluna 3: Fornecedor (Editável) */}
                           <div className="col-span-1 pl-4 border-l border-gray-100">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                  <Truck className="w-4 h-4 text-blue-600" /> Dados do Fornecedor
                                </h4>
                                {!isEditingSupplier && (
                                  <button onClick={() => startEditing(fullPart)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold">
                                    <Edit2 className="w-3 h-3" /> Alterar
                                  </button>
                                )}
                              </div>

                              {isEditingSupplier ? (
                                <div className="space-y-3 bg-blue-50 p-4 rounded border border-blue-200 animate-in fade-in">
                                   <Input 
                                      label="Razão Social" 
                                      value={editForm.supplierName} 
                                      onChange={(e) => setEditForm({...editForm, supplierName: e.target.value})}
                                      className="bg-white h-8 text-xs"
                                   />
                                   <Input 
                                      label="CNPJ" 
                                      value={editForm.supplierDoc} 
                                      onChange={(e) => setEditForm({...editForm, supplierDoc: e.target.value})}
                                      className="bg-white h-8 text-xs"
                                   />
                                   <div className="grid grid-cols-2 gap-2">
                                     <Input 
                                        label="Telefone" 
                                        value={editForm.supplierPhone} 
                                        onChange={(e) => setEditForm({...editForm, supplierPhone: e.target.value})}
                                        className="bg-white h-8 text-xs"
                                     />
                                     <Input 
                                        label="Email" 
                                        value={editForm.supplierEmail} 
                                        onChange={(e) => setEditForm({...editForm, supplierEmail: e.target.value})}
                                        className="bg-white h-8 text-xs"
                                     />
                                   </div>
                                   <div className="flex gap-2 mt-2">
                                     <Button size="sm" variant="secondary" onClick={() => setEditingPartId(null)} className="flex-1 text-xs">Cancelar</Button>
                                     <Button size="sm" onClick={() => saveSupplier(fullPart.id)} className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 border-none" icon={<Save className="w-3 h-3"/>}>Salvar</Button>
                                   </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-[10px] uppercase text-gray-500 font-bold">Empresa</p>
                                    <p className="font-medium text-gray-800">{fullPart.supplierName}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase text-gray-500 font-bold">CNPJ</p>
                                    <p className="text-sm text-gray-600 font-mono">{fullPart.supplierDoc || 'Não informado'}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase text-gray-500 font-bold">Contato</p>
                                    <p className="text-sm text-gray-600">{fullPart.supplierEmail}</p>
                                    <p className="text-sm text-gray-600">{fullPart.supplierPhone}</p>
                                  </div>
                                  
                                  <div className="pt-2">
                                    <a href={`mailto:${fullPart.supplierEmail}?subject=Cotação Pedido ${selectedOrder.id}`} className="text-xs flex items-center gap-1 text-blue-600 hover:underline">
                                      <ExternalLink className="w-3 h-3" /> Enviar Email Cotação
                                    </a>
                                  </div>
                                </div>
                              )}
                           </div>
                        </div>
                     </div>
                   );
                 })}
              </div>
              
              <div className="bg-white border-t border-gray-200 p-4 flex justify-end gap-3">
                 <Button variant="secondary" onClick={() => setSelectedOrder(null)}>Fechar Visualização</Button>
                 {selectedOrder.status === OrderStatus.PENDING && (
                   <Button onClick={() => {onUpdateStatus(selectedOrder.id, OrderStatus.QUOTING); setSelectedOrder(null);}}>Iniciar Processo de Cotação</Button>
                 )}
                 {selectedOrder.status === OrderStatus.QUOTING && (
                   <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => {onUpdateStatus(selectedOrder.id, OrderStatus.PURCHASED); setSelectedOrder(null);}}>Finalizar Compra</Button>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};