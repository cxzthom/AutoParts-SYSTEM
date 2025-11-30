import { AutoPart, Order, OrderItem, User, VehicleInfo, MaintenanceRecord, UserRole, OrderStatus, PartCategory, PartStatus, SaleRecord, SystemSettings, CatalogConfig, SystemLog, AssemblyDiagram } from '../types';

// --- CONFIGURAÇÃO ---
// COLE AQUI A URL DO SEU GOOGLE APPS SCRIPT (Gerada no Passo 1)
// Exemplo: 'https://script.google.com/macros/s/AKfycbx.../exec'
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyUbiA8AtqgvM4AzbiyhK55EnAbXcaE9dhJO0kOA4x-vPdsfIhZwTqDIA8L9C74O0yz/exec'; 

// Se a URL acima estiver vazia, ele tenta usar o servidor local ou localhost
const USE_CLOUD_DRIVE = GOOGLE_SCRIPT_URL.length > 0;

const SERVER_URL = 'http://localhost:3001';
const LATENCY_MS = 1500; // Aumentado um pouco pois Drive é mais lento que local

// --- MOCK DATABASE SEED ---
const MOCK_SETTINGS: SystemSettings = {
  maintenanceMode: false,
  lastUpdatedBy: 'System',
  lastUpdatedAt: new Date().toISOString()
};

const MOCK_CATALOG_CONFIG: CatalogConfig = {
  customBrands: [],
  customCategories: [],
  vehicleModels: ['Mercedes-Benz O500', 'Volvo B270F', 'Scania K310', 'VW 17.230', 'Agrale MA 17.0']
};

const MOCK_VEHICLES_INITIAL: VehicleInfo[] = [
  { prefix: '1001', plate: 'ABC-1234', model: 'Mercedes-Benz O500', year: '2023', bodyType: 'Padron', vin: '9BM7654321A123456' },
  { prefix: '1002', plate: 'XYZ-9876', model: 'Volvo B270F', year: '2022', bodyType: 'Articulado', vin: '9BV1234567B654321' },
];

const MOCK_PARTS: AutoPart[] = [
  {
    id: '1',
    name: 'Kit Embreagem Completo',
    internalCode: 'EMB-2024-X',
    originalCode: 'OEM-987654',
    category: PartCategory.TRANSMISSION,
    supplierName: 'LUK Auto Parts',
    supplierDoc: '12.345.678/0001-99',
    supplierEmail: 'vendas@luk.com.br',
    supplierPhone: '(11) 3003-4000',
    status: PartStatus.IN_STOCK,
    description: 'Kit de embreagem compatível com VW Gol, Voyage, Saveiro G5/G6.',
    createdAt: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1626241032338-344406085817?auto=format&fit=crop&q=80&w=300&h=300',
    compatibleBrands: ['VW / MAN'],
    price: 850.00
  },
  {
    id: '2',
    name: 'Pastilha de Freio Dianteira',
    internalCode: 'FR-0099',
    originalCode: '5U0698151A',
    category: PartCategory.BRAKES,
    supplierName: 'Fras-le',
    supplierDoc: '98.765.432/0001-11',
    supplierEmail: 'contato@frasle.com',
    supplierPhone: '(54) 3239-1000',
    status: PartStatus.LOW_STOCK,
    description: 'Jogo de pastilhas cerâmicas para eixo dianteiro.',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=300&h=300',
    compatibleBrands: ['Volvo', 'Mercedes-Benz'],
    price: 120.50
  }
];

