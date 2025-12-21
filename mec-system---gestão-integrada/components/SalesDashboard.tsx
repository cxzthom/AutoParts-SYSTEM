
import React, { useState, useMemo } from 'react';
import { AutoPart, SaleRecord, OrderItem } from '../types';
import { ClientList } from './ClientList';
import { ShoppingCart, Trash2, CheckCircle, DollarSign, FileText, User, Receipt, Plus, Minus, History, X } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

interface SalesDashboardProps {
  parts: AutoPart[];
  onCompleteSale: (sale: SaleRecord) => void;
  salesHistory: SaleRecord[];
  currentUserName: string;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({ parts, onCompleteSale, salesHistory, currentUserName }) => {
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [cart, setCart] = useState<{ part: AutoPart; quantity: number }[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerDoc, setCustomerDoc] = useState('');

  const addToCart = (part: AutoPart) => {
    setCart(prev => {
      const existing = prev.find(item => item.part.id === part.id);
      if (existing) {
        return prev.map(item => item.part.id === part.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { part, quantity: 1 }];
    });
  };

  const updateQuantity = (partId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.part.id === partId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (partId: string) => {
    setCart(prev => prev.filter(item => item.part.id !== partId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + ((item.part.price || 0) * item.quantity), 0);
  };

  const handleFinishSale = () => {
    if (cart.length === 0) {
      alert("O carrinho está vazio.");
      return;
    }
    if (!customerName) {
      alert("Identifique o cliente.");
      return;
    }

    const saleRecord: SaleRecord = {
      id: `NFE-${Math.floor(Math.random() * 100000)}`,
      date: new Date().toISOString(),
      customerName,
      customerDoc,
      items: cart.map(item => ({
        partId: item.part.id,
        partName: item.part.name,
        internalCode: item.part.internalCode,
        quantity: item.quantity
      })),
      totalValue: calculateTotal(),
      sellerName: currentUserName
    };

    onCompleteSale(saleRecord);
    setCart([]);
    setCustomerName('');
    setCustomerDoc('');
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 rounded-lg bg-gray-200 p-1 max-w-md">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${
            activeTab === 'pos' 
              ? 'bg-white text-gray-900 shadow' 
              : 'text-gray-500 hover:bg-gray-300'
          }`}
        >
          <ShoppingCart className="w-4 h-4" /> Frente de Caixa
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${
            activeTab === 'history' 
              ? 'bg-white text-gray-900 shadow' 
              : 'text-gray-500 hover:bg-gray-300'
          }`}
        >
          <History className="w-4 h-4" /> Histórico de Vendas
        </button>
      </div>

      {activeTab === 'pos' ? (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-220px)]">
          {/* Left: Catalog */}
          <div className="flex-1 overflow-y-auto pr-2">
            <ClientList 
              clients={parts} 
              onDelete={() => {}} 
              onCreateOrder={() => {}} 
              viewOnly={true} // Disable selection checkboxes
              showPrice={true} // Enable price display
              onAddToCart={addToCart} // Enable add to cart button
            />
          </div>

          {/* Right: Cart */}
          <div className="w-full lg:w-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col h-full">
            <div className="p-4 bg-gray-900 text-white rounded-t-lg flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <h3 className="font-bold">Carrinho de Compras</h3>
              </div>
              <span className="bg-gray-700 px-2 py-0.5 rounded text-xs font-mono">{cart.length} itens</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-400 py-10 flex flex-col items-center">
                  <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                  <p>Carrinho vazio</p>
                  <p className="text-xs">Adicione itens do catálogo</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.part.id} className="flex flex-col gap-2 border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800 line-clamp-2">{item.part.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{item.part.internalCode}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.part.id)} className="text-gray-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                       <div className="flex items-center gap-3">
                         <button onClick={() => updateQuantity(item.part.id, -1)} className="p-1 bg-white border border-gray-300 rounded hover:bg-gray-100"><Minus className="w-3 h-3"/></button>
                         <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                         <button onClick={() => updateQuantity(item.part.id, 1)} className="p-1 bg-white border border-gray-300 rounded hover:bg-gray-100"><Plus className="w-3 h-3"/></button>
                       </div>
                       <div className="text-right">
                         <p className="text-xs text-gray-500">Unit: R$ {item.part.price?.toFixed(2)}</p>
                         <p className="font-bold text-green-700">R$ {((item.part.price || 0) * item.quantity).toFixed(2)}</p>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
              <div className="space-y-2">
                 <Input 
                   label="Nome do Cliente" 
                   value={customerName} 
                   onChange={(e) => setCustomerName(e.target.value)} 
                   placeholder="Consumidor Final"
                   className="h-8 text-sm"
                   icon={<User className="w-3 h-3"/>}
                 />
                 <Input 
                   label="CPF / CNPJ" 
                   value={customerDoc} 
                   onChange={(e) => setCustomerDoc(e.target.value)} 
                   placeholder="000.000.000-00"
                   className="h-8 text-sm"
                   icon={<FileText className="w-3 h-3"/>}
                 />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                 <span className="text-gray-600 font-bold uppercase text-sm">Total a Pagar</span>
                 <span className="text-2xl font-bold text-green-700">R$ {calculateTotal().toFixed(2)}</span>
              </div>

              <Button 
                onClick={handleFinishSale} 
                className="w-full bg-green-600 hover:bg-green-700 border-none shadow-lg"
                size="lg"
                icon={<Receipt className="w-5 h-5"/>}
              >
                Finalizar Venda
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-md border border-gray-300 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-800">Histórico de Notas Emitidas</h3>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-bold">Nota Fiscal</th>
                    <th className="px-6 py-3 font-bold">Cliente</th>
                    <th className="px-6 py-3 font-bold">Itens</th>
                    <th className="px-6 py-3 font-bold text-right">Valor Total</th>
                    <th className="px-6 py-3 font-bold text-right">Vendedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {salesHistory.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhuma venda registrada.</td></tr>
                  ) : (
                    salesHistory.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                         <td className="px-6 py-4">
                           <div className="font-mono font-bold text-gray-900">{sale.id}</div>
                           <div className="text-xs text-gray-500">{new Date(sale.date).toLocaleString()}</div>
                         </td>
                         <td className="px-6 py-4">
                           <div className="font-bold text-gray-800">{sale.customerName}</div>
                           <div className="text-xs text-gray-500">{sale.customerDoc || 'Não informado'}</div>
                         </td>
                         <td className="px-6 py-4">
                           <div className="text-xs text-gray-600">
                             {sale.items.map(i => `${i.quantity}x ${i.partName}`).join(', ')}
                           </div>
                           <div className="text-[10px] text-gray-400 mt-1">{sale.items.reduce((acc, i) => acc + i.quantity, 0)} itens totais</div>
                         </td>
                         <td className="px-6 py-4 text-right font-bold text-green-700">
                           R$ {sale.totalValue.toFixed(2)}
                         </td>
                         <td className="px-6 py-4 text-right text-xs text-gray-500">
                           {sale.sellerName}
                         </td>
                      </tr>
                    ))
                  )}
                </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  );
};