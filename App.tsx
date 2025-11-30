import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Package, PlusCircle, Menu, X, Car, LogOut, ShoppingCart, UserCircle, Wrench, Users, ShieldCheck, ClipboardList, Bus, Loader2, Cloud, RefreshCw, DollarSign, Server, FileClock, Map, Download } from 'lucide-react';
import { AutoPart, Tab, UserRole, Order, OrderStatus, OrderItem, User, MaintenanceRecord, VehicleInfo, MaintenanceSystem, SaleRecord, SystemLog, AssemblyDiagram } from './types';
import { api } from './services/api';

import { ClientList } from './components/ClientList';
import { ClientForm } from './components/ClientForm';
import { LoginPage } from './components/LoginPage';
import { PortalSelection } from './components/PortalSelection';
import { PurchasingDashboard } from './components/PurchasingDashboard';
import { UserManagement } from './components/UserManagement';
import { MechanicDashboard } from './components/MechanicDashboard';
import { MaintenanceHistory } from './components/MaintenanceHistory';
import { FleetManagement } from './components/FleetManagement';
import { SystemControl } from './components/SystemControl';
import { CatalogManagement } from './components/CatalogManagement';
import { SystemHistory } from './components/SystemHistory'; 
import { DiagramEditor } from './components/DiagramEditor';
import { showNotification, ToastContainer } from './components/Toast';

