
import React, { useState } from 'react';
import { Lock, Mail, Car, ArrowRight, ShieldCheck, Package, ShoppingCart, Wrench, Server, DollarSign, AlertOctagon } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { UserRole } from '../types';

interface LoginPageProps {
  role: UserRole;
  onLogin: (email: string, pass: string) => Promise<boolean>;
  onBack: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ role, onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isStock = role === UserRole.STOCK;
  const isPurchasing = role === UserRole.PURCHASING;
  const isMechanic = role === UserRole.MECHANIC;
  const isSales = role === UserRole.SALES;
  const isAdmin = role === UserRole.ADMIN;

  let themeColor = 'bg-red-700';
  let themeColorHover = 'hover:bg-red-800';
  let themeText = 'text-red-500';
  let roleName = 'Almoxarifado';
  let roleIcon = <Package className="w-7 h-7 text-white" />;
  let placeholderEmail = "estoque@autoparts.com";
  let description = "Equipe de Logística";
  let responsibility = "Controle de Inventário";

  if (isPurchasing) {
    themeColor = 'bg-blue-600';
    themeColorHover = 'hover:bg-blue-700';
    themeText = 'text-blue-400';
    roleName = 'Procurement';
    roleIcon = <ShoppingCart className="w-7 h-7 text-white" />;
    placeholderEmail = "compras@autoparts.com";
    description = "Equipe de Compras";
    responsibility = "Aprovação de Requisições";
  } else if (isMechanic) {
    themeColor = 'bg-orange-600';
    themeColorHover = 'hover:bg-orange-700';
    themeText = 'text-orange-500';
    roleName = 'Sala de Montagem';
    roleIcon = <Wrench className="w-7 h-7 text-white" />;
    placeholderEmail = "mecanica@autoparts.com";
    description = "Técnicos Mecânicos";
    responsibility = "Diagnóstico e Solicitação";
  } else if (isSales) {
    themeColor = 'bg-green-600';
    themeColorHover = 'hover:bg-green-700';
    themeText = 'text-green-500';
    roleName = 'Vendas / Caixa';
    roleIcon = <DollarSign className="w-7 h-7 text-white" />;
    placeholderEmail = "vendas@autoparts.com";
    description = "Vendedores e Atendentes";
    responsibility = "PDV e Emissão de Notas";
  } else if (isAdmin) {
    themeColor = 'bg-slate-800';
    themeColorHover = 'hover:bg-slate-900';
    themeText = 'text-purple-400';
    roleName = 'TI / Governança';
    roleIcon = <Server className="w-7 h-7 text-white" />;
    placeholderEmail = "admin.ti@autoparts.com";
    description = "Administração do Sistema";
    responsibility = "Gestão de Usuários e Acessos";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const success = await onLogin(email, password);
      
      if (!success) {
        setError(`Credenciais inválidas para o módulo ${roleName.toUpperCase()}.`);
      }
    } catch (err: any) {
      if (err.message === "MAINTENANCE_MODE") {
        setError("ACESSO BLOQUEADO: Sistema em manutenção. Apenas administradores podem logar.");
      } else {
        setError('Erro de conexão com o servidor.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
      
      <div className="absolute inset-0 bg-gray-200" style={{backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>

      <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden relative z-10 flex flex-col md:flex-row border border-gray-300">
        
        {/* Lado Esquerdo - Branding Contextual */}
        <div className="md:w-1/2 bg-gray-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className={`absolute bottom-0 left-0 w-full h-2 ${themeColor}`}></div>
          
          <div className="relative z-10">
             <button onClick={onBack} className="text-gray-400 hover:text-white text-xs mb-6 flex items-center gap-1 transition-colors">&larr; Voltar para Seleção</button>

             <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded flex items-center justify-center shadow-lg ${themeColor}`}>
                  {roleIcon}
                </div>
                <div>
                   <h1 className="text-2xl font-bold tracking-tight">AutoParts<span className={themeText}>ERP</span></h1>
                   <p className="text-gray-400 text-xs uppercase tracking-widest">{isAdmin ? 'Acesso Administrativo' : `Módulo ${roleName}`}</p>
                </div>
             </div>
             
             <div className="space-y-4 mt-8">
               <div className="flex items-center gap-3 text-gray-300">
                 <ShieldCheck className={`w-5 h-5 ${themeText}`} />
                 <span className="text-sm">Acesso Restrito: {description}</span>
               </div>
               <div className="flex items-center gap-3 text-gray-300">
                 <ShieldCheck className={`w-5 h-5 ${themeText}`} />
                 <span className="text-sm">{responsibility}</span>
               </div>
             </div>
          </div>
        </div>

        {/* Lado Direito - Form */}
        <div className="md:w-1/2 p-10 bg-white flex flex-col justify-center">
          <div className="mb-8 border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-800">Login Corporativo</h2>
            <p className="text-gray-500 text-sm mt-1">
              Insira suas credenciais de acesso para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="E-mail Corporativo"
                type="email"
                placeholder={placeholderEmail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
                className="bg-gray-50"
              />
              <Input
                label="Chave de Acesso"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                required
                className="bg-gray-50"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border-l-4 border-red-600 rounded-r-md text-sm text-red-700 font-medium animate-pulse flex items-start gap-2">
                <AlertOctagon className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className={`w-full justify-between group rounded shadow-lg ${themeColor} ${themeColorHover}`}
              size="lg"
              variant="primary"
              isLoading={isLoading}
            >
              <span>Acessar {isAdmin ? 'Painel Admin' : roleName}</span>
              <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
            </Button>
            
             <div className="text-center pt-2">
               <p className="text-xs text-gray-400">Ambiente seguro e monitorado.</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
