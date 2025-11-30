
import React, { useState, useEffect } from 'react';
import { SystemSettings, UserRole } from '../types';
import { api } from '../services/api';
import { Button } from './Button';
import { ShieldAlert, Lock, Unlock, Power, Server, Activity, RefreshCw } from 'lucide-react';

interface SystemControlProps {
  currentUserRole: UserRole;
  onNotify: (message: string, type: 'success' | 'error') => void;
}

export const SystemControl: React.FC<SystemControlProps> = ({ currentUserRole, onNotify }) => {
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    lastUpdatedBy: '-',
    lastUpdatedAt: '-'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await api.system.getSettings();
    setSettings(data);
  };

  const toggleMaintenance = async () => {
    if (settings.maintenanceMode) {
       // Turning OFF
       if (confirm("Deseja DESATIVAR o modo de manutenção? O acesso será liberado para todos os usuários.")) {
          setIsLoading(true);
          await api.system.updateSettings({ maintenanceMode: false, lastUpdatedBy: 'Admin' });
          await loadSettings();
          setIsLoading(false);
          onNotify("Sistema liberado com sucesso.", 'success');
       }
    } else {
       // Turning ON
       if (confirm("ATENÇÃO: Ativar o modo de manutenção irá desconectar TODOS os usuários (exceto Admin). Deseja continuar?")) {
          setIsLoading(true);
          await api.system.updateSettings({ maintenanceMode: true, lastUpdatedBy: 'Admin' });
          await loadSettings();
          setIsLoading(false);
          onNotify("Bloqueio de sistema ativado.", 'success');
       }
    }
  };

  if (currentUserRole !== UserRole.ADMIN) {
    return <div className="p-8 text-center text-red-600 font-bold">Acesso Negado. Apenas TI.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg border-l-4 border-purple-500">
        <div className="flex items-center gap-4">
           <div className="bg-gray-800 p-3 rounded-full">
             <Server className="w-8 h-8 text-purple-400" />
           </div>
           <div>
             <h2 className="text-2xl font-bold">Painel de Controle do Sistema</h2>
             <p className="text-gray-400 text-sm">Gerenciamento global de disponibilidade e estado da aplicação.</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card de Status de Manutenção */}
        <div className={`rounded-lg border-2 p-8 flex flex-col items-center text-center shadow-sm transition-colors ${settings.maintenanceMode ? 'bg-red-50 border-red-500' : 'bg-white border-gray-200'}`}>
           <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${settings.maintenanceMode ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              {settings.maintenanceMode ? <Lock className="w-10 h-10" /> : <Activity className="w-10 h-10" />}
           </div>
           
           <h3 className="text-xl font-bold text-gray-900 mb-2">
             {settings.maintenanceMode ? 'SISTEMA BLOQUEADO' : 'SISTEMA OPERACIONAL'}
           </h3>
           
           <p className="text-gray-600 mb-8 text-sm">
             {settings.maintenanceMode 
               ? 'O acesso está restrito apenas a administradores. Usuários comuns estão impedidos de logar.' 
               : 'O sistema está aceitando conexões de todos os departamentos normalmente.'}
           </p>

           <Button 
             onClick={toggleMaintenance}
             isLoading={isLoading}
             className={`w-full py-4 text-lg font-bold shadow-lg ${settings.maintenanceMode ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
             icon={settings.maintenanceMode ? <Unlock className="w-6 h-6"/> : <ShieldAlert className="w-6 h-6"/>}
           >
             {settings.maintenanceMode ? 'LIBERAR ACESSO GERAL' : 'ATIVAR MODO MANUTENÇÃO'}
           </Button>
        </div>

        {/* Card de Informações */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex flex-col">
           <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
             <Activity className="w-5 h-5 text-blue-600" /> Status do Banco de Dados
           </h3>
           
           <div className="space-y-4 flex-1">
             <div className="bg-gray-50 p-4 rounded border border-gray-100">
               <p className="text-xs font-bold text-gray-500 uppercase mb-1">Método de Persistência</p>
               <p className="text-sm font-medium text-gray-800">Local Storage (Navegador) + Mock API</p>
             </div>

             <div className="bg-gray-50 p-4 rounded border border-gray-100">
               <p className="text-xs font-bold text-gray-500 uppercase mb-1">Segurança de Dados</p>
               <p className="text-sm font-medium text-gray-800">
                 Os dados persistem mesmo após atualizações de código, desde que o cache do navegador não seja limpo.
               </p>
             </div>

             <div className="mt-auto bg-yellow-50 p-4 rounded border border-yellow-200">
               <p className="text-xs font-bold text-yellow-800 uppercase mb-1 flex items-center gap-1">
                 <Power className="w-3 h-3" /> Nota de Versão
               </p>
               <p className="text-xs text-yellow-700">
                 Última atualização de estado: {new Date(settings.lastUpdatedAt).toLocaleString()}
               </p>
             </div>
           </div>
           
           <div className="mt-4 pt-4 border-t border-gray-100">
             <Button variant="secondary" className="w-full" onClick={loadSettings} icon={<RefreshCw className="w-4 h-4"/>}>
               Atualizar Status
             </Button>
           </div>
        </div>

      </div>
    </div>
  );
};
