import React, { useState } from 'react';
import { AssemblyDiagram, AutoPart } from '../types';
import { DiagramEditor } from '../components/DiagramEditor';
import { DiagramViewer } from '../components/DiagramViewer';
import { Button } from '../components/Button';
import { PlusCircle, Map } from 'lucide-react';

interface DiagramsManagerProps {
  diagrams: AssemblyDiagram[];
  parts: AutoPart[];
  onSaveDiagram: (data: any) => Promise<void>;
  onDeleteDiagram: (id: string) => Promise<void>;
  onNotify: (msg: string, type: 'success' | 'error') => void;
}

export const DiagramsManager: React.FC<DiagramsManagerProps> = ({ 
  diagrams, parts, onSaveDiagram, onDeleteDiagram, onNotify 
}) => {
  const [selectedDiagram, setSelectedDiagram] = useState<AssemblyDiagram | null>(null);
  const [isEditingDiagram, setIsEditingDiagram] = useState(false);

  const handleSave = async (data: any) => {
    await onSaveDiagram({ ...data, id: selectedDiagram?.id }); // If existing, pass ID via wrapper or logic in App
    setIsEditingDiagram(false);
    setSelectedDiagram(null);
  };

  const handleDelete = async (id: string) => {
    await onDeleteDiagram(id);
    setSelectedDiagram(null);
  };

  if (isEditingDiagram) {
    return (
      <DiagramEditor 
        parts={parts} 
        onSave={(data) => {
             // App logic handles ID generation if new, or update if editing
             if(selectedDiagram) onSaveDiagram({...data, id: selectedDiagram.id});
             else onSaveDiagram(data);
             setIsEditingDiagram(false);
             setSelectedDiagram(null);
        }} 
        onCancel={() => { setIsEditingDiagram(false); setSelectedDiagram(null); }}
        initialData={selectedDiagram || undefined}
      />
    );
  }

  if (selectedDiagram) {
    return (
      <DiagramViewer 
        diagram={selectedDiagram}
        parts={parts}
        onAddToOrder={() => {}} 
        onClose={() => setSelectedDiagram(null)}
        onEdit={() => setIsEditingDiagram(true)}
        onDelete={() => handleDelete(selectedDiagram.id)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500 text-sm">Gerencie os esquemas visuais para a oficina.</p>
        <Button onClick={() => { setSelectedDiagram(null); setIsEditingDiagram(true); }} icon={<PlusCircle className="w-4 h-4"/>}>
          Novo Diagrama
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {diagrams.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded border border-dashed border-gray-300">
            <Map className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>Nenhum diagrama cadastrado.</p>
          </div>
        ) : (
          diagrams.map(diag => (
            <div key={diag.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group" onClick={() => setSelectedDiagram(diag)}>
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  <img src={diag.imageUrl} alt={diag.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                    <span className="text-white text-xs font-bold uppercase tracking-wider bg-red-600 px-2 py-0.5 rounded">{diag.system}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-800">{diag.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{diag.hotspots.length} itens mapeados</p>
                </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};