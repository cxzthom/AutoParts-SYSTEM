
import React, { useState, useEffect } from 'react';
import { SystemSettings, UserRole } from '../types';
import { api } from '../services/api';
import { Button } from './Button';
import { Input } from './Input';
import { ShieldAlert, Lock, Unlock, Power, Server, Activity, RefreshCw, AlertTriangle } from 'lucide-react';

interface SystemControlProps {
  currentUserRole: UserRole;
  onNotify: (message: string, type: 'success' | 'error') => void;
}

export const SystemControl: React.FC<SystemControlProps> = ({ currentUserRole, onNotify }) => {
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    minAppVersion: '1.0.0',
    lastUpdatedBy: '-',
    lastUpdatedAt: '-'
  });
  const [minVersionInput, setMinVersionInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Force refresh = true para garantir que o Admin veja o estado REAL da nuvem
    const data = await api.system.getSettings(true);
    setSettings(data);
    setMinVersionInput(data.minAppVersion || '1.0.0');
  };

  const toggleMaintenance = async () => {
    const newMode = !settings.maintenanceMode;
    const actionName = newMode ? "ATIVAR" : "DESATIVAR";
    
    if (confirm(`Deseja ${actionName} o modo de manutenção? ${newMode ? 'Usuários serão desconectados.' : 'Acesso será liberado.'}`)) {
       setIsLoading(true);
       try {
         const updated = await api.system.updateSettings({ 
           maintenanceMode: newMode, 
           lastUpdatedBy: 'Admin' 
         });
         
         // Atualiza o estado visual IMEDIATAMENTE com a resposta
         setSettings(updated);
         
         onNotify(`Modo manutenção ${newMode ? 'ATIVADO' : 'DESATIVADO'} com sucesso.`, 'success');
       } catch (error) {
         onNotify("Erro ao alterar modo de manutenção.", 'error');
       } finally {
         setIsLoading(false);
       }
    }
  };

  const updateMinVersion = async () => {
    if (!minVersionInput) return;

    if (confirm(`Alterar a versão mínima para ${minVersionInput}? Usuários com versões anteriores serão bloqueados.`)) {
      setIsLoading(true);
      try {
        const updated = await api.system.updateSettings({ 
          minAppVersion: minVersionInput, 
          lastUpdatedBy: 'Admin' 
        });
        
        // Atualiza o estado visual IMEDIATAMENTE
        setSettings(updated);
        setMinVersionInput(updated.minAppVersion || '');
        
        onNotify("Versão mínima atualizada.", 'success');
      } catch (error) {
        onNotify("Erro ao atualizar versão.", 'error');
      } finally {
        setIsLoading(false);
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

        <div className="flex flex-col gap-6">
          {/* Card de Informações */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex flex-col flex-1">
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
                   Os dados persistem na nuvem. O cache local é usado para performance.
                 </p>
               </div>

               <div className="mt-auto bg-yellow-50 p-4 rounded border border-yellow-200">
                 <p className="text-xs font-bold text-yellow-800 uppercase mb-1 flex items-center gap-1">
                   <Power className="w-3 h-3" /> Nota de Versão
                 </p>
                 <p className="text-xs text-yellow-700">
                   Última atualização de estado: {settings.lastUpdatedAt && settings.lastUpdatedAt !== '-' ? new Date(settings.lastUpdatedAt).toLocaleString() : 'N/A'}
                 </p>
                 <p className="text-xs text-yellow-700 font-bold mt-1">
                   Por: {settings.lastUpdatedBy}
                 </p>
               </div>
             </div>
             
             <div className="mt-4 pt-4 border-t border-gray-100">
               <Button variant="secondary" className="w-full" onClick={loadSettings} icon={<RefreshCw className="w-4 h-4"/>}>
                 Forçar Atualização de Status
               </Button>
             </div>
          </div>

          {/* Controle de Versão */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
             <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
               <AlertTriangle className="w-5 h-5 text-orange-600" /> Controle de Versão (Enforce Update)
             </h3>
             <div className="space-y-4">
                <p className="text-sm text-gray-600">Defina a versão mínima do aplicativo (exe) para bloquear acessos desatualizados.</p>
                <div className="flex gap-2">
                  <Input 
                    label="Versão Mínima (SemVer)" 
                    value={minVersionInput} 
                    onChange={e => setMinVersionInput(e.target.value)} 
                    placeholder="1.0.0"
                    className="flex-1"
                  />
                  <div className="flex items-end">
                    <Button onClick={updateMinVersion} isLoading={isLoading}>Salvar</Button>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Atual: {settings.minAppVersion || 'Não definido'}
                </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
