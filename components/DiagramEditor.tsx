

import React, { useState, useRef, useEffect } from 'react';
import { AssemblyDiagram, DiagramHotspot, MaintenanceSystem, AutoPart, PartStatus } from '../types';
import { Button } from './Button';
import { Input, Select } from './Input';
import { Image as ImageIcon, Crosshair, Plus, Trash2, Save, Search, CheckSquare } from 'lucide-react';

interface DiagramEditorProps {
  onSave: (diagram: Omit<AssemblyDiagram, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  parts: AutoPart[];
  initialData?: AssemblyDiagram; // Optional: For editing mode
}

export const DiagramEditor: React.FC<DiagramEditorProps> = ({ onSave, onCancel, parts, initialData }) => {
  const [name, setName] = useState('');
  const [system, setSystem] = useState<MaintenanceSystem>(MaintenanceSystem.TRANSMISSION);
  const [imageUrl, setImageUrl] = useState('');
  const [hotspots, setHotspots] = useState<DiagramHotspot[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);

  // States for adding a new hotspot
  const [isSelectingPoint, setIsSelectingPoint] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [labelNumber, setLabelNumber] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [partSearch, setPartSearch] = useState('');

  // Load initial data if provided (Edit Mode)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSystem(initialData.system);
      setImageUrl(initialData.imageUrl);
      setHotspots(initialData.hotspots);
    }
  }, [initialData]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isSelectingPoint || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newHotspot: DiagramHotspot = {
      id: Math.random().toString(36).substr(2, 9),
      label: labelNumber || (hotspots.length + 1).toString(),
      x,
      y,
      partId: selectedPartId || null,
      description: !selectedPartId ? manualDescription : undefined
    };

    setHotspots([...hotspots, newHotspot]);
    
    // Reset form
    setIsSelectingPoint(false);
    setSelectedPartId(null);
    setLabelNumber('');
    setManualDescription('');
    setPartSearch('');
  };

  const removeHotspot = (id: string) => {
    setHotspots(hotspots.filter(h => h.id !== id));
  };

  const handleSave = () => {
    if (!name || !imageUrl) {
      alert("Nome e Imagem são obrigatórios.");
      return;
    }
    onSave({ name, system, imageUrl, hotspots });
  };

  const filteredParts = parts.filter(p => 
    p.name.toLowerCase().includes(partSearch.toLowerCase()) || 
    p.internalCode.toLowerCase().includes(partSearch.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Crosshair className="w-6 h-6 text-red-600" /> {initialData ? 'Editar Vista Explodida' : 'Novo Editor de Vista Explodida'}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form & Controls */}
        <div className="space-y-4">
          <Input label="Nome do Diagrama" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Câmbio Eaton - Eixo Secundário" />
          
          <Select label="Sistema" value={system} onChange={e => setSystem(e.target.value as MaintenanceSystem)}>
            {Object.values(MaintenanceSystem).map(s => <option key={s} value={s}>{s}</option>)}
          </Select>

          {!imageUrl && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <ImageIcon className="w-12 h-12 mb-2" />
              <p className="text-sm font-bold mb-2">Carregar Imagem da Explodida</p>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm text-gray-500" />
            </div>
          )}

          {imageUrl && (
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <h3 className="font-bold text-gray-700 text-sm mb-3">Adicionar Ponto de Referência</h3>
              
              <div className="space-y-3">
                 <Input 
                   label="Número no Desenho" 
                   value={labelNumber} 
                   onChange={e => setLabelNumber(e.target.value)} 
                   placeholder="Ex: 1, 2, 5A..." 
                   className="w-24"
                 />
                 
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-700 uppercase">Vincular Peça (Opcional)</label>
                   <div className="relative">
                      <Search className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        value={partSearch} 
                        onChange={e => setPartSearch(e.target.value)}
                        placeholder="Buscar peça..."
                        className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm"
                      />
                   </div>
                   {partSearch && (
                     <div className="max-h-32 overflow-y-auto border border-gray-200 rounded bg-white text-xs">
                        {filteredParts.map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => { setSelectedPartId(p.id); setPartSearch(p.name); }}
                            className={`p-2 cursor-pointer hover:bg-red-50 flex justify-between ${selectedPartId === p.id ? 'bg-red-100 font-bold' : ''}`}
                          >
                             <span>{p.name}</span>
                             <span className="font-mono">{p.internalCode}</span>
                          </div>
                        ))}
                     </div>
                   )}
                 </div>

                 {!selectedPartId && (
                   <Input 
                     label="Descrição Manual (Se não cadastrada)" 
                     value={manualDescription} 
                     onChange={e => setManualDescription(e.target.value)} 
                     placeholder="Ex: Arruela de Encosto"
                   />
                 )}

                 <Button 
                   onClick={() => setIsSelectingPoint(true)} 
                   className={`w-full ${isSelectingPoint ? 'bg-green-600 animate-pulse' : 'bg-gray-800'}`}
                   disabled={isSelectingPoint}
                 >
                   {isSelectingPoint ? 'Clique na imagem para posicionar' : 'Posicionar Ponto'}
                 </Button>
                 {isSelectingPoint && <p className="text-xs text-center text-green-700 font-bold">Agora clique na imagem ao lado &rarr;</p>}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} icon={<Save className="w-4 h-4" />} className="flex-1">Salvar Diagrama</Button>
          </div>
        </div>

        {/* Right Column: Image Preview & Hotspots */}
        <div className="lg:col-span-2 flex flex-col h-full">
           {imageUrl ? (
             <div className="relative bg-gray-100 border border-gray-300 rounded overflow-hidden shadow-inner flex-1 flex items-center justify-center">
                <div className="relative inline-block w-full">
                  <img 
                    ref={imageRef} 
                    src={imageUrl} 
                    alt="Diagrama" 
                    className={`w-full h-auto object-contain ${isSelectingPoint ? 'cursor-crosshair' : ''}`} 
                    onClick={handleImageClick}
                  />
                  {hotspots.map(spot => (
                    <div 
                      key={spot.id}
                      className="absolute w-6 h-6 -ml-3 -mt-3 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-md cursor-pointer hover:bg-red-700 hover:scale-110 transition-transform z-10"
                      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                      title={parts.find(p => p.id === spot.partId)?.name || spot.description}
                    >
                      {spot.label}
                    </div>
                  ))}
                </div>
             </div>
           ) : (
             <div className="h-full bg-gray-50 rounded border border-gray-200 flex items-center justify-center text-gray-400">
               <p>Visualização da Imagem</p>
             </div>
           )}

           {/* Hotspot List */}
           {hotspots.length > 0 && (
             <div className="mt-4 bg-white border border-gray-200 rounded p-3">
               <h4 className="font-bold text-xs text-gray-500 uppercase mb-2">Itens Mapeados</h4>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                 {hotspots.map(spot => {
                   const part = parts.find(p => p.id === spot.partId);
                   return (
                     <div key={spot.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-100 text-xs">
                        <span className="bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0">{spot.label}</span>
                        <div className="flex-1 truncate">
                           {part ? (
                             <>
                               <span className="font-bold block truncate">{part.name}</span>
                               <span className="font-mono text-gray-500">{part.internalCode}</span>
                             </>
                           ) : (
                             <span className="italic text-gray-600">{spot.description || 'Sem descrição'}</span>
                           )}
                        </div>
                        <button onClick={() => removeHotspot(spot.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                     </div>
                   );
                 })}
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
