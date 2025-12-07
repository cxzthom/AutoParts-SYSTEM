import React, { useState } from 'react';
import { Lock, Mail, Car, ArrowRight, ShieldCheck, Package, ShoppingCart, Wrench, Server, DollarSign, AlertOctagon, ChevronLeft, HelpCircle } from 'lucide-react';
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

  // Configuração de Tema baseada no Papel (Modernizada com Gradientes)
  let themeGradient = 'from-red-900 to-red-700';
  let accentColor = 'text-red-600';
  let buttonColor = 'bg-red-600 hover:bg-red-700';
  let roleName = 'Almoxarifado';
  let roleIcon = <Package className="w-10 h-10 text-white opacity-90" />;
  let placeholderEmail = "estoque@mecsystem.com";
  let description = "Gestão Logística & Inventário";
  let bgPattern = "radial-gradient(circle at 10% 20%, rgba(255, 0, 0, 0.1) 0%, transparent 20%)";

  if (isPurchasing) {
    themeGradient = 'from-blue-900 to-blue-700';
    accentColor = 'text-blue-600';
    buttonColor = 'bg-blue-600 hover:bg-blue-700';
    roleName = 'Central de Compras';
    roleIcon = <ShoppingCart className="w-10 h-10 text-white opacity-90" />;
    placeholderEmail = "compras@mecsystem.com";
    description = "Procurement & Cotações";
    bgPattern = "radial-gradient(circle at 90% 80%, rgba(0, 0, 255, 0.1) 0%, transparent 20%)";
  } else if (isMechanic) {
    themeGradient = 'from-orange-900 to-orange-600';
    accentColor = 'text-orange-600';
    buttonColor = 'bg-orange-600 hover:bg-orange-700';
    roleName = 'Oficina Mecânica';
    roleIcon = <Wrench className="w-10 h-10 text-white opacity-90" />;
    placeholderEmail = "mecanica@mecsystem.com";
    description = "Diagnóstico & Manutenção";
  } else if (isSales) {
    themeGradient = 'from-emerald-900 to-emerald-600';
    accentColor = 'text-emerald-600';
    buttonColor = 'bg-emerald-600 hover:bg-emerald-700';
    roleName = 'Frente de Caixa';
    roleIcon = <DollarSign className="w-10 h-10 text-white opacity-90" />;
    placeholderEmail = "vendas@mecsystem.com";
    description = "PDV & Faturamento";
  } else if (isAdmin) {
    themeGradient = 'from-slate-900 to-slate-800';
    accentColor = 'text-purple-600';
    buttonColor = 'bg-slate-800 hover:bg-slate-900 border border-slate-700';
    roleName = 'Governança de TI';
    roleIcon = <Server className="w-10 h-10 text-white opacity-90" />;
    placeholderEmail = "admin.ti@mecsystem.com";
    description = "Administração Global";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Simulação de delay de rede para feedback visual
      await new Promise(resolve => setTimeout(resolve, 800));
      const success = await onLogin(email, password);
      
      if (!success) {
        setError(`Credenciais inválidas ou acesso não autorizado.`);
      }
    } catch (err: any) {
      if (err.message === "MAINTENANCE_MODE") {
        setError("BLOQUEIO DE SEGURANÇA: Sistema em manutenção.");
      } else {
        setError('Falha de conexão com o servidor seguro.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative bg-gray-50 overflow-hidden">
      
      {/* Background Decorativo Global */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-gray-300 opacity-20 blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[600px] border border-gray-100">
        
        {/* Lado Esquerdo - Branding Imersivo */}
        <div className={`relative md:w-5/12 bg-gradient-to-br ${themeGradient} p-12 flex flex-col justify-between text-white overflow-hidden`}>
          
          {/* Padrões de Fundo */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: bgPattern }}></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full border-[20px] border-white opacity-5"></div>
          <div className="absolute top-12 right-12 w-32 h-32 rounded-full border-[10px] border-white opacity-5"></div>
          
          <div className="relative z-10">
            <button 
              onClick={onBack} 
              className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors mb-8"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
              Mudar Portal
            </button>
            
            <div className="bg-white/10 backdrop-blur-md w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/20">
               {roleIcon}
            </div>
            
            <h1 className="text-3xl font-bold mb-2 tracking-tight">
              MEC <span className="font-light opacity-80">System</span>
            </h1>
            <div className="h-1 w-12 bg-white/50 rounded mb-4"></div>
            <p className="text-lg font-medium text-white/90">{roleName}</p>
            <p className="text-sm text-white/60 mt-1">{description}</p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg backdrop-blur-sm border border-white/10">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-xs font-bold text-white">Ambiente Seguro</p>
                <p className="text-[10px] text-white/60">Criptografia ponta-a-ponta ativa</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito - Formulário Clean */}
        <div className="md:w-7/12 p-10 md:p-16 flex flex-col justify-center bg-white relative">
          
          <div className="max-w-md w-full mx-auto space-y-8">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h2>
              <p className="text-gray-500 mt-2 text-sm">Insira suas credenciais corporativas para acessar o painel.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="space-y-5">
                <div className="group">
                  <Input
                    label="E-mail Corporativo"
                    type="email"
                    placeholder={placeholderEmail}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail className={`w-4 h-4 ${accentColor}`} />}
                    required
                    className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                  />
                </div>
                
                <div className="group">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Senha</label>
                    <a href="#" className={`text-xs font-medium hover:underline ${accentColor}`}>Esqueceu a senha?</a>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <Lock className={`w-4 h-4 ${accentColor}`} />
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`w-full h-12 py-2 border rounded-md bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-20 focus:bg-white transition-all pl-10 pr-3 border-gray-200 focus:border-${accentColor.split('-')[1]}-500 focus:ring-${accentColor.split('-')[1]}-500`}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 animate-in shake">
                  <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-red-800">Falha na Autenticação</h4>
                    <p className="text-xs text-red-600 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className={`w-full h-12 text-base font-bold shadow-lg shadow-gray-200 transition-all hover:scale-[1.01] active:scale-[0.99] ${buttonColor}`}
                isLoading={isLoading}
              >
                <span className="flex items-center gap-2">
                  Acessar Plataforma <ArrowRight className="w-4 h-4" />
                </span>
              </Button>
            </form>

            <div className="pt-6 border-t border-gray-100 flex items-center justify-center gap-6 text-xs text-gray-400">
               <span className="hover:text-gray-600 cursor-pointer flex items-center gap-1">
                 <HelpCircle className="w-3 h-3" /> Suporte
               </span>
               <span>•</span>
               <span className="hover:text-gray-600 cursor-pointer">Termos de Uso</span>
               <span>•</span>
               <span className="hover:text-gray-600 cursor-pointer">Privacidade</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Version Info */}
      <div className="absolute bottom-4 text-center w-full text-[10px] text-gray-400 font-mono">
        v1.0.21 stable • Secured by MEC IT
      </div>
    </div>
  );
};