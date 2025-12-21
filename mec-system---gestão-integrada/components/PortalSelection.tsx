
import React, { useEffect, useState } from 'react';
import { Package, ShoppingCart, ArrowRight, Wrench, ShieldCheck, Server, Lock } from 'lucide-react';
import { api } from '../services/api';
// Fix: Import Button component
import { Button } from './Button';

interface PortalSelectionProps {
  onSelectPortal: (role: 'STOCK' | 'PURCHASING' | 'MECHANIC' | 'ADMIN' | 'SALES') => void;
}

export const PortalSelection: React.FC<PortalSelectionProps> = ({ onSelectPortal }) => {
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    api.system.getSettings().then(s => setIsMaintenance(s.maintenanceMode));
  }, []);

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-red-950 flex flex-col items-center justify-center p-6 text-center">
         <div className="bg-white p-12 rounded-lg shadow-2xl max-w-2xl w-full border-t-8 border-red-600">
            <Lock className="w-24 h-24 text-red-600 mx-auto mb-6" />
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">SISTEMA EM MANUTENÇÃO</h1>
            <p className="text-gray-600 text-lg mb-8">
              O MEC System está passando por atualizações críticas. O acesso está temporariamente suspenso.
            </p>
            <Button onClick={() => window.location.reload()}>Verificar Status</Button>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="z-10 text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
          MEC <span className="text-red-600">System</span>
        </h1>
        <p className="text-gray-400 text-sm uppercase tracking-widest font-medium">Módulo Corporativo</p>
      </div>

      <div className="z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1200px] w-full px-4">
        {[
          { id: 'STOCK', label: 'Estoque', icon: <Package/>, desc: 'Inventário e cadastro técnico.', color: 'red' },
          { id: 'PURCHASING', label: 'Compras', icon: <ShoppingCart/>, desc: 'Cotações e pedidos.', color: 'blue' },
          { id: 'MECHANIC', label: 'Oficina', icon: <Wrench/>, desc: 'Diagnóstico e requisição.', color: 'orange' },
          { id: 'ADMIN', label: 'TI / Admin', icon: <ShieldCheck/>, desc: 'Gestão de acessos.', color: 'purple', dark: true }
        ].map(portal => (
          <button 
            key={portal.id}
            onClick={() => onSelectPortal(portal.id as any)}
            className={`group relative bg-white hover:bg-gray-50 rounded-lg p-6 text-left transition-all duration-300 hover:-translate-y-1 shadow-2xl border-t-4 border-gray-200 hover:border-${portal.color}-600 flex flex-col h-full`}
          >
            <div className={`bg-gray-100 w-12 h-12 rounded-md flex items-center justify-center mb-6 group-hover:bg-${portal.color}-600 transition-colors`}>
              {React.cloneElement(portal.icon as any, { className: "w-6 h-6 text-gray-800 group-hover:text-white" })}
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">{portal.label}</h2>
            <p className="text-gray-500 mb-6 text-xs flex-grow">{portal.desc}</p>
            <div className={`flex items-center text-xs font-bold uppercase tracking-wide group-hover:text-${portal.color}-700 mt-auto`}>
              Acessar <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-2 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