export default function App() {
  // Navigation & Auth State
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data State
  const [parts, setParts] = useState<AutoPart[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleInfo[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]); 
  const [diagrams, setDiagrams] = useState<AssemblyDiagram[]>([]);
  
  // Dynamic Configs
  const [catalogConfig, setCatalogConfig] = useState({ customBrands: [] as string[], customCategories: [] as string[], vehicleModels: [] as string[] });

  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // State para preencher o formulário quando vindo de uma solicitação
  const [registrationPrefill, setRegistrationPrefill] = useState<{description: string} | undefined>(undefined);

  // Ref para armazenar o estado anterior dos pedidos e comparar mudanças
  const prevOrdersRef = useRef<Order[]>([]);

  // Centralized Data Fetching
  const loadCloudData = useCallback(async (silent = false) => {
    if (!currentRole) return; 
    
    const token = sessionStorage.getItem('autoparts_session');
    if (!token && !silent) {
       if (!isAuthenticated) return;
    }

    if (!silent) setIsLoading(true);
    else setIsSyncing(true);

    try {
      const [p, o, u, v, r, s, c, l, d] = await Promise.all([
        api.parts.list(),
        api.orders.list(),
        api.users.list(),
        api.fleet.list(),
        api.history.list(),
        api.sales.list(),
        api.catalog.getConfig(),
        api.logs.list(),
        api.diagrams.list()
      ]);
      setParts(p);
      
      // Lógica de Notificação de Mudança de Status
      if (prevOrdersRef.current.length > 0 && currentUser) {
        o.forEach(newOrder => {
          const oldOrder = prevOrdersRef.current.find(old => old.id === newOrder.id);
          
          if (oldOrder && oldOrder.status !== newOrder.status) {
            const isMyOrder = newOrder.requesterId === currentUser.id;
            
            if (isMyOrder) {
               if (newOrder.status === OrderStatus.DELIVERED) {
                 showNotification(`✅ Pedido #${newOrder.id} disponível no estoque!`, 'success');
               } else if (newOrder.status === OrderStatus.CANCELED) {
                 showNotification(`❌ Pedido #${newOrder.id} foi cancelado/recusado.`, 'error');
               } else if (newOrder.status === OrderStatus.QUOTING) {
                 showNotification(`📋 Pedido #${newOrder.id} entrou em processo de compra.`, 'info');
               }
            }
          }
        });
      }

      prevOrdersRef.current = o;
      setOrders(o);
      
      setUsers(u);
      setVehicles(v);
      setMaintenanceRecords(r);
      setSales(s);
      setCatalogConfig(c);
      setLogs(l);
      setDiagrams(d);
    } catch (error) {
      console.error("Failed to sync cloud data", error);
    } finally {
      if (!silent) setIsLoading(false);
      setIsSyncing(false);
    }
  }, [currentRole, isAuthenticated, currentUser]);

  // Initial Data Fetch & Live Sync Subscription
  useEffect(() => {
    if (isAuthenticated) {
        loadCloudData();
    } else {
        setIsInitialLoad(false);
    }

    const channel = new BroadcastChannel('autoparts_cloud_sync');
    channel.onmessage = (event) => {
      if (event.data.type === 'SYSTEM_LOCKDOWN') {
          checkMaintenance();
      }
      if (isAuthenticated) loadCloudData(true); 
    };

    const handleStorageChange = (event: StorageEvent) => {
       if (event.key && event.key.startsWith('autoparts_')) {
          if (isAuthenticated) loadCloudData(true);
       }
    };
    
    const handleFocus = () => {
      if (isAuthenticated) {
          loadCloudData(true);
      }
    };
    
    const checkMaintenance = () => {
      // FORCE REFRESH: Passa true para garantir que estamos vendo o status REAL da nuvem
      api.system.getSettings(true).then(settings => {
           if (settings.maintenanceMode && currentRole !== UserRole.ADMIN && isAuthenticated) {
             handleLogout();
             alert("O sistema entrou em modo de manutenção. Você foi desconectado.");
           }
      });
    };
    
    // Configuração de Atualizações Automáticas (Electron)
    if ((window as any).electronAPI) {
      (window as any).electronAPI.onUpdateAvailable(() => {
        showNotification('Nova atualização disponível. Baixando em segundo plano...', 'info');
      });

      (window as any).electronAPI.onUpdateDownloaded(() => {
        if (confirm('Nova atualização baixada. Deseja reiniciar agora para instalar?')) {
          (window as any).electronAPI.restartApp();
        }
      });
    }

    const maintenanceInterval = setInterval(checkMaintenance, 5000); 

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    let idleTimer: ReturnType<typeof setTimeout>;
    const resetIdle = () => {
        clearTimeout(idleTimer);
        if (isAuthenticated) {
            idleTimer = setTimeout(() => {
                showNotification('Sessão expirada por inatividade.', 'info');
                handleLogout();
            }, 15 * 60 * 1000); 
        }
    };
    
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keypress', resetIdle);

    return () => {
      channel.close();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keypress', resetIdle);
      clearTimeout(idleTimer);
      clearInterval(maintenanceInterval);
    };
  }, [isAuthenticated, loadCloudData, currentRole]);

  // Auth Handlers
  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    const user = await api.auth.login(email, pass);
    
    if (user) {
      if (user.role === currentRole) {
        sessionStorage.setItem('autoparts_session', `token_${Math.random().toString(36)}`);
        
        setIsAuthenticated(true);
        setCurrentUser(user);
        
        if (currentRole === UserRole.PURCHASING) setActiveTab('orders');
        else if (currentRole === UserRole.ADMIN) setActiveTab('users');
        else if (currentRole === UserRole.MECHANIC) setActiveTab('mechanic_dashboard');
        else setActiveTab('list');
        
        showNotification(`Bem-vindo, ${user.name}!`, 'success');
        return true;
      }
    }
    return false;
  };

  const handleLogout = () => {
    sessionStorage.removeItem('autoparts_session');
    setIsAuthenticated(false);
    setCurrentRole(null);
    setCurrentUser(null);
    setActiveTab('list');
    setRegistrationPrefill(undefined);
    prevOrdersRef.current = [];
  };

  const handleSelectPortal = (role: 'STOCK' | 'PURCHASING' | 'MECHANIC' | 'ADMIN' | 'SALES') => {
    switch(role) {
      case 'STOCK': setCurrentRole(UserRole.STOCK); break;
      case 'PURCHASING': setCurrentRole(UserRole.PURCHASING); break;
      case 'MECHANIC': setCurrentRole(UserRole.MECHANIC); break;
      case 'ADMIN': setCurrentRole(UserRole.ADMIN); break;
      case 'SALES': setCurrentRole(UserRole.SALES); break;
    }
  };

  // --- CRUD Operations ---
  const handleAddUser = async (userData: Omit<User, 'id'>) => {
    setIsLoading(true);
    const newUser: User = { ...userData, id: Math.random().toString(36).substr(2, 9) };
    await api.users.create(newUser);
    await loadCloudData(true);
    setIsLoading(false);
    showNotification('Usuário adicionado com sucesso.', 'success');
  };

  const handleUpdateUser = async (id: string, updatedData: Partial<User>) => {
    setIsLoading(true);
    await api.users.update(id, updatedData);
    await loadCloudData(true);
    setIsLoading(false);
    showNotification('Usuário atualizado.', 'success');
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Tem certeza que deseja remover o acesso deste usuário?')) {
      setIsLoading(true);
      await api.users.delete(id);
      await loadCloudData(true);
      setIsLoading(false);
      showNotification('Acesso revogado.', 'success');
    }
  };

  const handleAddVehicle = async (vehicle: VehicleInfo) => {
    setIsLoading(true);
    await api.fleet.create(vehicle);
    await loadCloudData(true);
    setIsLoading(false);
    showNotification('Veículo adicionado à frota.', 'success');
  };

  const handleDeleteVehicle = async (prefix: string) => {
    if (confirm(`Remover veículo ${prefix} da frota?`)) {
      setIsLoading(true);
      await api.fleet.delete(prefix);
      await loadCloudData(true);
      setIsLoading(false);
      showNotification('Veículo removido.', 'success');
    }
  };

  const handleSavePart = async (newPartData: Omit<AutoPart, 'id' | 'createdAt'>) => {
    setIsLoading(true);
    const newPart: AutoPart = {
      ...newPartData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    await api.parts.create(newPart);
    await loadCloudData(true);
    setIsLoading(false);
    setActiveTab('list');
    setRegistrationPrefill(undefined);
    showNotification('Peça cadastrada no catálogo.', 'success');
  };

  const handleDeletePart = async (id: string) => {
    if (currentRole !== UserRole.STOCK && currentRole !== UserRole.ADMIN) return; 
    if (confirm('ATENÇÃO: Tem certeza que deseja remover esta peça do sistema?')) {
      setIsLoading(true);
      await api.parts.delete(id);
      await loadCloudData(true);
      setIsLoading(false);
      showNotification('Item removido do inventário.', 'info');
    }
  };

  const handleCreateOrder = async (items: OrderItem[], priority: 'NORMAL' | 'URGENTE', vehicleData?: VehicleInfo, maintenanceSystem?: MaintenanceSystem, maintenanceNotes?: string) => {
    setIsLoading(true);
    const requester = currentRole === UserRole.MECHANIC 
      ? `Mecânica (${currentUser?.name})` 
      : (currentRole === UserRole.ADMIN ? `TI / Admin (${currentUser?.name})` : `Almoxarifado (${currentUser?.name})`);
    
    const newOrder: Order = {
      id: `REQ-${Math.floor(Math.random() * 10000)}`,
      requesterName: requester,
      requesterId: currentUser?.id || 'unknown',
      role: currentRole!,
      createdAt: new Date().toISOString(),
      items,
      priority,
      status: OrderStatus.PENDING,
      vehicleInfo: vehicleData,
      maintenanceSystem: maintenanceSystem,
      maintenanceType: maintenanceNotes
    };
    await api.orders.create(newOrder);
    await loadCloudData(true);
    setIsLoading(false);
    showNotification(`Solicitação #${newOrder.id} enviada.`, 'success');
  };

  const handleRequestRegistration = async (description: string, brand?: string) => {
    setIsLoading(true);
    const requester = `Mecânica (${currentUser?.name})`;
    const newOrder: Order = {
       id: `CAD-${Math.floor(Math.random() * 10000)}`,
       requesterName: requester,
       requesterId: currentUser?.id || 'unknown',
       role: currentRole!,
       createdAt: new Date().toISOString(),
       items: [],
       priority: 'NORMAL',
       status: OrderStatus.REGISTRATION_REQUEST,
       notes: `SOLICITAÇÃO DE PEÇA NOVA: ${description} ${brand ? `(Marca pref.: ${brand})` : ''}`,
       maintenanceType: 'Necessidade de Cadastro'
    };
    await api.orders.create(newOrder);
    await loadCloudData(true);
    setIsLoading(false);
    showNotification("Solicitação de cadastro enviada.", 'info');
  };

  const handleReportCorrection = async (partId: string, partName: string, notes: string) => {
    setIsLoading(true);
    const requester = `Mecânica (${currentUser?.name})`;
    const newOrder: Order = {
       id: `ERR-${Math.floor(Math.random() * 10000)}`,
       requesterName: requester,
       requesterId: currentUser?.id || 'unknown',
       role: currentRole!,
       createdAt: new Date().toISOString(),
       items: [{ partId, partName, quantity: 1, internalCode: 'ERR-REPORT' }],
       priority: 'NORMAL',
       status: OrderStatus.DATA_CORRECTION, 
       notes: notes,
       maintenanceType: 'Correção de Dados Cadastrais/Manual'
    };
    await api.orders.create(newOrder);
    await loadCloudData(true);
    setIsLoading(false);
    showNotification("Reporte de erro enviado ao Estoque.", 'info');
  }

  const handleProcessRegistrationRequest = (request: Order) => {
     setRegistrationPrefill({ description: request.notes || '' });
     setActiveTab('register');
  };

  const handleOrderAction = async (orderId: string, action: 'DELIVER' | 'FORWARD_PURCHASING' | 'REJECT' | 'RESOLVE_CORRECTION') => {
     setIsLoading(true);
     if (action === 'DELIVER') {
       await api.orders.updateStatus(orderId, OrderStatus.DELIVERED); 
       showNotification('Pedido atendido pelo estoque.', 'success');
     } else if (action === 'FORWARD_PURCHASING') {
       await api.orders.updateStatus(orderId, OrderStatus.QUOTING);
       showNotification('Encaminhado para compras.', 'info'); 
     } else if (action === 'REJECT') {
       await api.orders.updateStatus(orderId, OrderStatus.CANCELED);
       showNotification('Solicitação recusada.', 'error');
     } else if (action === 'RESOLVE_CORRECTION') {
       await api.orders.updateStatus(orderId, OrderStatus.CANCELED);
       showNotification('Reporte marcado como resolvido.', 'success');
     }
     await loadCloudData(true);
     setIsLoading(false);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setIsLoading(true);
    await api.orders.updateStatus(orderId, newStatus);
    await loadCloudData(true);
    setIsLoading(false);
    showNotification('Status do pedido atualizado.', 'success');
  };

  const handleUpdateOrderItems = async (orderId: string, items: OrderItem[]) => {
    setIsLoading(true);
    await api.orders.updateItems(orderId, items);
    await loadCloudData(true);
    setIsLoading(false);
    showNotification('Itens do pedido atualizados.', 'success');
  };

  const handleUpdatePartSupplier = async (partId: string, supplierData: Partial<AutoPart>) => {
    setIsLoading(true);
    await api.parts.update(partId, supplierData);
    await loadCloudData(true);
    setIsLoading(false);
    showNotification('Fornecedor atualizado.', 'success');
  };

  const handleFinishMaintenance = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (confirm('Confirmar finalização da manutenção? Isso registrará as peças no histórico do veículo.')) {
      setIsLoading(true);
      await api.orders.updateStatus(orderId, OrderStatus.INSTALLED);

      const record: MaintenanceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        orderId: order.id,
        vehicleInfo: order.vehicleInfo || { prefix: 'N/A', plate: 'N/A', vin: '', model: '', year: '', bodyType: '' },
        maintenanceSystem: order.maintenanceSystem || MaintenanceSystem.OTHER,
        date: new Date().toISOString(),
        mechanicName: currentUser?.name || 'Mecânico',
        description: order.maintenanceType || 'Manutenção Corretiva',
        items: order.items
      };
      await api.history.create(record);
      await loadCloudData(true);
      setIsLoading(false);
      showNotification('Manutenção finalizada e registrada.', 'success');
    }
  };

  const handleNewSale = async (sale: SaleRecord) => {
    setIsLoading(true);
    await api.sales.create(sale);
    await loadCloudData(true);
    setIsLoading(false);
    showNotification('Venda realizada com sucesso!', 'success');
  };

  const handleSaveDiagram = async (diagramData: any) => {
    setIsLoading(true);
    const newDiagram = {
      ...diagramData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    await api.diagrams.create(newDiagram);
    await loadCloudData(true);
    setIsLoading(false);
    setActiveTab('list');
    showNotification('Diagrama criado com sucesso.', 'success');
  };

  // Render Flows
  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
        <h2 className="text-xl font-bold">AutoParts ERP</h2>
        <p className="text-sm text-gray-400 mt-2">Conectando ao servidor em nuvem...</p>
      </div>
    );
  }

  if (!currentRole) {
    return <PortalSelection onSelectPortal={handleSelectPortal} />;
  }

  if (!isAuthenticated) {
    return <LoginPage role={currentRole} onLogin={handleLogin} onBack={() => setCurrentRole(null)} />;
  }

  // Navigation Items
  const stockNavItems = [
    { id: 'list', label: 'Controle de Estoque', icon: <Package className="w-5 h-5" /> },
    { id: 'register', label: 'Cadastro de Item', icon: <PlusCircle className="w-5 h-5" /> },
    { id: 'diagrams', label: 'Vistas Explodidas', icon: <Map className="w-5 h-5" /> },
    { id: 'catalog', label: 'Gestão de Marcas', icon: <Wrench className="w-5 h-5" /> },
    { id: 'fleet', label: 'Gestão de Frota', icon: <Bus className="w-5 h-5" /> },
    { id: 'history', label: 'Histórico de Frota', icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'logs', label: 'Histórico Global', icon: <FileClock className="w-5 h-5" /> }, 
  ];

  const purchasingNavItems = [
    { id: 'orders', label: 'Central de Compras & Vendas', icon: <ShoppingCart className="w-5 h-5" /> },
  ];

  const mechanicNavItems = [
    { id: 'mechanic_dashboard', label: 'Painel Oficina', icon: <Wrench className="w-5 h-5" /> },
    { id: 'history', label: 'Histórico de Veículos', icon: <ClipboardList className="w-5 h-5" /> },
  ];

  const adminNavItems = [
    { id: 'system', label: 'Controle do Sistema', icon: <Server className="w-5 h-5" /> },
    { id: 'users', label: 'Gestão de Acessos', icon: <Users className="w-5 h-5" /> },
    { id: 'logs', label: 'Auditoria de Sistema', icon: <FileClock className="w-5 h-5" /> }, 
    { id: 'fleet', label: 'Cadastro de Frota', icon: <Bus className="w-5 h-5" /> },
    { id: 'history', label: 'Auditoria de Frota', icon: <ClipboardList className="w-5 h-5" /> },
  ];

  let currentNavItems = stockNavItems;
  if (currentRole === UserRole.PURCHASING) currentNavItems = purchasingNavItems;
  else if (currentRole === UserRole.MECHANIC) currentNavItems = mechanicNavItems;
  else if (currentRole === UserRole.SALES) currentNavItems = purchasingNavItems; 
  else if (currentRole === UserRole.ADMIN) {
    currentNavItems = [
      ...adminNavItems,
      ...stockNavItems.filter(i => i.id !== 'fleet' && i.id !== 'history' && i.id !== 'logs'), 
      ...purchasingNavItems,
    ];
  }

  const getThemeColors = () => {
    switch (currentRole) {
      case UserRole.STOCK: return { bg: 'bg-red-700', text: 'text-red-600' };
      case UserRole.PURCHASING: return { bg: 'bg-blue-600', text: 'text-blue-500' };
      case UserRole.MECHANIC: return { bg: 'bg-orange-600', text: 'text-orange-500' };
      case UserRole.ADMIN: return { bg: 'bg-slate-800', text: 'text-purple-500' };
      case UserRole.SALES: return { bg: 'bg-green-600', text: 'text-green-500' };
      default: return { bg: 'bg-gray-800', text: 'text-gray-500' };
    }
  };
  const theme = getThemeColors();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans relative">
      <ToastContainer />

      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-2" />
            <span className="text-sm font-bold text-gray-700">Processando...</span>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className={`md:hidden bg-gray-900 text-white p-4 flex justify-between items-center shadow-md z-30 relative border-b ${currentRole === UserRole.ADMIN ? 'border-purple-600' : currentRole === UserRole.STOCK ? 'border-red-700' : currentRole === UserRole.PURCHASING ? 'border-blue-700' : 'border-orange-700'}`}>
        <div className="flex items-center gap-2 font-bold text-lg">
          <Car className="w-6 h-6" />
          <span>AutoParts ERP</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Corporativa */}
      <aside 
        className={`fixed inset-y-0 left-0 z-20 w-64 bg-gray-900 text-gray-300 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col shadow-2xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-800 hidden md:flex items-center gap-3 font-bold text-xl text-white bg-gray-950">
           <div className={`p-1.5 rounded ${theme.bg}`}>
             {currentRole === UserRole.ADMIN ? <ShieldCheck className="w-5 h-5 text-white" /> : <Car className="w-5 h-5 text-white" />}
           </div>
           <span className="tracking-tight">AutoParts<span className={theme.text}>ERP</span></span>
        </div>

        <div className="px-6 py-4 flex items-center justify-between">
           <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
             {currentRole === UserRole.STOCK && 'Almoxarifado'}
             {currentRole === UserRole.PURCHASING && 'Procurement'}
             {currentRole === UserRole.MECHANIC && 'Oficina'}
             {currentRole === UserRole.ADMIN && 'Admin'}
             {currentRole === UserRole.SALES && 'Vendas'}
           </p>
           <div title={isSyncing ? "Sincronizando..." : "Conectado"} className="flex items-center gap-1">
             {isSyncing && <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />}
             <Cloud className={`w-3 h-3 ${isSyncing ? 'text-blue-500' : 'text-green-500'}`} />
           </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
          {currentNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as Tab);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${
                activeTab === item.id 
                  ? `${theme.bg} text-white shadow-md` 
                  : 'hover:bg-gray-800 hover:text-white text-gray-400'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 bg-gray-950">
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white font-bold">
                <UserCircle className="w-5 h-5" />
              </div>
              <div className="flex flex-col overflow-hidden">
                 <span className="text-sm text-white font-medium truncate">
                   {currentUser?.name || 'Usuário'}
                 </span>
                 <span className="text-xs text-gray-500 truncate">
                   {currentUser?.department}
                 </span>
              </div>
           </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto h-[calc(100vh-64px)] md:h-screen p-4 md:p-8 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          
          <header className="mb-8 border-b border-gray-200 pb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {activeTab === 'list' && 'Gestão de Estoque'}
              {activeTab === 'mechanic_dashboard' && 'Painel de Manutenção'}
              {activeTab === 'register' && 'Novo Cadastro de Peça'}
              {activeTab === 'orders' && 'Central de Compras & Vendas'}
              {activeTab === 'users' && 'Administração de Acessos (TI)'}
              {activeTab === 'history' && 'Histórico de Frota'}
              {activeTab === 'fleet' && 'Cadastro de Frota'}
              {activeTab === 'system' && 'Controle e Manutenção'}
              {activeTab === 'catalog' && 'Gestão de Marcas & Categorias'}
              {activeTab === 'logs' && 'Histórico Global (Logs)'}
              {activeTab === 'diagrams' && 'Editor de Vistas Explodidas'}
            </h1>
            <p className="text-gray-500 mt-1 text-sm flex items-center gap-2">
              {isSyncing ? (
                 <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
              ) : (
                 <Cloud className="w-3 h-3 text-green-500" />
              )}
              {isSyncing ? 'Sincronizando dados com a nuvem...' : (
                <>
                  {activeTab === 'diagrams' && 'Mapeamento visual de componentes.'}
                  {activeTab !== 'diagrams' && 'Sistema conectado e sincronizado.'}
                </>
              )}
            </p>
          </header>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'list' && (currentRole === UserRole.STOCK || currentRole === UserRole.ADMIN) && (
              <ClientList 
                clients={parts} 
                onDelete={handleDeletePart} 
                onCreateOrder={handleCreateOrder}
                canEdit={currentRole === UserRole.STOCK || currentRole === UserRole.ADMIN}
                pendingRequests={orders.filter(o => o.status === OrderStatus.REGISTRATION_REQUEST)}
                pendingOrders={orders.filter(o => o.status === OrderStatus.PENDING)}
                pendingCorrections={orders.filter(o => o.status === OrderStatus.DATA_CORRECTION)}
                onProcessRequest={handleProcessRegistrationRequest}
                onOrderAction={handleOrderAction}
                customBrands={catalogConfig.customBrands}
                customCategories={catalogConfig.customCategories}
              />
            )}

            {activeTab === 'mechanic_dashboard' && (currentRole === UserRole.MECHANIC) && (
              <MechanicDashboard 
                parts={parts}
                orders={orders}
                currentUserId={currentUser?.id || ''}
                onCreateOrder={handleCreateOrder}
                onConfirmReceipt={handleFinishMaintenance}
                onRequestRegistration={handleRequestRegistration}
                onReportCorrection={handleReportCorrection}
                vehiclesDB={vehicles}
                diagrams={diagrams}
              />
            )}
            
            {activeTab === 'register' && (currentRole === UserRole.STOCK || currentRole === UserRole.ADMIN) && (
              <ClientForm 
                onSave={handleSavePart} 
                onCancel={() => {
                  setActiveTab('list');
                  setRegistrationPrefill(undefined);
                }} 
                initialData={registrationPrefill}
                customBrands={catalogConfig.customBrands}
                customCategories={catalogConfig.customCategories}
              />
            )}

            {activeTab === 'diagrams' && (currentRole === UserRole.STOCK || currentRole === UserRole.ADMIN) && (
              <DiagramEditor 
                parts={parts} 
                onSave={handleSaveDiagram}
                onCancel={() => setActiveTab('list')}
              />
            )}

            {activeTab === 'users' && currentRole === UserRole.ADMIN && (
              <UserManagement 
                users={users}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                currentUserEmail={currentUser?.email || ''}
              />
            )}

            {activeTab === 'fleet' && (currentRole === UserRole.STOCK || currentRole === UserRole.ADMIN) && (
              <FleetManagement 
                vehicles={vehicles}
                onAddVehicle={handleAddVehicle}
                onDeleteVehicle={handleDeleteVehicle}
              />
            )}

            {activeTab === 'orders' && (currentRole === UserRole.PURCHASING || currentRole === UserRole.ADMIN || currentRole === UserRole.SALES) && (
              <PurchasingDashboard 
                orders={orders} 
                parts={parts}
                onUpdateStatus={handleUpdateOrderStatus}
                onUpdateOrderItems={handleUpdateOrderItems}
                onUpdatePartSupplier={handleUpdatePartSupplier}
                salesHistory={sales}
                onCompleteSale={handleNewSale}
                currentUserName={currentUser?.name || 'Vendedor'}
              />
            )}

            {activeTab === 'history' && (
              <MaintenanceHistory records={maintenanceRecords} />
            )}
            
            {activeTab === 'logs' && (
               <SystemHistory logs={logs} />
            )}

            {activeTab === 'system' && currentRole === UserRole.ADMIN && (
              <SystemControl 
                currentUserRole={currentRole}
                onNotify={showNotification}
              />
            )}

            {activeTab === 'catalog' && currentRole === UserRole.STOCK && (
              <CatalogManagement 
                config={catalogConfig}
                onSave={async (newConfig) => {
                   setIsLoading(true);
                   await api.catalog.updateConfig(newConfig);
                   await loadCloudData(true);
                   setIsLoading(false);
                   showNotification('Catálogo atualizado.', 'success');
                }}
              />
            )}
          </div>

        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}