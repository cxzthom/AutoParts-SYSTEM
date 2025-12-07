import React, { useEffect, useState } from 'react';
import { Package, ShoppingCart, ArrowRight, Wrench, ShieldCheck, Server, Lock, AlertTriangle, Download } from 'lucide-react';
import { api } from '../services/api';

interface PortalSelectionProps {
  onSelectPortal: (role: 'STOCK' | 'PURCHASING' | 'MECHANIC' | 'ADMIN' | 'SALES') => void;
  isOutdated?: boolean;
}

export const PortalSelection: React.FC<PortalSelectionProps> = ({ onSelectPortal, isOutdated }) => {
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    api.system.getSettings().then(s => setIsMaintenance(s.maintenanceMode));
    
    const channel = new BroadcastChannel('autoparts_cloud_sync');
    channel.onmessage = (event) => {
      if (event.data.type === 'SYSTEM_LOCKDOWN') {
         api.system.getSettings().then(s => setIsMaintenance(s.maintenanceMode));
      }
    };
    return () => channel.close();
  }, []);

  if (isOutdated) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 relative overflow-hidden text-center">
         <div className="z-10 bg-white p-12 rounded-lg shadow-2xl max-w-2xl w-full border-t-8 border-orange-500">
            <AlertTriangle className="w-24 h-24 text-orange-500 mx-auto mb-6" />
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">ATUALIZAÇÃO OBRIGATÓRIA</h1>
            <p className="text-gray-600 text-lg mb-8">
              Sua versão do aplicativo está desatualizada e não pode acessar o sistema por motivos de segurança e compatibilidade de dados.
            </p>
            <div className="bg-orange-50 p-6 rounded border border-orange-200 mb-8">
              <p className="text-orange-800 font-bold mb-2">Por favor, reinicie o aplicativo.</p>
              <p className="text-sm text-orange-700">A atualização será baixada e instalada automaticamente ao reiniciar.</p>
            </div>
            
            <button 
               onClick={() => (window as any).electronAPI?.restartApp()}
               className="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 text-white rounded font-bold hover:bg-orange-700 transition-colors shadow-lg animate-pulse"
             >
               <Download className="w-5 h-5" /> REINICIAR E ATUALIZAR AGORA
             </button>
         </div>
      </div>
    );
  }

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-red-950 flex flex-col items-center justify-center p-6 relative overflow-hidden text-center">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-striped-brick.png')] opacity-10"></div>
         
         <div className="z-10 bg-white p-12 rounded-lg shadow-2xl max-w-2xl w-full border-t-8 border-red-600">
            <Lock className="w-24 h-24 text-red-600 mx-auto mb-6" />
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">SISTEMA EM MANUTENÇÃO</h1>
            <p className="text-gray-600 text-lg mb-8">
              O MEC System está passando por atualizações críticas de segurança e melhoria de infraestrutura.
              O acesso está temporariamente suspenso para usuários operacionais.
            </p>
            <div className="bg-red-50 p-4 rounded border border-red-200 mb-8">
              <p className="text-red-800 font-bold text-sm">Estimativa de retorno: Em breve</p>
            </div>
            
            <div className="border-t border-gray-200 pt-8">
               <div className="flex justify-center gap-4">
                  <button 
                   onClick={() => window.location.reload()}
                   className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded font-bold hover:bg-gray-50 transition-colors"
                  >
                   Verificar Status
                  </button>
                 <button 
                   onClick={() => onSelectPortal('ADMIN')}
                   className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded font-bold hover:bg-gray-800 transition-colors"
                 >
                   <ShieldCheck className="w-5 h-5" /> Login de Emergência
                 </button>
               </div>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decorativo */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black"></div>
         <div className="grid grid-cols-12 gap-4 w-full h-full opacity-20">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="border-r border-gray-600 h-full transform rotate-12 translate-y-12"></div>
            ))}
         </div>
      </div>

      <div className="z-10 text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
          MEC <span className="text-red-600">System</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base uppercase tracking-widest font-medium">
          Selecione o módulo de acesso corporativo
        </p>
      </div>

      <div className="z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1400px] w-full px-4">
        
        {/* Card Estoque */}
        <button 
          onClick={() => onSelectPortal('STOCK')}
          className="group relative bg-white hover:bg-gray-50 rounded-lg p-6 text-left transition-all duration-300 hover:-translate-y-1 shadow-2xl hover:shadow-red-900/20 border-t-4 border-gray-200 hover:border-red-600 overflow-hidden flex flex-col h-full"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Package className="w-24 h-24 text-gray-900" />
          </div>
          
          <div className="bg-gray-100 w-12 h-12 rounded-md flex items-center justify-center mb-6 group-hover:bg-red-600 transition-colors shadow-sm">
            <Package className="w-6 h-6 text-gray-800 group-hover:text-white transition-colors" />
          </div>
          
          <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-700 transition-colors">
            Estoque
          </h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed flex-grow">
            Controle de inventário, cadastro técnico e requisições.
          </p>
          
          <div className="flex items-center text-xs font-bold text-gray-800 uppercase tracking-wide group-hover:text-red-700 mt-auto">
            Acessar <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-2 transition-transform" />
          </div>
        </button>

        {/* Card Compras e Vendas (Unificado) */}
        <button 
          onClick={() => onSelectPortal('PURCHASING')}
          className="group relative bg-white hover:bg-gray-50 rounded-lg p-6 text-left transition-all duration-300 hover:-translate-y-1 shadow-2xl hover:shadow-blue-900/20 border-t-4 border-gray-200 hover:border-blue-600 overflow-hidden flex flex-col h-full"
        >
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShoppingCart className="w-24 h-24 text-gray-900" />
          </div>

          <div className="bg-gray-100 w-12 h-12 rounded-md flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors shadow-sm">
            <ShoppingCart className="w-6 h-6 text-gray-800 group-hover:text-white transition-colors" />
          </div>
          
          <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
            Compras & Vendas
          </h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed flex-grow">
            Gestão de requisições, PDV e emissão de notas fiscais.
          </p>
          
          <div className="flex items-center text-xs font-bold text-gray-800 uppercase tracking-wide group-hover:text-blue-700 mt-auto">
            Acessar <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-2 transition-transform" />
          </div>
        </button>

        {/* Card Mecânica */}
        <button 
          onClick={() => onSelectPortal('MECHANIC')}
          className="group relative bg-white hover:bg-gray-50 rounded-lg p-6 text-left transition-all duration-300 hover:-translate-y-1 shadow-2xl hover:shadow-orange-900/20 border-t-4 border-gray-200 hover:border-orange-600 overflow-hidden flex flex-col h-full"
        >
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Wrench className="w-24 h-24 text-gray-900" />
          </div>

          <div className="bg-gray-100 w-12 h-12 rounded-md flex items-center justify-center mb-6 group-hover:bg-orange-600 transition-colors shadow-sm">
            <Wrench className="w-6 h-6 text-gray-800 group-hover:text-white transition-colors" />
          </div>
          
          <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-700 transition-colors">
            Oficina
          </h2>
          <p className="text-gray-500 mb-6 text-xs leading-relaxed flex-grow">
            Diagnóstico, consulta técnica e solicitação.
          </p>
          
          <div className="flex items-center text-xs font-bold text-gray-800 uppercase tracking-wide group-hover:text-orange-700 mt-auto">
            Acessar <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-2 transition-transform" />
          </div>
        </button>

        {/* Card TI / Admin */}
        <button 
          onClick={() => onSelectPortal('ADMIN')}
          className="group relative bg-gray-800 hover:bg-gray-700 rounded-lg p-6 text-left transition-all duration-300 hover:-translate-y-1 shadow-2xl hover:shadow-purple-900/20 border-t-4 border-gray-600 hover:border-purple-500 overflow-hidden flex flex-col h-full"
        >
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Server className="w-24 h-24 text-white" />
          </div>

          <div className="bg-gray-900 w-12 h-12 rounded-md flex items-center justify-center mb-6 group-hover:bg-purple-600 transition-colors shadow-sm border border-gray-700">
            <ShieldCheck className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors" />
          </div>
          
          <h2 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
            TI / Governança
          </h2>
          <p className="text-gray-400 mb-6 text-xs leading-relaxed flex-grow">
            Gestão de acessos, usuários e manutenção do sistema.
          </p>
          
          <div className="flex items-center text-xs font-bold text-gray-300 uppercase tracking-wide group-hover:text-purple-400 mt-auto">
            Administrar <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-2 transition-transform" />
          </div>
        </button>

      </div>
      
      <div className="mt-12 text-gray-600 text-xs font-mono">
        v3.0.0 Enterprise Edition - Secure Connection
      </div>
    </div>
  );
};