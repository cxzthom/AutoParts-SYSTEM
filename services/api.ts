import { AutoPart, Order, OrderItem, User, VehicleInfo, MaintenanceRecord, UserRole, OrderStatus, PartCategory, PartStatus, SaleRecord, SystemSettings, CatalogConfig, SystemLog, AssemblyDiagram } from '../types';

// --- CONFIGURAÇÃO ---

// Tenta pegar do .env (Padrão Seguro)
// Usa uma abordagem segura para ler import.meta.env ou process.env (caso esteja em outro ambiente)
const getEnvVar = (key: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || '';
    }
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key] || '';
    }
  } catch (e) {
    console.warn('Erro ao ler variáveis de ambiente:', e);
  }
  return '';
};

// URL de fallback caso a variável de ambiente falhe (Para garantir funcionamento imediato)
const FALLBACK_URL = "";

const GOOGLE_SCRIPT_URL = getEnvVar('VITE_GOOGLE_SCRIPT_URL') || FALLBACK_URL;

if (!GOOGLE_SCRIPT_URL) {
  console.error("ERRO CRÍTICO: VITE_GOOGLE_SCRIPT_URL não definida no arquivo .env");
  console.warn("O sistema rodará em modo OFFLINE/MOCK. As alterações não serão persistidas.");
} else {
  console.log("MEC System: Modo Online Ativo. Conectado ao Backend.");
}

// --- CONFIGURAÇÃO DE VELOCIDADE ---
const LATENCY_MS = 0; 

// --- MOCK CONSTANTS ---
const MOCK_SETTINGS: SystemSettings = { 
  maintenanceMode: false, 
  minAppVersion: '0.0.0', 
  internalSystemPassword: '123', 
  lastUpdatedBy: 'System', 
  lastUpdatedAt: new Date().toISOString() 
};
const MOCK_CATALOG_CONFIG: CatalogConfig = { customBrands: [], customCategories: [], vehicleModels: [] };
const MOCK_VEHICLES_INITIAL: VehicleInfo[] = [];
const MOCK_PARTS: AutoPart[] = [];
const MOCK_DIAGRAMS: AssemblyDiagram[] = [];
const MOCK_USERS: User[] = [
  { id: 'u0', name: 'SysAdmin (TI)', email: 'admin.ti@mecsystem.com', password: '123', role: UserRole.ADMIN, department: 'Tecnologia da Informação' }
];
const MOCK_ORDERS: Order[] = [];

// --- HELPER FUNCTIONS ---
const syncChannel = new BroadcastChannel('autoparts_cloud_sync');

const notifyUpdate = (type: string) => {
  try {
    syncChannel.postMessage({ type, timestamp: Date.now() });
  } catch (e) { console.warn("BroadcastChannel error", e); }
};

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 500) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
        if (res.status >= 500) throw new Error(`Server Error: ${res.status}`);
        return res;
    }
    return res;
  } catch (err) {
    if (retries <= 1) throw err;
    await new Promise(r => setTimeout(r, backoff));
    return fetchWithRetry(url, options, retries - 1, backoff * 1.5);
  }
}

// --- DATABASE LAYER ---
let globalCache: any = null;