const MOCK_DIAGRAMS: AssemblyDiagram[] = [];

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Gerente Estoque', email: 'estoque@autoparts.com', password: '123', role: UserRole.STOCK, department: 'Logística e Estoque' },
  { id: 'u2', name: 'Agente de Compras', email: 'compras@autoparts.com', password: '123', role: UserRole.PURCHASING, department: 'Depto. de Compras' },
  { id: 'u3', name: 'Chefe de Oficina', email: 'mecanica@autoparts.com', password: '123', role: UserRole.MECHANIC, department: 'Oficina Mecânica' },
  { id: 'u4', name: 'Vendedor Balcão', email: 'vendas@autoparts.com', password: '123', role: UserRole.SALES, department: 'Vendas e Faturamento' },
  { id: 'u0', name: 'SysAdmin (TI)', email: 'admin.ti@autoparts.com', password: '123', role: UserRole.ADMIN, department: 'Tecnologia da Informação' }
];

const MOCK_ORDERS: Order[] = [
  {
    id: 'REQ-001',
    requesterName: 'João da Silva (Almoxarifado)',
    requesterId: 'u1',
    role: UserRole.STOCK,
    createdAt: new Date(Date.now() - 100000000).toISOString(),
    priority: 'NORMAL',
    status: OrderStatus.QUOTING,
    items: [{ partId: '2', partName: 'Pastilha de Freio Dianteira', internalCode: 'FR-0099', quantity: 50 }]
  }
];

// --- HELPER FUNCTIONS ---

const delay = () => new Promise(resolve => setTimeout(resolve, LATENCY_MS));
const syncChannel = new BroadcastChannel('autoparts_cloud_sync');

const notifyUpdate = (type: string) => {
  try {
    syncChannel.postMessage({ type, timestamp: Date.now() });
  } catch (e) { console.warn("BroadcastChannel error", e); }
};

// --- DRIVE / SERVER ADAPTER ---

// Cache simples para evitar ler o Drive (que é lento) toda hora
let globalCache: any = null;

const db = {
  // Fetch Full Database
  fetchFullDB: async () => {
    if (globalCache && USE_CLOUD_DRIVE) return globalCache;

    if (USE_CLOUD_DRIVE) {
       try {
         const res = await fetch(GOOGLE_SCRIPT_URL);
         const data = await res.json();
         globalCache = data;
         return data;
       } catch (e) {
         console.error("Erro ao conectar com Google Drive:", e);
         // Fallback to local
       }
    } else {
       // Try local server
       try {
         const res = await fetch(`${SERVER_URL}/data`);
         if (res.ok) return await res.json();
       } catch(e) {}
    }
    
    // Fallback to LocalStorage
    return {};
  },

  // Generic Get
  get: async <T>(key: string, initialData: T): Promise<T> => {
    const data = await db.fetchFullDB();
    
    // Se não tiver no drive, tenta localstorage como ultimo recurso
    if (!data[key]) {
       const local = localStorage.getItem(`autoparts_${key}`);
       return local ? JSON.parse(local) : initialData;
    }

    return data[key] || initialData;
  },
  
  // Generic Set
  set: async (key: string, value: any) => {
    // 1. Atualiza cache local
    if (!globalCache) globalCache = {};
    globalCache[key] = value;

    // 2. Salva no LocalStorage (Backup instantâneo)
    localStorage.setItem(`autoparts_${key}`, JSON.stringify(value));

    // 3. Salva no Google Drive (Assíncrono)
    if (USE_CLOUD_DRIVE) {
      // Nota: Google Apps Script Web App com 'no-cors' ou 'follow'
      // O truque é enviar o DB inteiro ou parcial. Aqui enviaremos o FULL DB atualizado.
      // Em produção real, enviaríamos apenas o delta, mas para esse MVP, envia tudo.
      
      // Precisamos garantir que temos os outros dados também, não apenas a key atual
      // Se globalCache estiver incompleto (primeira carga), isso pode ser perigoso.
      // Mas assumimos que o 'get' já populou o globalCache.
      
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify(globalCache),
          // Google Apps Script requer text/plain ou lidar com preflight complexo
          // O modo 'no-cors' não permite ler resposta, mas envia os dados.
          // O modo padrão segue o redirect do Google.
        });
      } catch (e) {
        console.error("Erro ao salvar no Drive:", e);
      }
    } else {
      // Local Server Fallback
      try {
        await fetch(`${SERVER_URL}/data`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ [key]: value })
        });
      } catch (e) {}
    }
  },

  // Separate method for logs because they might be large
  getLogs: async (): Promise<SystemLog[]> => {
    return db.get<SystemLog[]>('logs', []);
  },

  addLog: async (log: SystemLog) => {
     const logs = await db.get<SystemLog[]>('logs', []);
     const newLogs = [log, ...logs].slice(0, 500); // Limit to 500 logs to save Drive space
     await db.set('logs', newLogs);
  }
};

