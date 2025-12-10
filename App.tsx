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

// Refactored Pages
import { StockDashboard } from './pages/StockDashboard';
import { PurchasingDashboardPage } from './pages/PurchasingDashboardPage';
import { MechanicDashboardPage } from './pages/MechanicDashboardPage';
import { AdminPanel } from './pages/AdminPanel';
import { FleetManager } from './pages/FleetManager';
import { CatalogManager } from './pages/CatalogManager';
import { Reports } from './pages/Reports';
import { DiagramsManager } from './pages/DiagramsManager';

function compareVersions(v1: string, v2: string) {
  const p1 = v1.split('.').map(Number);
  const p2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

export default function App() {
  const [viewMode, setViewMode] = useState<'public' | 'internal' | 'app'>('public');
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showGateway, setShowGateway] = useState(false);
  const [gatewayPassword, setGatewayPassword] = useState('');
  
  // Data State
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
  const [isAppOutdated, setIsAppOutdated] = useState(false);

  // Editing States managed by App to coordinate between List and Form
  const [registrationPrefill, setRegistrationPrefill] = useState<{description: string} | undefined>(undefined);
  const [editingPart, setEditingPart] = useState<AutoPart | undefined>(undefined);
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
          if (oldOrder && oldOrder.status !== newOrder.status) {
            const isMyOrder = newOrder.requesterId === currentUser.id;
            if (isMyOrder) {
               if (newOrder.status === OrderStatus.DELIVERED) showNotification(`✅ Pedido #${newOrder.id} disponível no estoque!`, 'success');
               else if (newOrder.status === OrderStatus.CANCELED) showNotification(`❌ Pedido #${newOrder.id} foi cancelado/recusado.`, 'error');
               else if (newOrder.status === OrderStatus.QUOTING) showNotification(`📋 Pedido #${newOrder.id} entrou em processo de compra.`, 'info');
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
  }, [currentRole, isAuthenticated, currentUser, viewMode]);

  useEffect(() => {
    const minSplashTime = new Promise(resolve => setTimeout(resolve, 2500));
    const init = async () => {
      try {
        const settings = await api.system.getSettings(true);
        if (settings.minAppVersion && (window as any).electronAPI) {
          const currentVersion = await (window as any).electronAPI.getAppVersion();
          if (compareVersions(currentVersion, settings.minAppVersion) < 0) {
            setIsAppOutdated(true);
            setIsInitialLoad(false);
            return; 
          }
        }
      } catch (err) { console.warn("Version check failed", err); }
      try { await Promise.all([loadPublicData(), minSplashTime]); } catch (e) { console.error("Public load failed", e); }
      setIsInitialLoad(false);
    };

    init().catch(() => setIsInitialLoad(false));

    const channel = new BroadcastChannel('autoparts_cloud_sync');
    channel.onmessage = () => {
      if (viewMode === 'app' && isAuthenticated) loadCloudData(true); 
      if (viewMode === 'public') loadPublicData();
    };

    const syncInterval = setInterval(() => {
       if (viewMode === 'app' && isAuthenticated) loadCloudData(true);
       else if (viewMode === 'public' && Date.now() % 30000 < 5000) loadPublicData();
    }, 4000);

    return () => { channel.close(); clearInterval(syncInterval); };
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
    } catch (err) { alert("Erro de conexão ao verificar senha."); } finally { setIsLoading(false); }
  };

  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    const user = await api.auth.login(email, pass);
    if (user && user.role === currentRole) {
      sessionStorage.setItem('autoparts_session', `token_${Math.random().toString(36)}`);
      setIsAuthenticated(true);
      setCurrentUser(user);
      setViewMode('app');
      
      if (currentRole === UserRole.PURCHASING) setActiveTab('orders');
      else if (currentRole === UserRole.ADMIN) setActiveTab('users');
      else if (currentRole === UserRole.MECHANIC) setActiveTab('mechanic_dashboard');
      else setActiveTab('list');
      
      showNotification(`Bem-vindo, ${user.name}!`, 'success');
      return true;
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
    setEditingPart(undefined);
    prevOrdersRef.current = [];
    setViewMode('public');
  };

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

  // --- CRUD Wrappers (Simplified for Page passing) ---
  const actions = {
      addUser: async (userData: Omit<User, 'id'>) => { setIsLoading(true); await api.users.create({ ...userData, id: Math.random().toString(36).substr(2, 9) } as User); await loadCloudData(true); setIsLoading(false); showNotification('Usuário adicionado.', 'success'); },
      updateUser: async (id: string, data: Partial<User>) => { setIsLoading(true); await api.users.update(id, data); await loadCloudData(true); setIsLoading(false); showNotification('Usuário atualizado.', 'success'); },
      deleteUser: async (id: string) => { if (confirm('Tem certeza?')) { setIsLoading(true); await api.users.delete(id); await loadCloudData(true); setIsLoading(false); showNotification('Acesso revogado.', 'success'); } },
      addVehicle: async (v: VehicleInfo) => { setIsLoading(true); await api.fleet.create(v); await loadCloudData(true); setIsLoading(false); showNotification('Veículo adicionado.', 'success'); },
      deleteVehicle: async (p: string) => { if (confirm(`Remover ${p}?`)) { setIsLoading(true); await api.fleet.delete(p); await loadCloudData(true); setIsLoading(false); showNotification('Veículo removido.', 'success'); } },
      savePart: async (d: any) => { setIsLoading(true); await api.parts.create({ ...d, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() }); await loadCloudData(true); setIsLoading(false); setActiveTab('list'); showNotification('Peça cadastrada.', 'success'); },
      updatePart: async (id: string, d: any) => { setIsLoading(true); await api.parts.update(id, d); await loadCloudData(true); setIsLoading(false); setActiveTab('list'); setEditingPart(undefined); showNotification('Peça atualizada.', 'success'); },
      deletePart: async (id: string) => { if (confirm('Remover esta peça?')) { setIsLoading(true); await api.parts.delete(id); await loadCloudData(true); setIsLoading(false); showNotification('Item removido.', 'info'); } },
      createOrder: async (items: OrderItem[], priority: 'NORMAL'|'URGENTE', vData?: VehicleInfo, mSystem?: MaintenanceSystem, mNotes?: string) => {
          setIsLoading(true);
          const requester = currentRole === UserRole.MECHANIC ? `Mecânica (${currentUser?.name})` : (currentRole === UserRole.ADMIN ? `TI / Admin (${currentUser?.name})` : `Almoxarifado (${currentUser?.name})`);
          await api.orders.create({ id: `REQ-${Math.floor(Math.random()*10000)}`, requesterName: requester, requesterId: currentUser?.id||'unknown', role: currentRole!, createdAt: new Date().toISOString(), items, priority, status: OrderStatus.PENDING, vehicleInfo: vData, maintenanceSystem: mSystem, maintenanceType: mNotes });
          await loadCloudData(true); setIsLoading(false); showNotification(`Solicitação enviada.`, 'success');
      },
      requestReg: async (desc: string, brand?: string) => { setIsLoading(true); await api.orders.create({ id: `CAD-${Math.floor(Math.random()*10000)}`, requesterName: `Mecânica (${currentUser?.name})`, requesterId: currentUser?.id||'unknown', role: currentRole!, createdAt: new Date().toISOString(), items: [], priority: 'NORMAL', status: OrderStatus.REGISTRATION_REQUEST, notes: `SOLICITAÇÃO: ${desc} ${brand ? `(Marca: ${brand})` : ''}`, maintenanceType: 'Cadastro' }); await loadCloudData(true); setIsLoading(false); showNotification("Solicitação enviada.", 'info'); },
      reportCorrection: async (pId: string, pName: string, notes: string) => { setIsLoading(true); await api.orders.create({ id: `ERR-${Math.floor(Math.random()*10000)}`, requesterName: `Mecânica (${currentUser?.name})`, requesterId: currentUser?.id||'unknown', role: currentRole!, createdAt: new Date().toISOString(), items: [{ partId: pId, partName: pName, quantity: 1, internalCode: 'ERR' }], priority: 'NORMAL', status: OrderStatus.DATA_CORRECTION, notes, maintenanceType: 'Correção' }); await loadCloudData(true); setIsLoading(false); showNotification("Reporte enviado.", 'info'); },
      orderAction: async (oid: string, action: 'DELIVER'|'FORWARD_PURCHASING'|'REJECT'|'RESOLVE_CORRECTION') => { setIsLoading(true); if(action==='DELIVER') await api.orders.updateStatus(oid, OrderStatus.DELIVERED); else if(action==='FORWARD_PURCHASING') await api.orders.updateStatus(oid, OrderStatus.QUOTING); else await api.orders.updateStatus(oid, OrderStatus.CANCELED); await loadCloudData(true); setIsLoading(false); showNotification('Ação realizada.', 'success'); },
      updateOrderStatus: async (id: string, st: OrderStatus) => { setIsLoading(true); await api.orders.updateStatus(id, st); await loadCloudData(true); setIsLoading(false); showNotification('Status atualizado.', 'success'); },
      updateOrderItems: async (id: string, items: OrderItem[]) => { setIsLoading(true); await api.orders.updateItems(id, items); await loadCloudData(true); setIsLoading(false); showNotification('Itens atualizados.', 'success'); },
      updatePartSupplier: async (id: string, data: Partial<AutoPart>) => { setIsLoading(true); await api.parts.update(id, data); await loadCloudData(true); setIsLoading(false); showNotification('Fornecedor atualizado.', 'success'); },
      finishMaintenance: async (oid: string) => { if(confirm('Finalizar?')) { setIsLoading(true); await api.orders.updateStatus(oid, OrderStatus.INSTALLED); const o = orders.find(x=>x.id===oid); if(o) await api.history.create({ id: Math.random().toString(36).substr(2,9), orderId: o.id, vehicleInfo: o.vehicleInfo!, maintenanceSystem: o.maintenanceSystem!, date: new Date().toISOString(), mechanicName: currentUser?.name||'Mecânico', description: o.maintenanceType!, items: o.items }); await loadCloudData(true); setIsLoading(false); showNotification('Finalizado.', 'success'); } },
      newSale: async (s: SaleRecord) => { setIsLoading(true); await api.sales.create(s); await loadCloudData(true); setIsLoading(false); showNotification('Venda realizada!', 'success'); },
      saveDiagram: async (d: any) => { setIsLoading(true); if(d.id) await api.diagrams.update(d.id, d); else await api.diagrams.create({ ...d, id: Math.random().toString(36).substr(2,9), createdAt: new Date().toISOString() }); await loadCloudData(true); setIsLoading(false); showNotification('Diagrama salvo.', 'success'); },
      deleteDiagram: async (id: string) => { if(confirm('Excluir?')) { setIsLoading(true); await api.diagrams.delete(id); await loadCloudData(true); setIsLoading(false); showNotification('Diagrama removido.', 'success'); } },
      updateCatalog: async (c: any) => { setIsLoading(true); await api.catalog.updateConfig(c); await loadCloudData(true); setIsLoading(false); showNotification('Catálogo atualizado.', 'success'); }
  };

  if (isInitialLoad) return <SplashScreen />;
  if (isAppOutdated) return <PortalSelection onSelectPortal={() => {}} isOutdated={true} />;
  
  if (showGateway) return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 relative">
       <div className="z-20 bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
          <div className="text-center mb-6"><Lock className="w-8 h-8 text-red-600 mx-auto mb-2" /><h2 className="text-2xl font-bold">Acesso Restrito</h2></div>
          <form onSubmit={handleGatewaySubmit} className="space-y-4"><Input label="Senha" type="password" value={gatewayPassword} onChange={e => setGatewayPassword(e.target.value)} autoFocus className="text-center text-lg font-bold" /><div className="flex gap-2"><Button type="button" variant="secondary" onClick={() => setShowGateway(false)} className="flex-1">Voltar</Button><Button type="submit" isLoading={isLoading} className="flex-1 bg-red-600 hover:bg-red-700">Entrar</Button></div></form>
       </div>
    </div>
  );

  if (viewMode === 'public') return <PublicCatalog parts={parts} diagrams={diagrams} vehiclesDB={vehicles} onAccessInternal={() => setShowGateway(true)} />;
  if (viewMode === 'internal' && !currentRole) return <div className="relative"><button onClick={() => setViewMode('public')} className="absolute top-4 left-4 z-50 bg-white/10 text-white px-4 py-2 rounded flex gap-2"><LogOut className="w-4 h-4"/> Voltar</button><PortalSelection onSelectPortal={r => setCurrentRole(r as UserRole)} /></div>;
  if (viewMode === 'internal' && !isAuthenticated) return <LoginPage role={currentRole!} onLogin={handleLogin} onBack={() => setCurrentRole(null)} />;

  // --- APP LAYOUT ---
  const theme = getThemeColors();
  const navItems = {
      [UserRole.STOCK]: [{id: 'list', label: 'Estoque', icon: <Package/>}, {id: 'register', label: 'Cadastro', icon: <PlusCircle/>}, {id: 'diagrams', label: 'Diagramas', icon: <Map/>}, {id: 'catalog', label: 'Configuração', icon: <Wrench/>}, {id: 'fleet', label: 'Frota', icon: <Bus/>}, {id: 'history', label: 'Histórico', icon: <ClipboardList/>}, {id: 'logs', label: 'Logs', icon: <FileClock/>}],
      [UserRole.PURCHASING]: [{id: 'orders', label: 'Compras & Vendas', icon: <ShoppingCart/>}],
      [UserRole.SALES]: [{id: 'orders', label: 'Compras & Vendas', icon: <ShoppingCart/>}],
      [UserRole.MECHANIC]: [{id: 'mechanic_dashboard', label: 'Oficina', icon: <Wrench/>}, {id: 'history', label: 'Histórico', icon: <ClipboardList/>}],
      [UserRole.ADMIN]: [{id: 'system', label: 'Sistema', icon: <Server/>}, {id: 'users', label: 'Usuários', icon: <Users/>}, {id: 'logs', label: 'Auditoria', icon: <FileClock/>}, {id: 'fleet', label: 'Frota', icon: <Bus/>}, {id: 'list', label: 'Estoque', icon: <Package/>}, {id: 'orders', label: 'Compras', icon: <ShoppingCart/>}]
  }[currentRole!] || [];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans relative">
      <ToastContainer />
      {isLoading && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>}
      
      {/* Sidebar */}
      <div className={`md:hidden bg-gray-900 text-white p-4 flex justify-between items-center shadow-md z-30 border-b ${currentRole===UserRole.ADMIN?'border-purple-600':currentRole===UserRole.STOCK?'border-red-700':currentRole===UserRole.PURCHASING?'border-blue-700':'border-orange-700'}`}><div className="flex items-center gap-2 font-bold text-lg"><Car className="w-6 h-6"/><span>MEC System</span></div><button onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen?<X/>:<Menu/>}</button></div>
      <aside className={`fixed inset-y-0 left-0 z-20 w-64 bg-gray-900 text-gray-300 transform transition-transform duration-300 md:relative md:translate-x-0 flex flex-col shadow-2xl ${sidebarOpen?'translate-x-0':'-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-800 hidden md:flex items-center gap-3 font-bold text-xl text-white bg-gray-950"><div className={`p-1.5 rounded ${theme.bg}`}>{currentRole===UserRole.ADMIN?<ShieldCheck className="w-5 h-5 text-white"/>:<Car className="w-5 h-5 text-white"/>}</div><span>MEC<span className={theme.text}>System</span></span></div>
        <div className="px-6 py-4 flex justify-between"><p className="text-xs font-bold text-gray-500 uppercase">{currentRole}</p><button onClick={() => loadCloudData(true)} className={`p-1.5 rounded hover:bg-gray-800 ${isSyncing?'cursor-wait':''}`}>{isSyncing?<RefreshCw className="w-3 h-3 text-blue-500 animate-spin"/>:<Cloud className="w-3 h-3 text-green-500"/>}</button></div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">{navItems.map(item => (<button key={item.id} onClick={() => {setActiveTab(item.id as Tab); setSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${activeTab===item.id?`${theme.bg} text-white shadow-md`:'hover:bg-gray-800 hover:text-white text-gray-400'}`}>{React.cloneElement(item.icon as any, {className: "w-5 h5"})}<span>{item.label}</span></button>))}</nav>
        <div className="p-4 border-t border-gray-800 bg-gray-950"><div className="flex items-center gap-3 mb-4 px-2"><div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white font-bold"><UserCircle className="w-5 h-5"/></div><div className="flex flex-col"><span className="text-sm text-white font-medium truncate">{currentUser?.name}</span><span className="text-xs text-gray-500 truncate">{currentUser?.department}</span></div></div><button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded text-gray-400 hover:bg-gray-800 hover:text-white text-sm"><LogOut className="w-4 h-4"/>Sair</button></div>
      </aside>

      <main className="flex-1 overflow-auto h-[calc(100vh-64px)] md:h-screen p-4 md:p-8 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 border-b border-gray-200 pb-4"><h1 className="text-2xl md:text-3xl font-bold text-gray-800 capitalize">{activeTab.replace('_', ' ')}</h1></header>
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             {(activeTab === 'list' || activeTab === 'register') && (currentRole === UserRole.STOCK || currentRole === UserRole.ADMIN) && (
               <StockDashboard view={activeTab} parts={parts} orders={orders} config={catalogConfig} editingPart={editingPart} registrationPrefill={registrationPrefill} 
                onDeletePart={actions.deletePart} onCreateOrder={actions.createOrder} onOrderAction={actions.orderAction} 
                onEditPart={(id) => { const p = parts.find(x => x.id === id); if (p) { setEditingPart(p); setActiveTab('register'); } }}
                onSavePart={actions.savePart} onUpdatePart={actions.updatePart} onCancelEdit={() => { setActiveTab('list'); setRegistrationPrefill(undefined); setEditingPart(undefined); }}
                onProcessRequest={(r) => { setRegistrationPrefill({ description: r.notes || '' }); setActiveTab('register'); }} 
               />
             )}
             {activeTab === 'diagrams' && (currentRole === UserRole.STOCK || currentRole === UserRole.ADMIN) && <DiagramsManager diagrams={diagrams} parts={parts} onSaveDiagram={actions.saveDiagram} onDeleteDiagram={actions.deleteDiagram} onNotify={(msg, type) => showNotification(msg, type)} />}
             {activeTab === 'orders' && <PurchasingDashboardPage orders={orders} parts={parts} sales={sales} currentUser={currentUser!} onUpdateStatus={actions.updateOrderStatus} onUpdateOrderItems={actions.updateOrderItems} onUpdatePartSupplier={actions.updatePartSupplier} onCompleteSale={actions.newSale} />}
             {activeTab === 'mechanic_dashboard' && <MechanicDashboardPage parts={parts} orders={orders} vehicles={vehicles} diagrams={diagrams} currentUserId={currentUser!.id} onCreateOrder={actions.createOrder} onConfirmReceipt={actions.finishMaintenance} onRequestRegistration={actions.requestReg} onReportCorrection={actions.reportCorrection} />}
             {(activeTab === 'system' || activeTab === 'users') && <AdminPanel activeTab={activeTab} users={users} currentUser={currentUser!} onAddUser={actions.addUser} onUpdateUser={actions.updateUser} onDeleteUser={actions.deleteUser} onNotify={(m,t) => showNotification(m,t)} />}
             {activeTab === 'fleet' && <FleetManager vehicles={vehicles} onAddVehicle={actions.addVehicle} onDeleteVehicle={actions.deleteVehicle} />}
             {activeTab === 'catalog' && <CatalogManager config={catalogConfig} onSave={actions.updateCatalog} />}
             {(activeTab === 'history' || activeTab === 'logs') && <Reports activeTab={activeTab} maintenanceRecords={maintenanceRecords} logs={logs} />}
          </div>
        </div>
      </main>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-10 md:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}