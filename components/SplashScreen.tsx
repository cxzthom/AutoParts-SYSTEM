import React, { useEffect, useState } from 'react';
import { Car, ShieldCheck, Server, Database, Lock } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Inicializando kernel do sistema...');

  useEffect(() => {
    // Simulação de progresso visual enquanto o App.tsx carrega os dados reais
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Trava em 90% até o App terminar de carregar
        
        // Lógica de mensagens baseada no progresso simulado
        if (prev === 10) setMessage('Estabelecendo conexão segura (SSL)...');
        if (prev === 30) setMessage('Sincronizando banco de dados com Google Drive...');
        if (prev === 50) setMessage('Verificando integridade dos catálogos...');
        if (prev === 70) setMessage('Carregando módulos de segurança...');
        if (prev === 85) setMessage('Preparando interface do usuário...');

        return prev + Math.random() * 5; // Incremento aleatório
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center text-white overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black"></div>
         <div className="grid grid-cols-12 gap-4 w-full h-full opacity-20">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="border-r border-gray-700 h-full transform rotate-12 translate-y-12"></div>
            ))}
         </div>
      </div>

      <div className="z-10 flex flex-col items-center w-full max-w-md px-6">
        {/* Logo Animation */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-red-600 blur-2xl opacity-20 rounded-full animate-pulse"></div>
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-2xl relative">
            <Car className="w-16 h-16 text-white" />
            <div className="absolute -bottom-2 -right-2 bg-red-600 text-white p-1.5 rounded-lg border-4 border-gray-900">
               <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">
          MEC <span className="text-red-600">System</span>
        </h1>
        <p className="text-gray-500 text-sm font-mono mb-10 uppercase tracking-widest">Enterprise Edition v3.0.0</p>

        {/* Progress Bar Container */}
        <div className="w-full bg-gray-800 rounded-full h-1.5 mb-4 overflow-hidden border border-gray-700 relative">
           <div 
             className="bg-gradient-to-r from-red-600 to-red-400 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(220,38,38,0.7)]"
             style={{ width: `${progress}%` }}
           ></div>
        </div>

        {/* Status Text */}
        <div className="flex justify-between w-full text-xs font-mono text-gray-400 h-6">
           <span className="flex items-center gap-2 animate-pulse">
             <Server className="w-3 h-3" />
             {message}
           </span>
           <span className="text-red-500 font-bold">{Math.round(progress)}%</span>
        </div>

        {/* Footer Info */}
        <div className="absolute bottom-8 flex gap-4 text-[10px] text-gray-600 uppercase tracking-wider">
           <div className="flex items-center gap-1"><Lock className="w-3 h-3" /> Criptografado</div>
           <div className="flex items-center gap-1"><Database className="w-3 h-3" /> Cloud Sync</div>
        </div>
      </div>
    </div>
  );
};