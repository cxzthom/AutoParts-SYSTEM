

export enum PartStatus {
  IN_STOCK = 'Em Estoque',
  LOW_STOCK = 'Estoque Baixo',
  OUT_OF_STOCK = 'Sem Estoque',
  DISCONTINUED = 'Descontinuado'
}

export enum PartCategory {
  ENGINE = 'Motor',
  BRAKES = 'Freios',
  SUSPENSION = 'Suspensão',
  BODY = 'Lataria',
  ELECTRICAL = 'Elétrica',
  TRANSMISSION = 'Transmissão',
  DIFFERENTIAL = 'Diferencial',
  ACCESSORIES = 'Acessórios',
  OTHER = 'Outros'
}

export const POPULAR_BRANDS = [
  'Mercedes-Benz', 
  'Volvo', 
  'Scania', 
  'VW / MAN', 
  'Iveco', 
  'Cummins', 
  'MWM', 
  'Eaton', 
  'ZF', 
  'Marcopolo', 
  'Caio', 
  'Busscar', 
  'Agrale',
  'Ecolite'
];

export interface CatalogConfig {
  customBrands: string[];
  customCategories: string[];
  vehicleModels: string[];
}

export interface AutoPart {
  id: string;
  name: string;
  internalCode: string; // Código Interno
  originalCode: string; // Código Original/OEM
  category: PartCategory | string;
  supplierName: string;
  supplierDoc: string; // CPF ou CNPJ
  supplierEmail: string;
  supplierPhone: string;
  status: PartStatus;
  description: string;
  createdAt: string;
  imageUrl?: string; // Legacy: URL da imagem única (Mantido para compatibilidade)
  imageUrls?: string[]; // Novo: Array de URLs (Base64) - Limite 4
  manualUrl?: string; // URL do Manual Técnico / PDF
  compatibleBrands?: string[]; // Marcas compatíveis (ex: Volvo, Mercedes)
  price?: number; // Preço de Venda (Novo)
}

// --- NOVOS TIPOS PARA DIAGRAMAS EXPLODIDOS ---
export interface DiagramHotspot {
  id: string;
  label: string; // Número na imagem (1, 2, 3...)
  x: number; // Posição % Horizontal
  y: number; // Posição % Vertical
  partId: string | null; // ID da peça no sistema (pode ser null se ainda não cadastrada)
  description?: string; // Caso a peça não esteja cadastrada, usa descrição manual
}

export interface AssemblyDiagram {
  id: string;
  name: string; // Ex: Câmbio Eaton 4305A - Eixo Piloto
  system: MaintenanceSystem; // Categoria Macro
  imageUrl: string;
  hotspots: DiagramHotspot[];
  createdAt: string;
}

export enum UserRole {
  ADMIN = 'IT_ADMIN',         // TI / Governança (NOVO ADMIN)
  STOCK = 'STOCK_MANAGER',    // Almoxarifado / Estoquista (OPERACIONAL)
  PURCHASING = 'PURCHASING_AGENT', // Compras
  MECHANIC = 'MECHANIC_LEAD',  // Mecânica / Sala de Montagem
  SALES = 'SALES_REP' // Vendas / Balcão
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // Em produção, isso seria hash
  role: UserRole;
  department: string;
}

export enum OrderStatus {
  PENDING = 'Pendente',
  QUOTING = 'Em Cotação',
  PURCHASED = 'Comprado',
  IN_TRANSIT = 'Em Trânsito',
  DELIVERED = 'Entregue / Em Estoque',
  CANCELED = 'Cancelado',
  INSTALLED = 'Instalado / Finalizado', // Novo status para fechar o ciclo
  REGISTRATION_REQUEST = 'Solicitação de Cadastro', // Quando o mecanico não acha a peça
  DATA_CORRECTION = 'Correção de Dados' // Quando o mecanico reporta erro no cadastro/manual
}

export interface OrderItem {
  partId: string;
  partName: string;
  internalCode: string;
  quantity: number;
}

// Novos tipos para detalhamento do veículo
export interface VehicleInfo {
  prefix: string;      // Prefixo (ex: 567)
  plate: string;       // Placa (ex: ABC-1234)
  vin: string;         // Número Chassi/VIN
  model: string;       // Modelo (ex: Volvo B270F)
  year: string;        // Ano Fab/Mod
  bodyType: string;    // Carroceria (ex: Padron, Articulado)
}

export enum MaintenanceSystem {
  ENGINE = 'Motor / Arrefecimento',
  TRANSMISSION = 'Câmbio / Transmissão',
  BRAKES = 'Freios / Pneumática',
  SUSPENSION = 'Suspensão / Direção',
  ELECTRICAL = 'Elétrica / Eletrônica',
  AC = 'Ar Condicionado / Climatização',
  BODYWORK = 'Carroceria / Estrutura',
  TIRES = 'Rodagem / Pneus',
  OTHER = 'Outros / Acessórios'
}

export interface Order {
  id: string;
  requesterName: string; // Quem pediu (Estoque)
  requesterId: string; // ID do usuario
  role: UserRole; // Role de quem pediu
  createdAt: string;
  items: OrderItem[];
  status: OrderStatus;
  priority: 'NORMAL' | 'URGENTE';
  notes?: string;
  totalEstimatedValue?: number;
  
  // Novos campos para Oficina (Atualizado)
  vehicleInfo?: VehicleInfo; 
  maintenanceSystem?: MaintenanceSystem; // Qual sistema (Cambio, Motor...)
  maintenanceType?: string; // Descrição do defeito
  
  // Flag para solicitação de cadastro
  isRegistrationRequest?: boolean;
}

export interface SaleRecord {
  id: string;
  date: string;
  customerName: string;
  customerDoc: string; // CPF/CNPJ
  items: OrderItem[];
  totalValue: number;
  sellerName: string;
}

export interface MaintenanceRecord {
  id: string;
  orderId: string;
  vehicleInfo: VehicleInfo; // Detalhes completos
  maintenanceSystem: MaintenanceSystem;
  date: string;
  mechanicName: string;
  description: string;
  items: OrderItem[];
}

export interface SystemSettings {
  maintenanceMode: boolean;
  minAppVersion?: string; // Versão mínima exigida do App (SemVer)
  internalSystemPassword?: string; // Senha para acessar a área de login (Gateway)
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

// --- NOVO TIPO PARA LOG DE AUDITORIA ---
export interface SystemLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'LOGIN' | 'SYSTEM';
  module: 'STOCK' | 'ORDERS' | 'PURCHASING' | 'FLEET' | 'SALES' | 'MAINTENANCE' | 'SYSTEM';
  description: string;
  details?: string; // JSON string for extra details if needed
}

export interface AIProfileResponse {
  name: string;
  internalCode: string;
  originalCode: string;
  category: string;
  supplierName: string;
  supplierEmail: string;
  supplierPhone: string;
  description: string;
  status: string;
  compatibleBrands?: string[];
}

export type Tab = 'dashboard' | 'register' | 'list' | 'orders' | 'users' | 'mechanic_dashboard' | 'history' | 'fleet' | 'sales' | 'system' | 'catalog' | 'logs' | 'diagrams';