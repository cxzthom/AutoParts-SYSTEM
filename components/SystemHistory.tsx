
import React, { useState, useMemo } from 'react';
import { SystemLog } from '../types';
import { Search, Filter, ClipboardList, Box, ShoppingCart, Truck, Settings, AlertCircle, Calendar } from 'lucide-react';

interface SystemHistoryProps {
  logs: SystemLog[];
}

export const SystemHistory: React.FC<SystemHistoryProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesModule = filterModule === 'ALL' || log.module === filterModule;
      const matchesAction = filterAction === 'ALL' || log.actionType === filterAction;

      return matchesSearch && matchesModule && matchesAction;
    });
  }, [logs, searchTerm, filterModule, filterAction]);

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'STOCK': return <Box className="w-4 h-4 text-red-600" />;
      case 'ORDERS': return <ClipboardList className="w-4 h-4 text-orange-600" />;
      case 'PURCHASING': return <ShoppingCart className="w-4 h-4 text-blue-600" />;
      case 'FLEET': return <Truck className="w-4 h-4 text-green-600" />;
      case 'SYSTEM': return <Settings className="w-4 h-4 text-purple-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      case 'STATUS_CHANGE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOGIN': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE': return 'Criação';
      case 'UPDATE': return 'Edição';
      case 'DELETE': return 'Exclusão';
      case 'STATUS_CHANGE': return 'Mudança Status';
      case 'LOGIN': return 'Acesso';
      default: return action;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-md shadow-sm border border-gray-300">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-gray-600" /> Auditoria e Histórico Global
            </h2>
            <p className="text-sm text-gray-500">
              Registro completo de movimentações de estoque, pedidos, compras e sistema.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-gray-100 px-3 py-1 rounded border border-gray-200">
            <span>Total de Registros:</span>
            <span className="font-bold text-gray-900">{logs.length}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Pesquisar evento, usuário ou detalhe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500/20 text-sm"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20 appearance-none bg-white"
            >
              <option value="ALL">Todos os Módulos</option>
              <option value="STOCK">Estoque (Peças)</option>
              <option value="ORDERS">Pedidos (Oficina)</option>
              <option value="PURCHASING">Compras</option>
              <option value="FLEET">Frota</option>
              <option value="SYSTEM">Sistema / Acessos</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20 appearance-none bg-white"
            >
              <option value="ALL">Tipos de Ação</option>
              <option value="CREATE">Criação</option>
              <option value="UPDATE">Edição</option>
              <option value="STATUS_CHANGE">Movimentação/Status</option>
              <option value="DELETE">Exclusão</option>
              <option value="LOGIN">Login</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-md border border-gray-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-bold">Data / Hora</th>
                <th className="px-6 py-3 font-bold">Módulo</th>
                <th className="px-6 py-3 font-bold">Ação</th>
                <th className="px-6 py-3 font-bold">Descrição do Evento</th>
                <th className="px-6 py-3 font-bold">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    Nenhum registro encontrado no histórico.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 pl-5">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium text-gray-700">
                        {getModuleIcon(log.module)}
                        <span className="text-xs">{log.module}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wide ${getActionColor(log.actionType)}`}>
                        {getActionLabel(log.actionType)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{log.description}</div>
                      {log.details && (
                        <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 px-2 py-1 rounded inline-block border border-gray-100 group-hover:bg-white group-hover:border-gray-300 transition-colors">
                          {log.details}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       <div className="font-bold text-gray-800 text-xs">{log.actorName}</div>
                       <div className="text-[10px] text-gray-400 uppercase">{log.actorRole}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