const db = {
  fetchFullDB: async (force = false, strict = false) => {
    if (globalCache && !force) return globalCache;

    if (!GOOGLE_SCRIPT_URL) {
      if (!strict) return {}; // Return empty object if offline
      throw new Error("API URL não configurada no arquivo .env.");
    }

    try {
      const res = await fetchWithRetry(`${GOOGLE_SCRIPT_URL}?t=${Date.now()}`, {
        method: 'GET',
        redirect: 'follow',
        credentials: 'omit',
        mode: 'cors'
      });
      
      if (!res.ok) throw new Error(`Erro na resposta do servidor: ${res.status}`);
      
      const data = await res.json();
      globalCache = data;
      return data;
    } catch (e) {
      console.error("ERRO CRÍTICO: Falha ao conectar com Google Drive:", e);
      if (globalCache && !strict) return globalCache;
      throw new Error("SEM CONEXÃO: O sistema exige internet para acessar o banco de dados seguro.");
    }
  },

  get: async <T>(key: string, initialData: T, forceRefresh = false): Promise<T> => {
    try {
      // Se não tiver URL configurada, nem tenta buscar para evitar erros de rede, retorna o mock/vazio
      if (!GOOGLE_SCRIPT_URL) return initialData;
      
      const data = await db.fetchFullDB(forceRefresh);
      return data[key] || initialData;
    } catch (e) {
      console.warn(`Fallback to local/initial data for ${key}`, e);
      return initialData;
    }
  },
  
  set: async (key: string, value: any) => {
    if (!globalCache) globalCache = {};
    globalCache[key] = value;

    if (!GOOGLE_SCRIPT_URL) {
      console.warn("Modo Offline: Dados salvos apenas em memória (serão perdidos ao recarregar). Configure a URL da API no .env.");
      alert("ATENÇÃO: SISTEMA DESCONECTADO.\n\nURL da API não configurada no .env.");
      return;
    }

    try {
      await fetchWithRetry(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        credentials: 'omit',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(globalCache),
      });
    } catch (e) {
      console.error("Erro ao salvar na nuvem:", e);
      alert("ATENÇÃO: Erro de conexão ao salvar dados. Verifique sua internet.");
      throw e;
    }
  },

  getLogs: async (): Promise<SystemLog[]> => {
    return db.get<SystemLog[]>('logs', []);
  },

  addLog: async (log: SystemLog) => {
     const logs = await db.get<SystemLog[]>('logs', []);
     const newLogs = [log, ...logs].slice(0, 200);
     await db.set('logs', newLogs);
  }
};

const createLog = async (
  actionType: SystemLog['actionType'], 
  module: SystemLog['module'], 
  description: string, 
  details?: string
) => {
  const log: SystemLog = {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    actorName: 'Usuário Ativo', 
    actorRole: 'System',
    actionType,
    module,
    description,
    details
  };
  db.addLog(log).catch(console.error);
};

