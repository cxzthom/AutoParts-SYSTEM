
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Package, PlusCircle, Menu, X, Car, LogOut, ShoppingCart, UserCircle, Wrench, Users, ShieldCheck, ClipboardList, Bus, Loader2, Cloud, RefreshCw, Server, FileClock, Map, Lock } from 'lucide-react';
import { AutoPart, Tab, UserRole, Order, OrderStatus, OrderItem, User, MaintenanceRecord, VehicleInfo, MaintenanceSystem, SaleRecord, SystemLog, AssemblyDiagram } from './types';
import { api } from './services/api';

import { LoginPage } from './components/LoginPage';
import { PortalSelection } from './components/PortalSelection';
import { PublicCatalog } from './components/PublicCatalog';
import { showNotification, ToastContainer } from './components/Toast';
import { SplashScreen } from './components/SplashScreen';
import { Input } from './components/Input';
import { Button } from './components/Button';

import { StockDashboard } from './pages/StockDashboard';
import { PurchasingDashboardPage } from './pages/PurchasingDashboardPage';
import { MechanicDashboardPage } from './pages/MechanicDashboardPage';
import { AdminPanel } from './pages/AdminPanel';
import { FleetManager } from './pages/FleetManager';
import { CatalogManager } from './pages/CatalogManager';
import { Reports } from './pages/Reports';
import { DiagramsManager } from './pages/DiagramsManager';

