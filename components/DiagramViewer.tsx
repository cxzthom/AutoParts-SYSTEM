

import React, { useState, useRef, useEffect } from 'react';
import { AssemblyDiagram, AutoPart, OrderItem } from '../types';
import { Button } from './Button';
import { ShoppingCart, AlertCircle, CheckCircle, Info, Plus, ZoomIn, ZoomOut, Move, RotateCcw, X, Map, ImageOff, Edit2, Trash2 } from 'lucide-react';

interface DiagramViewerProps {
  diagram: AssemblyDiagram;
  parts: AutoPart[];
  onAddToOrder: (items: OrderItem[]) => void;
  onClose: () => void;
  onEdit?: () => void; // Optional: For admin/stock users
  onDelete?: () => void; // Optional: For admin/stock users
}

export const DiagramViewer: React.FC<DiagramViewerProps> = ({ diagram, parts, onAddToOrder, onClose, onEdit, onDelete }) => {
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  
  // Estados de Transformação (Zoom e Pan)
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const activeHotspot = diagram.hotspots.find(h => h.id === activeHotspotId);
  const activePart = activeHotspot ? parts.find(p => p.id === activeHotspot.partId) : null;

  // --- Controles de Zoom ---
  const handleZoom = (delta: number) => {
    setScale(prev => {
      const newScale = Math.min(Math.max(0.5, prev + delta), 4); // Min 0.5x, Max 4x
      if (newScale === 1) setPosition({ x: 0, y: 0 }); // Reset position se voltar ao normal
      return newScale;
    });
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // --- Controles de Mouse (Pan/Arrastar) ---
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation(); 
    // Se segurar CTRL ou apenas rodar, faz zoom
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.5, scale + delta), 5);
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1 || true) { // Permite arrastar sempre
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleAdd = () => {
    if (activePart) {
      onAddToOrder([{
        partId: activePart.id,
        partName: activePart.name,
        internalCode: activePart.internalCode,
        quantity: 1
      }]);
    } else if (activeHotspot) {
      alert(`O item "${activeHotspot.description}" não está cadastrado no sistema. Por favor, solicite o cadastro.`);
    }
  };

  const getPartImage = (part: AutoPart) => {
    return (part.imageUrls && part.imageUrls.length > 0) ? part.imageUrls[0] : part.imageUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-7xl h-[95vh] rounded-lg shadow-2xl flex flex-col overflow-hidden relative border border-gray-700">
        
        {/* Header */}
        <div className="bg-gray-900 text-white p-3 flex justify-between items-center shrink-0 z-20 shadow-md">
           <div className="flex items-center gap-3">
             <div className="bg-orange-600 p-1.5 rounded">
                <Map className="w-5 h-5 text-white" />
             </div>
             <div>
               <h2 className="text-lg font-bold leading-none">{diagram.name}</h2>
               <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">{diagram.system}</span>
             </div>
           </div>
           
           <div className="flex items-center gap-2">
             {onEdit && (
               <button onClick={onEdit} className="p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white transition-colors" title="Editar Diagrama">
                 <Edit2 className="w-5 h-5" />
               </button>
             )}
             {onDelete && (
               <button onClick={onDelete} className="p-2 hover:bg-red-900/50 rounded text-gray-300 hover:text-red-500 transition-colors" title="Excluir Diagrama">
                 <Trash2 className="w-5 h-5" />
               </button>
             )}
             <div className="h-6 w-px bg-gray-700 mx-2"></div>
             <button 
               onClick={onClose} 
               className="p-2 hover:bg-gray-700 rounded-full transition-colors"
               title="Fechar"
             >
               <X className="w-6 h-6 text-gray-300" />
             </button>
           </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
           
           {/* Área da Imagem (Canvas) */}
           <div 
             className="flex-1 bg-gray-100 overflow-hidden relative cursor-move select-none" 
             onWheel={handleWheel}
             onMouseDown={handleMouseDown}
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseUp}
             ref={containerRef}
           >
              {/* Grid Background para referência técnica */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" 
                   style={{ 
                     backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
                     backgroundSize: '20px 20px' 
                   }}>
              </div>

              {/* Container Transformado */}
              <div 
                className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-linear origin-center"
                style={{ 
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                }}
              >
                <div className="relative inline-block shadow-2xl bg-white">
                  <img 
                    src={diagram.imageUrl} 
                    alt={diagram.name} 
                    className="max-w-none h-auto pointer-events-none" 
                    style={{ maxHeight: '80vh', maxWidth: '80vw' }} // Limite base inicial
                  />
                  
                  {/* Hotspots */}
                  {diagram.hotspots.map(spot => (
                    <button
                      key={spot.id}
                      onClick={(e) => { e.stopPropagation(); setActiveHotspotId(spot.id); }}
                      onMouseDown={(e) => e.stopPropagation()} // Evita iniciar drag ao clicar no botão
                      className={`absolute rounded-full flex items-center justify-center font-bold border-2 shadow-lg transition-colors z-10 ${
                        activeHotspotId === spot.id 
                          ? 'bg-white text-red-600 border-red-600 z-20' 
                          : 'bg-red-600/90 text-white border-white hover:bg-red-700'
                      }`}
                      style={{ 
                        left: `${spot.x}%`, 
                        top: `${spot.y}%`,
                        // Mantém o tamanho do botão constante visualmente dividindo pelo scale
                        width: `${32 / scale}px`,
                        height: `${32 / scale}px`,
                        marginLeft: `-${16 / scale}px`,
                        marginTop: `-${16 / scale}px`,
                        fontSize: `${14 / scale}px`,
                        borderWidth: `${2 / scale}px`
                      }}
                    >
                      {spot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Controles Flutuantes */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white p-2 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2 border border-gray-700 z-30">
                 <button onClick={() => handleZoom(-0.25)} className="p-2 hover:bg-gray-700 rounded-full" title="Zoom Out"><ZoomOut className="w-5 h-5"/></button>
                 <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
                 <button onClick={() => handleZoom(0.25)} className="p-2 hover:bg-gray-700 rounded-full" title="Zoom In"><ZoomIn className="w-5 h-5"/></button>
                 <div className="w-px h-6 bg-gray-700 mx-1"></div>
                 <button onClick={resetView} className="p-2 hover:bg-gray-700 rounded-full" title="Resetar Vista"><RotateCcw className="w-4 h-4"/></button>
              </div>
              
              <div className="absolute top-4 left-4 bg-white/80 backdrop-blur p-2 rounded text-[10px] text-gray-500 font-mono border border-gray-200 pointer-events-none select-none">
                 <div className="flex items-center gap-1"><Move className="w-3 h-3"/> Arrastar para mover</div>
                 <div className="flex items-center gap-1"><ZoomIn className="w-3 h-3"/> Scroll para Zoom</div>
              </div>
           </div>

           {/* Detail Sidebar */}
           {activeHotspot && (
             <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-2xl animate-in slide-in-from-right absolute right-0 inset-y-0 z-40">
               <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center text-xl font-bold shadow-md border-4 border-red-50">
                      {activeHotspot.label}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Item Selecionado</h3>
                      <p className="text-xs text-gray-500">Detalhes técnicos</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveHotspotId(null)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
               </div>

               {activePart ? (
                 <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    <div>
                       <p className="text-xs text-gray-500 uppercase font-bold mb-1">Peça Cadastrada</p>
                       <p className="font-bold text-gray-900 text-xl leading-tight">{activePart.name}</p>
                    </div>
                    
                    <div className="aspect-video w-full bg-gray-100 rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                       {getPartImage(activePart) ? (
                         <img src={getPartImage(activePart)} alt={activePart.name} className="w-full h-full object-cover" />
                       ) : (
                         <div className="flex flex-col items-center text-gray-400">
                           <ImageOff className="w-8 h-8 mb-1" />
                           <span className="text-xs">Sem Imagem</span>
                         </div>
                       )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                         <p className="text-[10px] text-gray-500 uppercase font-bold">Código Interno</p>
                         <p className="font-mono text-gray-800 font-bold">{activePart.internalCode}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                         <p className="text-[10px] text-gray-500 uppercase font-bold">OEM</p>
                         <p className="font-mono text-gray-800">{activePart.originalCode}</p>
                      </div>
                    </div>

                    <div>
                       <p className="text-xs text-gray-500 uppercase font-bold mb-1">Status</p>
                       <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                         activePart.status === 'Em Estoque' 
                           ? 'bg-green-100 text-green-700 border-green-200' 
                           : 'bg-red-100 text-red-700 border-red-200'
                       }`}>
                         {activePart.status === 'Em Estoque' ? <CheckCircle className="w-3 h-3"/> : <AlertCircle className="w-3 h-3"/>}
                         {activePart.status}
                       </span>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                       <p className="text-xs text-blue-800 font-bold mb-1 flex items-center gap-1"><Info className="w-3 h-3"/> Aplicação / Notas</p>
                       <p className="text-sm text-blue-900 italic">"{activePart.description}"</p>
                    </div>
                 </div>
               ) : (
                 <div className="p-6 flex-1">
                   <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 text-yellow-800 mb-6 text-center">
                     <AlertCircle className="w-10 h-10 mb-3 mx-auto opacity-50" />
                     <p className="font-bold">Item não vinculado</p>
                     <p className="text-sm mt-1">Este número está marcado no desenho técnico, mas não possui vínculo com um SKU do estoque no momento.</p>
                   </div>
                   <div>
                       <p className="text-xs text-gray-500 uppercase font-bold mb-2">Descrição no Desenho</p>
                       <p className="font-bold text-gray-900 text-lg border-l-4 border-gray-300 pl-3">{activeHotspot.description || "Sem descrição disponível"}</p>
                   </div>
                 </div>
               )}

               <div className="p-6 bg-gray-50 border-t border-gray-200">
                 <Button 
                   onClick={handleAdd} 
                   className={`w-full py-4 text-sm shadow-lg ${activePart ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                   disabled={!activePart}
                   icon={activePart ? <Plus className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                 >
                   {activePart ? 'ADICIONAR AO PEDIDO' : 'ITEM INDISPONÍVEL'}
                 </Button>
                 {!activePart && (
                   <p className="text-[10px] text-center text-gray-500 mt-2">
                     Para solicitar esta peça, use a aba "Solicitação" no painel principal.
                   </p>
                 )}
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