// --- API EXPORT ---
export const api = {
  system: {
    getSettings: async (forceRefresh = false): Promise<SystemSettings> => {
      return db.get<SystemSettings>('settings', MOCK_SETTINGS, forceRefresh);
    },
    updateSettings: async (settings: Partial<SystemSettings>): Promise<SystemSettings> => {
       const current = await db.get<SystemSettings>('settings', MOCK_SETTINGS, true);
       const updated = { ...current, ...settings, lastUpdatedAt: new Date().toISOString() };
       await db.set('settings', updated);
       createLog('SYSTEM', 'SYSTEM', `Configurações de sistema alteradas`, `Manutenção: ${updated.maintenanceMode}`);
       notifyUpdate('SYSTEM_LOCKDOWN');
       return updated;
    }
  },
  logs: {
    list: async (): Promise<SystemLog[]> => db.getLogs(),
    create: async (log: Omit<SystemLog, 'id' | 'timestamp'>) => {
       const newLog = { ...log, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() };
       await db.addLog(newLog);
       notifyUpdate('LOGS_UPDATE');
    }
  },
  auth: {
    login: async (email: string, pass: string): Promise<User | null> => {
      let settings;
      try {
        await db.fetchFullDB(true, true); 
        settings = await db.get<SystemSettings>('settings', MOCK_SETTINGS);
      } catch (e) { 
        settings = MOCK_SETTINGS; 
      }

      const cleanEmail = email.trim().toLowerCase();
      const storedUsers = await db.get<User[]>('users', [], false);
      const allUsers = [...MOCK_USERS, ...storedUsers.filter(su => !MOCK_USERS.find(mu => mu.email === su.email))];
      const user = allUsers.find(u => u.email.toLowerCase() === cleanEmail && u.password === pass);

      if (user && settings.maintenanceMode && user.role !== UserRole.ADMIN) throw new Error("MAINTENANCE_MODE");
      if (user) createLog('LOGIN', 'SYSTEM', `Login efetuado no módulo ${user.department}`, `User: ${user.name}`);

      return user || null;
    }
  },
  catalog: {
     getConfig: async (): Promise<CatalogConfig> => db.get<CatalogConfig>('catalog_config', MOCK_CATALOG_CONFIG),
     updateConfig: async (config: CatalogConfig): Promise<CatalogConfig> => {
       await db.set('catalog_config', config);
       createLog('UPDATE', 'STOCK', 'Configurações de catálogo atualizadas', 'Marcas/Categorias alteradas');
       return config;
     }
  },
  diagrams: {
    list: async (): Promise<AssemblyDiagram[]> => db.get<AssemblyDiagram[]>('diagrams', MOCK_DIAGRAMS),
    create: async (diagram: AssemblyDiagram): Promise<AssemblyDiagram> => {
      const list = await db.get<AssemblyDiagram[]>('diagrams', MOCK_DIAGRAMS);
      const newList = [...list, diagram];
      await db.set('diagrams', newList);
      createLog('CREATE', 'STOCK', `Novo diagrama cadastrado: ${diagram.name}`, '');
      notifyUpdate('DIAGRAMS_UPDATE');
      return diagram;
    },
    update: async (id: string, data: Partial<AssemblyDiagram>): Promise<AssemblyDiagram> => {
      const list = await db.get<AssemblyDiagram[]>('diagrams', MOCK_DIAGRAMS);
      const index = list.findIndex(d => d.id === id);
      if (index === -1) throw new Error("Diagram not found");
      const updated = { ...list[index], ...data };
      list[index] = updated;
      await db.set('diagrams', list);
      createLog('UPDATE', 'STOCK', `Diagrama atualizado: ${updated.name}`, '');
      notifyUpdate('DIAGRAMS_UPDATE');
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      const list = await db.get<AssemblyDiagram[]>('diagrams', MOCK_DIAGRAMS);
      await db.set('diagrams', list.filter(d => d.id !== id));
      createLog('DELETE', 'STOCK', `Diagrama removido ID ${id}`, '');
      notifyUpdate('DIAGRAMS_UPDATE');
    }
  },
  parts: {
    list: async (): Promise<AutoPart[]> => db.get<AutoPart[]>('data', MOCK_PARTS),
    create: async (part: AutoPart): Promise<AutoPart> => {
      const parts = await db.get<AutoPart[]>('data', MOCK_PARTS);
      const newParts = [part, ...parts];
      await db.set('data', newParts);
      createLog('CREATE', 'STOCK', `Nova peça cadastrada: ${part.name}`, `SKU: ${part.internalCode}`);
      notifyUpdate('PARTS_UPDATE');
      return part;
    },
    update: async (id: string, data: Partial<AutoPart>): Promise<AutoPart> => {
      const parts = await db.get<AutoPart[]>('data', MOCK_PARTS);
      const index = parts.findIndex(p => p.id === id);
      if (index === -1) throw new Error("Part not found");
      const updated = { ...parts[index], ...data };
      parts[index] = updated;
      await db.set('data', parts);
      createLog('UPDATE', 'STOCK', `Peça atualizada: ${updated.name}`, '');
      notifyUpdate('PARTS_UPDATE');
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      const parts = await db.get<AutoPart[]>('data', MOCK_PARTS);
      const partName = parts.find(p => p.id === id)?.name || 'Desconhecida';
      const filtered = parts.filter(p => p.id !== id);
      await db.set('data', filtered);
      createLog('DELETE', 'STOCK', `Peça removida: ${partName}`, `ID: ${id}`);
      notifyUpdate('PARTS_UPDATE');
    }
  },
  orders: {
    list: async (): Promise<Order[]> => db.get<Order[]>('orders', MOCK_ORDERS),
    create: async (order: Order): Promise<Order> => {
      const orders = await db.get<Order[]>('orders', MOCK_ORDERS);
      const newOrders = [order, ...orders];
      await db.set('orders', newOrders);
      createLog('CREATE', 'ORDERS', `Novo pedido criado #${order.id}`, `Solicitante: ${order.requesterName}`);
      notifyUpdate('ORDERS_UPDATE');
      return order;
    },
    updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
      const orders = await db.get<Order[]>('orders', MOCK_ORDERS);
      const index = orders.findIndex(o => o.id === id);
      if (index === -1) throw new Error("Order not found");
      const oldStatus = orders[index].status;
      orders[index].status = status;
      await db.set('orders', orders);
      createLog('STATUS_CHANGE', 'ORDERS', `Status do pedido #${id} alterado`, `${oldStatus} -> ${status}`);
      notifyUpdate('ORDERS_UPDATE');
      return orders[index];
    },
    updateItems: async (id: string, items: OrderItem[]): Promise<Order> => {
      const orders = await db.get<Order[]>('orders', MOCK_ORDERS);
      const index = orders.findIndex(o => o.id === id);
      if (index === -1) throw new Error("Order not found");
      orders[index].items = items;
      await db.set('orders', orders);
      createLog('UPDATE', 'PURCHASING', `Itens do pedido #${id} modificados pelo comprador`, '');
      notifyUpdate('ORDERS_UPDATE');
      return orders[index];
    }
  },
  users: {
    list: async (): Promise<User[]> => db.get<User[]>('users', MOCK_USERS),
    create: async (user: User): Promise<User> => {
      const users = await db.get<User[]>('users', MOCK_USERS);
      const newUsers = [...users, user];
      await db.set('users', newUsers);
      createLog('CREATE', 'SYSTEM', `Novo usuário adicionado: ${user.name}`, `Role: ${user.role}`);
      notifyUpdate('USERS_UPDATE');
      return user;
    },
    update: async (id: string, data: Partial<User>): Promise<void> => {
      const users = await db.get<User[]>('users', MOCK_USERS);
      const updated = users.map(u => u.id === id ? { ...u, ...data } : u);
      await db.set('users', updated);
      createLog('UPDATE', 'SYSTEM', `Usuário atualizado: ID ${id}`, '');
      notifyUpdate('USERS_UPDATE');
    },
    delete: async (id: string): Promise<void> => {
      const users = await db.get<User[]>('users', MOCK_USERS);
      await db.set('users', users.filter(u => u.id !== id));
      createLog('DELETE', 'SYSTEM', `Acesso revogado para usuário ID ${id}`, '');
      notifyUpdate('USERS_UPDATE');
    }
  },
  fleet: {
    list: async (): Promise<VehicleInfo[]> => db.get<VehicleInfo[]>('vehicles', MOCK_VEHICLES_INITIAL),
    create: async (vehicle: VehicleInfo): Promise<VehicleInfo> => {
      const fleet = await db.get<VehicleInfo[]>('vehicles', MOCK_VEHICLES_INITIAL);
      const newFleet = [...fleet, vehicle];
      await db.set('vehicles', newFleet);
      createLog('CREATE', 'FLEET', `Veículo adicionado: ${vehicle.prefix}`, `Placa: ${vehicle.plate}`);
      notifyUpdate('FLEET_UPDATE');
      return vehicle;
    },
    delete: async (prefix: string): Promise<void> => {
      const fleet = await db.get<VehicleInfo[]>('vehicles', MOCK_VEHICLES_INITIAL);
      await db.set('vehicles', fleet.filter(v => v.prefix !== prefix));
      createLog('DELETE', 'FLEET', `Veículo removido: ${prefix}`, '');
      notifyUpdate('FLEET_UPDATE');
    }
  },
  history: {
    list: async (): Promise<MaintenanceRecord[]> => db.get<MaintenanceRecord[]>('records', []),
    create: async (record: MaintenanceRecord): Promise<MaintenanceRecord> => {
      const records = await db.get<MaintenanceRecord[]>('records', []);
      const newRecords = [record, ...records];
      await db.set('records', newRecords);
      createLog('CREATE', 'MAINTENANCE', `Manutenção registrada - Carro ${record.vehicleInfo.prefix}`, '');
      notifyUpdate('HISTORY_UPDATE');
      return record;
    }
  },
  sales: {
    list: async (): Promise<SaleRecord[]> => db.get<SaleRecord[]>('sales', []),
    create: async (sale: SaleRecord): Promise<SaleRecord> => {
      const sales = await db.get<SaleRecord[]>('sales', []);
      const newSales = [sale, ...sales];
      await db.set('sales', newSales);
      createLog('CREATE', 'SALES', `Venda realizada #${sale.id}`, `Valor: R$ ${sale.totalValue.toFixed(2)}`);
      notifyUpdate('SALES_UPDATE');
      return sale;
    }
  }
};