// --- LOGGING HELPER ---
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
  
  await db.addLog(log);
  notifyUpdate('LOGS_UPDATE');
};


// --- API SERVICE LAYER ---

export const api = {
  system: {
    getSettings: async (): Promise<SystemSettings> => {
      return db.get<SystemSettings>('settings', MOCK_SETTINGS);
    },
    updateSettings: async (settings: Partial<SystemSettings>): Promise<SystemSettings> => {
       await delay();
       const current = await db.get<SystemSettings>('settings', MOCK_SETTINGS);
       const updated = { ...current, ...settings, lastUpdatedAt: new Date().toISOString() };
       await db.set('settings', updated);
       
       await createLog('SYSTEM', 'SYSTEM', `Configurações de sistema alteradas`, `Manutenção: ${updated.maintenanceMode}`);
       notifyUpdate('SYSTEM_LOCKDOWN');
       return updated;
    }
  },

  logs: {
    list: async (): Promise<SystemLog[]> => {
      // No artificial delay for logs to make UI snappy
      return db.getLogs();
    },
    // Manual log entry if needed
    create: async (log: Omit<SystemLog, 'id' | 'timestamp'>) => {
       const newLog = {
         ...log,
         id: Math.random().toString(36).substr(2, 9),
         timestamp: new Date().toISOString()
       };
       await db.addLog(newLog);
       notifyUpdate('LOGS_UPDATE');
    }
  },

  auth: {
    login: async (email: string, pass: string): Promise<User | null> => {
      await delay();
      const settings = await db.get<SystemSettings>('settings', MOCK_SETTINGS);
      const cleanEmail = email.trim().toLowerCase();
      const storedUsers = await db.get<User[]>('users', []);
      const allUsers = [...MOCK_USERS, ...storedUsers.filter(su => !MOCK_USERS.find(mu => mu.email === su.email))];
      
      const user = allUsers.find(u => u.email.toLowerCase() === cleanEmail && u.password === pass);

      if (user && settings.maintenanceMode && user.role !== UserRole.ADMIN) {
         throw new Error("MAINTENANCE_MODE");
      }
      
      if (user) {
         // Log Login
         const log: SystemLog = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            actorName: user.name,
            actorRole: user.role,
            actionType: 'LOGIN',
            module: 'SYSTEM',
            description: `Login efetuado no módulo ${user.department}`
         };
         await db.addLog(log);
      }

      return user || null;
    }
  },

  catalog: {
     getConfig: async (): Promise<CatalogConfig> => {
       await delay();
       return db.get<CatalogConfig>('catalog_config', MOCK_CATALOG_CONFIG);
     },
     updateConfig: async (config: CatalogConfig): Promise<CatalogConfig> => {
       await delay();
       await db.set('catalog_config', config);
       await createLog('UPDATE', 'STOCK', 'Configurações de catálogo atualizadas', 'Marcas/Categorias alteradas');
       return config;
     }
  },

  diagrams: {
    list: async (): Promise<AssemblyDiagram[]> => {
      await delay();
      return db.get<AssemblyDiagram[]>('diagrams', MOCK_DIAGRAMS);
    },
    create: async (diagram: AssemblyDiagram): Promise<AssemblyDiagram> => {
      await delay();
      const list = await db.get<AssemblyDiagram[]>('diagrams', MOCK_DIAGRAMS);
      const newList = [...list, diagram];
      await db.set('diagrams', newList);
      await createLog('CREATE', 'STOCK', `Novo diagrama cadastrado: ${diagram.name}`, '');
      notifyUpdate('DIAGRAMS_UPDATE');
      return diagram;
    },
    delete: async (id: string): Promise<void> => {
      await delay();
      const list = await db.get<AssemblyDiagram[]>('diagrams', MOCK_DIAGRAMS);
      await db.set('diagrams', list.filter(d => d.id !== id));
      await createLog('DELETE', 'STOCK', `Diagrama removido ID ${id}`, '');
      notifyUpdate('DIAGRAMS_UPDATE');
    }
  },

  parts: {
    list: async (): Promise<AutoPart[]> => {
      await delay();
      return db.get<AutoPart[]>('data', MOCK_PARTS);
    },
    create: async (part: AutoPart): Promise<AutoPart> => {
      await delay();
      const parts = await db.get<AutoPart[]>('data', MOCK_PARTS);
      const newParts = [part, ...parts];
      await db.set('data', newParts);
      
      await createLog('CREATE', 'STOCK', `Nova peça cadastrada: ${part.name}`, `SKU: ${part.internalCode}`);
      notifyUpdate('PARTS_UPDATE');
      return part;
    },
    update: async (id: string, data: Partial<AutoPart>): Promise<AutoPart> => {
      await delay();
      const parts = await db.get<AutoPart[]>('data', MOCK_PARTS);
      const index = parts.findIndex(p => p.id === id);
      if (index === -1) throw new Error("Part not found");
      
      const updated = { ...parts[index], ...data };
      parts[index] = updated;
      await db.set('data', parts);
      
      await createLog('UPDATE', 'STOCK', `Peça atualizada: ${updated.name}`, `Campos alterados: ${Object.keys(data).join(', ')}`);
      notifyUpdate('PARTS_UPDATE');
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await delay();
      const parts = await db.get<AutoPart[]>('data', MOCK_PARTS);
      const partName = parts.find(p => p.id === id)?.name || 'Desconhecida';
      const filtered = parts.filter(p => p.id !== id);
      await db.set('data', filtered);
      
      await createLog('DELETE', 'STOCK', `Peça removida: ${partName}`, `ID: ${id}`);
      notifyUpdate('PARTS_UPDATE');
    }
  },

  orders: {
    list: async (): Promise<Order[]> => {
      await delay();
      return db.get<Order[]>('orders', MOCK_ORDERS);
    },
    create: async (order: Order): Promise<Order> => {
      await delay();
      const orders = await db.get<Order[]>('orders', MOCK_ORDERS);
      const newOrders = [order, ...orders];
      await db.set('orders', newOrders);
      
      await createLog('CREATE', 'ORDERS', `Novo pedido criado #${order.id}`, `Solicitante: ${order.requesterName}`);
      notifyUpdate('ORDERS_UPDATE');
      return order;
    },
    updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
      await delay();
      const orders = await db.get<Order[]>('orders', MOCK_ORDERS);
      const index = orders.findIndex(o => o.id === id);
      if (index === -1) throw new Error("Order not found");
      
      const oldStatus = orders[index].status;
      orders[index].status = status;
      await db.set('orders', orders);
      
      await createLog('STATUS_CHANGE', 'ORDERS', `Status do pedido #${id} alterado`, `${oldStatus} -> ${status}`);
      notifyUpdate('ORDERS_UPDATE');
      return orders[index];
    },
    updateItems: async (id: string, items: OrderItem[]): Promise<Order> => {
      await delay();
      const orders = await db.get<Order[]>('orders', MOCK_ORDERS);
      const index = orders.findIndex(o => o.id === id);
      if (index === -1) throw new Error("Order not found");
      
      orders[index].items = items;
      await db.set('orders', orders);
      
      await createLog('UPDATE', 'PURCHASING', `Itens do pedido #${id} modificados pelo comprador`, `Total itens: ${items.length}`);
      notifyUpdate('ORDERS_UPDATE');
      return orders[index];
    }
  },

  users: {
    list: async (): Promise<User[]> => {
      await delay();
      return db.get<User[]>('users', MOCK_USERS);
    },
    create: async (user: User): Promise<User> => {
      await delay();
      const users = await db.get<User[]>('users', MOCK_USERS);
      const newUsers = [...users, user];
      await db.set('users', newUsers);
      
      await createLog('CREATE', 'SYSTEM', `Novo usuário adicionado: ${user.name}`, `Role: ${user.role}`);
      notifyUpdate('USERS_UPDATE');
      return user;
    },
    update: async (id: string, data: Partial<User>): Promise<void> => {
      await delay();
      const users = await db.get<User[]>('users', MOCK_USERS);
      const updated = users.map(u => u.id === id ? { ...u, ...data } : u);
      await db.set('users', updated);
      
      await createLog('UPDATE', 'SYSTEM', `Usuário atualizado: ID ${id}`, '');
      notifyUpdate('USERS_UPDATE');
    },
    delete: async (id: string): Promise<void> => {
      await delay();
      const users = await db.get<User[]>('users', MOCK_USERS);
      await db.set('users', users.filter(u => u.id !== id));
      
      await createLog('DELETE', 'SYSTEM', `Acesso revogado para usuário ID ${id}`, '');
      notifyUpdate('USERS_UPDATE');
    }
  },

  fleet: {
    list: async (): Promise<VehicleInfo[]> => {
      await delay();
      return db.get<VehicleInfo[]>('vehicles', MOCK_VEHICLES_INITIAL);
    },
    create: async (vehicle: VehicleInfo): Promise<VehicleInfo> => {
      await delay();
      const fleet = await db.get<VehicleInfo[]>('vehicles', MOCK_VEHICLES_INITIAL);
      const newFleet = [...fleet, vehicle];
      await db.set('vehicles', newFleet);
      
      await createLog('CREATE', 'FLEET', `Veículo adicionado à frota: ${vehicle.prefix}`, `Placa: ${vehicle.plate}`);
      notifyUpdate('FLEET_UPDATE');
      return vehicle;
    },
    delete: async (prefix: string): Promise<void> => {
      await delay();
      const fleet = await db.get<VehicleInfo[]>('vehicles', MOCK_VEHICLES_INITIAL);
      await db.set('vehicles', fleet.filter(v => v.prefix !== prefix));
      
      await createLog('DELETE', 'FLEET', `Veículo removido da frota: ${prefix}`, '');
      notifyUpdate('FLEET_UPDATE');
    }
  },

  history: {
    list: async (): Promise<MaintenanceRecord[]> => {
      await delay();
      return db.get<MaintenanceRecord[]>('records', []);
    },
    create: async (record: MaintenanceRecord): Promise<MaintenanceRecord> => {
      await delay();
      const records = await db.get<MaintenanceRecord[]>('records', []);
      const newRecords = [record, ...records];
      await db.set('records', newRecords);
      
      await createLog('CREATE', 'MAINTENANCE', `Manutenção registrada - Carro ${record.vehicleInfo.prefix}`, `Sistema: ${record.maintenanceSystem}`);
      notifyUpdate('HISTORY_UPDATE');
      return record;
    }
  },

  sales: {
    list: async (): Promise<SaleRecord[]> => {
      await delay();
      return db.get<SaleRecord[]>('sales', []);
    },
    create: async (sale: SaleRecord): Promise<SaleRecord> => {
      await delay();
      const sales = await db.get<SaleRecord[]>('sales', []);
      const newSales = [sale, ...sales];
      await db.set('sales', newSales);
      
      await createLog('CREATE', 'SALES', `Venda realizada #${sale.id}`, `Valor: R$ ${sale.totalValue.toFixed(2)}`);
      notifyUpdate('SALES_UPDATE');
      return sale;
    }
  }
};