export default function App() {
  const [viewMode, setViewMode] = useState<'public' | 'internal' | 'app'>('public');
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showGateway, setShowGateway] = useState(false);
  const [gatewayPassword, setGatewayPassword] = useState('');
  
  const [parts, setParts] = useState<AutoPart[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleInfo[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]); 
  const [diagrams, setDiagrams] = useState<AssemblyDiagram[]>([]);
  const [catalogConfig, setCatalogConfig] = useState({ customBrands: [] as string[], customCategories: [] as string[], vehicleModels: [] as string[] });

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [editingPart, setEditingPart] = useState<AutoPart | undefined>(undefined);
  const [registrationPrefill, setRegistrationPrefill] = useState<{description: string} | undefined>(undefined);
  const prevOrdersRef = useRef<Order[]>([]);

  const loadPublicData = useCallback(async () => {
    try {
      const [p, d, v, c] = await Promise.all([
        api.parts.list(),
        api.diagrams.list(),
        api.fleet.list(),
        api.catalog.getConfig()
      ]);
      setParts(p);
      setDiagrams(d);
      setVehicles(v);
      setCatalogConfig(c);
    } catch (error) {
      console.error("Failed to load public catalog data", error);
    }
  }, []);

  const loadCloudData = useCallback(async (silent = false) => {
    if (!currentRole && viewMode !== 'app') return; 
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
      
      if (prevOrdersRef.current.length > 0 && currentUser) {
        o.forEach(newOrder => {
          const oldOrder = prevOrdersRef.current.find(old => old.id === newOrder.id);
          if (oldOrder && oldOrder.status !== newOrder.status && newOrder.requesterId === currentUser.id) {
            if (newOrder.status === OrderStatus.DELIVERED) showNotification(`✅ Pedido #${newOrder.id} disponível!`, 'success');
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
  }, [currentRole, currentUser, viewMode]);

  useEffect(() => {
    const minSplashTime = new Promise(resolve => setTimeout(resolve, 2000));
    const init = async () => {
      try { await Promise.all([loadPublicData(), minSplashTime]); } finally { setIsInitialLoad(false); }
    };
    init();

    const interval = setInterval(() => {
       if (viewMode === 'app' && isAuthenticated) loadCloudData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, loadCloudData, loadPublicData, viewMode]);

  const handleGatewaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const settings = await api.system.getSettings(true);
      if (gatewayPassword === (settings.internalSystemPassword || '123')) {
        setViewMode('internal');
        setShowGateway(false);
        setGatewayPassword('');
      } else { alert("Senha incorreta."); }
    } catch (err) { alert("Erro de conexão."); } finally { setIsLoading(false); }
  };

  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    const user = await api.auth.login(email, pass);
    if (user && user.role === currentRole) {
      setIsAuthenticated(true);
      setCurrentUser(user);
      setViewMode('app');
      setActiveTab(user.role === UserRole.MECHANIC ? 'mechanic_dashboard' : (user.role === UserRole.PURCHASING ? 'orders' : 'list'));
      showNotification(`Bem-vindo, ${user.name}!`, 'success');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentRole(null);
    setCurrentUser(null);
    setViewMode('public');
  };

  const getThemeColors = () => {
    switch (currentRole) {
      case UserRole.STOCK: return { bg: 'bg-red-700', text: 'text-red-600' };
      case UserRole.PURCHASING: return { bg: 'bg-blue-600', text: 'text-blue-500' };
      case UserRole.MECHANIC: return { bg: 'bg-orange-600', text: 'text-orange-500' };
      case UserRole.ADMIN: return { bg: 'bg-slate-800', text: 'text-purple-500' };
      default: return { bg: 'bg-gray-800', text: 'text-gray-500' };
    }
  };

  const actions = {
      addUser: async (userData: any) => { setIsLoading(true); await api.users.create(userData); await loadCloudData(true); setIsLoading(false); },
      updateUser: async (id: string, data: any) => { setIsLoading(true); await api.users.update(id, data); await loadCloudData(true); setIsLoading(false); },
      deleteUser: async (id: string) => { if (confirm('Excluir usuário?')) { setIsLoading(true); await api.users.delete(id); await loadCloudData(true); setIsLoading(false); } },
      addVehicle: async (v: any) => { setIsLoading(true); await api.fleet.create(v); await loadCloudData(true); setIsLoading(false); },
      deleteVehicle: async (p: string) => { setIsLoading(true); await api.fleet.delete(p); await loadCloudData(true); setIsLoading(false); },
      savePart: async (d: any) => { setIsLoading(true); await api.parts.create({...d, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString()}); await loadCloudData(true); setIsLoading(false); setActiveTab('list'); },
      updatePart: async (id: string, d: any) => { setIsLoading(true); await api.parts.update(id, d); await loadCloudData(true); setIsLoading(false); setActiveTab('list'); setEditingPart(undefined); },
      deletePart: async (id: string) => { if (confirm('Remover peça?')) { setIsLoading(true); await api.parts.delete(id); await loadCloudData(true); setIsLoading(false); } },
      createOrder: async (items: any[], priority: any, vData?: any, mSystem?: any, mNotes?: any) => {
          setIsLoading(true);
          await api.orders.create({ id: `REQ-${Math.floor(Math.random()*10000)}`, requesterName: currentUser?.name || 'Sistema', requesterId: currentUser?.id||'unknown', role: currentRole!, createdAt: new Date().toISOString(), items, priority, status: OrderStatus.PENDING, vehicleInfo: vData, maintenanceSystem: mSystem, maintenanceType: mNotes });
          await loadCloudData(true); setIsLoading(false); showNotification(`Solicitação enviada.`, 'success');
      },
      requestReg: async (desc: string) => { setIsLoading(true); await api.orders.create({ id: `CAD-${Math.floor(Math.random()*10000)}`, requesterName: currentUser?.name || 'Mecânica', requesterId: currentUser?.id||'unknown', role: currentRole!, createdAt: new Date().toISOString(), items: [], priority: 'NORMAL', status: OrderStatus.REGISTRATION_REQUEST, notes: desc }); await loadCloudData(true); setIsLoading(false); },
      reportCorrection: async (pId: string, pName: string, notes: string) => { setIsLoading(true); await api.orders.create({ id: `ERR-${Math.floor(Math.random()*10000)}`, requesterName: currentUser?.name || 'Mecânica', requesterId: currentUser?.id||'unknown', role: currentRole!, createdAt: new Date().toISOString(), items: [{partId: pId, partName: pName, quantity: 1, internalCode: 'ERR'}], priority: 'NORMAL', status: OrderStatus.DATA_CORRECTION, notes }); await loadCloudData(true); setIsLoading(false); },
      orderAction: async (oid: string, action: string) => { setIsLoading(true); const st = action === 'DELIVER' ? OrderStatus.DELIVERED : (action === 'FORWARD_PURCHASING' ? OrderStatus.QUOTING : OrderStatus.CANCELED); await api.orders.updateStatus(oid, st); await loadCloudData(true); setIsLoading(false); },
      updateOrderStatus: async (id: string, st: any) => { setIsLoading(true); await api.orders.updateStatus(id, st); await loadCloudData(true); setIsLoading(false); },
      updateOrderItems: async (id: string, items: any[]) => { setIsLoading(true); await api.orders.updateItems(id, items); await loadCloudData(true); setIsLoading(false); },
      updatePartSupplier: async (id: string, data: any) => { setIsLoading(true); await api.parts.update(id, data); await loadCloudData(true); setIsLoading(false); },
      finishMaintenance: async (oid: string) => { setIsLoading(true); await api.orders.updateStatus(oid, OrderStatus.INSTALLED); await loadCloudData(true); setIsLoading(false); },
      newSale: async (s: any) => { setIsLoading(true); await api.sales.create(s); await loadCloudData(true); setIsLoading(false); },
      saveDiagram: async (d: any) => { setIsLoading(true); d.id ? await api.diagrams.update(d.id, d) : await api.diagrams.create(d); await loadCloudData(true); setIsLoading(false); },
      deleteDiagram: async (id: string) => { setIsLoading(true); await api.diagrams.delete(id); await loadCloudData(true); setIsLoading(false); },
      updateCatalog: async (c: any) => { setIsLoading(true); await api.catalog.updateConfig(c); await loadCloudData(true); setIsLoading(false); }
  };

  if (isInitialLoad) return <SplashScreen />;
  
  if (showGateway) return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
       <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
          <div className="text-center mb-6"><Lock className="w-8 h-8 text-red-600 mx-auto mb-2" /><h2 className="text-2xl font-bold">Acesso Restrito</h2></div>
          <form onSubmit={handleGatewaySubmit} className="space-y-4"><Input label="Senha" type="password" value={gatewayPassword} onChange={e => setGatewayPassword(e.target.value)} autoFocus className="text-center text-lg" /><div className="flex gap-2"><Button type="button" variant="secondary" onClick={() => setShowGateway(false)} className="flex-1">Voltar</Button><Button type="submit" isLoading={isLoading} className="flex-1 bg-red-600">Entrar</Button></div></form>
       </div>
    </div>
  );

  if (viewMode === 'public') return <PublicCatalog parts={parts} diagrams={diagrams} vehiclesDB={vehicles} onAccessInternal={() => setShowGateway(true)} />;
  if (viewMode === 'internal' && !currentRole) return <PortalSelection onSelectPortal={r => setCurrentRole(r as UserRole)} />;
  if (viewMode === 'internal' && !isAuthenticated) return <LoginPage role={currentRole!} onLogin={handleLogin} onBack={() => setCurrentRole(null)} />;

  const theme = getThemeColors();
  const navItems = {
      [UserRole.STOCK]: [{id: 'list', label: 'Estoque', icon: <Package/>}, {id: 'register', label: 'Cadastro', icon: <PlusCircle/>}, {id: 'diagrams', label: 'Diagramas', icon: <Map/>}, {id: 'fleet', label: 'Frota', icon: <Bus/>}],
      [UserRole.PURCHASING]: [{id: 'orders', label: 'Compras', icon: <ShoppingCart/>}],
      [UserRole.MECHANIC]: [{id: 'mechanic_dashboard', label: 'Oficina', icon: <Wrench/>}],
      [UserRole.ADMIN]: [{id: 'system', label: 'Sistema', icon: <Server/>}, {id: 'users', label: 'Usuários', icon: <Users/>}, {id: 'logs', label: 'Logs', icon: <FileClock/>}]
  }[currentRole!] || [];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      <ToastContainer />
      {isLoading && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>}
      
      <aside className={`fixed inset-y-0 left-0 z-20 w-64 bg-gray-900 text-gray-300 transform transition-transform md:relative md:translate-x-0 flex flex-col ${sidebarOpen?'translate-x-0':'-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-800 bg-gray-950 flex items-center gap-3 font-bold text-xl text-white">MEC<span className={theme.text}>System</span></div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">{navItems.map(item => (<button key={item.id} onClick={() => {setActiveTab(item.id as Tab); setSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm transition-colors ${activeTab===item.id?`${theme.bg} text-white shadow-md`:'hover:bg-gray-800 text-gray-400'}`}>{React.cloneElement(item.icon as any, {className: "w-5 h5"})}<span>{item.label}</span></button>))}</nav>
        <div className="p-4 border-t border-gray-800 bg-gray-950"><button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded text-gray-400 hover:text-white text-sm"><LogOut className="w-4 h-4"/>Sair</button></div>
      </aside>

      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 border-b border-gray-200 pb-4 flex justify-between">
            <h1 className="text-2xl font-bold text-gray-800 capitalize">{activeTab}</h1>
            <button className="md:hidden p-2" onClick={() => setSidebarOpen(true)}><Menu/></button>
          </header>
          <div className="animate-in fade-in duration-300">
             {(activeTab === 'list' || activeTab === 'register') && <StockDashboard view={activeTab} parts={parts} orders={orders} config={catalogConfig} editingPart={editingPart} registrationPrefill={registrationPrefill} onDeletePart={actions.deletePart} onCreateOrder={actions.createOrder} onOrderAction={actions.orderAction} onEditPart={(id) => { const p = parts.find(x => x.id === id); if (p) { setEditingPart(p); setActiveTab('register'); } }} onSavePart={actions.savePart} onUpdatePart={actions.updatePart} onCancelEdit={() => { setActiveTab('list'); setEditingPart(undefined); }} onProcessRequest={(r) => { setRegistrationPrefill({ description: r.notes || '' }); setActiveTab('register'); }} />}
             {activeTab === 'diagrams' && <DiagramsManager diagrams={diagrams} parts={parts} onSaveDiagram={actions.saveDiagram} onDeleteDiagram={actions.deleteDiagram} onNotify={(msg, type) => showNotification(msg, type)} />}
             {activeTab === 'orders' && <PurchasingDashboardPage orders={orders} parts={parts} sales={sales} currentUser={currentUser!} onUpdateStatus={actions.updateOrderStatus} onUpdateOrderItems={actions.updateOrderItems} onUpdatePartSupplier={actions.updatePartSupplier} onCompleteSale={actions.newSale} />}
             {activeTab === 'mechanic_dashboard' && <MechanicDashboardPage parts={parts} orders={orders} vehicles={vehicles} diagrams={diagrams} currentUserId={currentUser!.id} onCreateOrder={actions.createOrder} onConfirmReceipt={actions.finishMaintenance} onRequestRegistration={actions.requestReg} onReportCorrection={actions.reportCorrection} />}
             {(activeTab === 'system' || activeTab === 'users') && <AdminPanel activeTab={activeTab} users={users} currentUser={currentUser!} onAddUser={actions.addUser} onUpdateUser={actions.updateUser} onDeleteUser={actions.deleteUser} onNotify={(m,t) => showNotification(m,t)} />}
             {activeTab === 'fleet' && <FleetManager vehicles={vehicles} onAddVehicle={actions.addVehicle} onDeleteVehicle={actions.deleteVehicle} />}
             {activeTab === 'logs' && <Reports activeTab="logs" maintenanceRecords={maintenanceRecords} logs={logs} />}
          </div>
        </div>
      </main>
    </div>
  );
}
