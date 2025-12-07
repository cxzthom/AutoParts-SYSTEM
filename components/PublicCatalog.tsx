import React, { useState } from 'react';
import { AutoPart, AssemblyDiagram, VehicleInfo } from '../types';
import { ClientList } from './ClientList';
import { DiagramViewer } from './DiagramViewer';
import { Search, Map, Grid, ShieldCheck, User, Menu, X } from 'lucide-react';

interface PublicCatalogProps {
  parts: AutoPart[];
  diagrams: AssemblyDiagram[];
  vehiclesDB: VehicleInfo[];
  onAccessInternal: () => void;
}

export const PublicCatalog: React.FC<PublicCatalogProps> = ({ parts, diagrams, vehiclesDB, onAccessInternal }) => {
  const [activeTab, setActiveTab] = useState<'parts' | 'diagrams'>('parts');
  const [selectedDiagram, setSelectedDiagram] = useState<AssemblyDiagram | null>(null);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header Público / Kiosk (Sticky on Mobile) */}
      <header className="bg-gray-900 text-white shadow-lg sticky top-0 z-30 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
          
          {/* Logo Area */}
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-1.5 md:p-2 rounded-lg shadow-lg shadow-red-900/50">
              <Search className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold tracking-tight leading-none">MEC System</h1>
              <p className="text-[10px] md:text-xs text-gray-400 font-mono uppercase tracking-widest hidden md:block">Consulta Pública • Catálogo Digital</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
             <button
               onClick={() => setActiveTab('parts')}
               className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                 activeTab === 'parts' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'
               }`}
             >
               <Grid className="w-4 h-4" /> Peças
             </button>
             <button
               onClick={() => setActiveTab('diagrams')}
               className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                 activeTab === 'diagrams' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'
               }`}
             >
               <Map className="w-4 h-4" /> Vistas Explodidas
             </button>
             
             <div className="h-8 w-px bg-gray-700 mx-2"></div>

             <button
               onClick={onAccessInternal}
               className="flex items-center gap-2 px-4 py-2 rounded border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-800 transition-all text-xs font-bold uppercase tracking-wide"
             >
               <ShieldCheck className="w-4 h-4" /> Área Restrita
             </button>
          </div>

          {/* Mobile Access Button (Compact) */}
          <div className="md:hidden">
            <button
               onClick={onAccessInternal}
               className="p-2 bg-gray-800 rounded-full text-gray-300 hover:text-white hover:bg-gray-700 border border-gray-700"
               title="Área Restrita"
             >
               <ShieldCheck className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Mobile Tab Navigation Bar */}
        <div className="md:hidden grid grid-cols-2 border-t border-gray-800 bg-gray-900">
           <button
             onClick={() => setActiveTab('parts')}
             className={`flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${
               activeTab === 'parts' ? 'bg-gray-800 text-white border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-300'
             }`}
           >
             <Grid className="w-4 h-4" /> Catálogo de Peças
           </button>
           <button
             onClick={() => setActiveTab('diagrams')}
             className={`flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${
               activeTab === 'diagrams' ? 'bg-gray-800 text-white border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-300'
             }`}
           >
             <Map className="w-4 h-4" /> Vistas Explodidas
           </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto bg-gray-100">
        <div className="max-w-7xl mx-auto px-2 py-4 sm:p-8">
          
          {activeTab === 'parts' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
              <ClientList 
                clients={parts}
                onDelete={() => {}} 
                onCreateOrder={() => {}} 
                canEdit={false} 
                viewOnly={true} // Desativa checkboxes e botões de ação
                showPrice={false}
              />
            </div>
          )}

          {activeTab === 'diagrams' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
               <div className="mb-4 md:mb-6 bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
                 <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-1">
                   <Map className="w-5 h-5 text-red-600" /> Diagramas Técnicos
                 </h2>
                 <p className="text-gray-500 text-xs md:text-sm">
                   Toque em um sistema para visualizar a montagem e identificar componentes.
                 </p>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {diagrams.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded border border-dashed border-gray-300">
                      <Map className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p>Nenhum diagrama disponível no catálogo público.</p>
                    </div>
                  ) : (
                    diagrams.map(diag => (
                      <div 
                        key={diag.id} 
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer active:scale-[0.98] md:hover:shadow-xl md:hover:-translate-y-1 transition-all duration-300 group" 
                        onClick={() => setSelectedDiagram(diag)}
                      >
                          <div className="h-48 md:h-56 bg-gray-100 relative overflow-hidden">
                            <img src={diag.imageUrl} alt={diag.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                            
                            {/* Overlay Title */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-12">
                              <span className="text-white text-[10px] font-bold uppercase tracking-widest bg-red-600 px-2 py-0.5 rounded mb-1 inline-block shadow-sm">
                                {diag.system}
                              </span>
                              <h3 className="font-bold text-white text-base md:text-lg leading-tight line-clamp-2">
                                {diag.name}
                              </h3>
                            </div>
                          </div>
                          
                          <div className="p-3 md:p-4 flex justify-between items-center bg-white">
                            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              {diag.hotspots.length} peças mapeadas
                            </span>
                            <span className="text-red-600 text-xs font-bold uppercase flex items-center gap-1 group-hover:underline">
                              Abrir <Map className="w-3 h-3"/>
                            </span>
                          </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-[10px] md:text-xs text-gray-400 uppercase tracking-widest font-mono">
        MEC System • Módulo de Consulta Pública
      </footer>

      {/* Modal Diagrama */}
      {selectedDiagram && (
        <DiagramViewer 
          diagram={selectedDiagram}
          parts={parts}
          onAddToOrder={() => alert('Para realizar pedidos, dirija-se ao balcão de atendimento.')}
          onClose={() => setSelectedDiagram(null)}
        />
      )}
    </div>
  );
};