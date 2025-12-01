
import React, { useState, useEffect, useMemo } from 'react';
import { AutoPart, PartStatus, PartCategory, POPULAR_BRANDS } from '../types';
import { Button } from './Button';
import { Input, Select } from './Input';
import { generatePartProfile } from '../services/geminiService';
import { Wand2, Save, Box, User, Hash, Image as ImageIcon, Upload, X, Cog, FileText } from 'lucide-react';

interface ClientFormProps {
  onSave: (part: Omit<AutoPart, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: { description: string }; 
  partData?: AutoPart;
  customBrands?: string[];
  customCategories?: string[];
}

export const ClientForm: React.FC<ClientFormProps> = ({ 
  onSave, 
  onCancel, 
  initialData, 
  partData,
  customBrands = [], 
  customCategories = [] 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    internalCode: '',
    originalCode: '',
    category: PartCategory.ENGINE,
    status: PartStatus.IN_STOCK,
    supplierName: '',
    supplierDoc: '', // CPF ou CNPJ
    supplierEmail: '',
    supplierPhone: '',
    description: '',
    imageUrl: '',
    manualUrl: '', 
    compatibleBrands: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const availableBrands = useMemo(() => [...POPULAR_BRANDS, ...customBrands], [customBrands]);
  const availableCategories = useMemo(() => [...Object.values(PartCategory), ...customCategories], [customCategories]);

  // Efeito para preencher o formulário se houver dados de edição ou prompt inicial
  useEffect(() => {
    if (partData) {
        setFormData({
            name: partData.name,
            internalCode: partData.internalCode,
            originalCode: partData.originalCode,
            category: partData.category as PartCategory,
            status: partData.status,
            supplierName: partData.supplierName,
            supplierDoc: partData.supplierDoc,
            supplierEmail: partData.supplierEmail,
            supplierPhone: partData.supplierPhone,
            description: partData.description,
            imageUrl: partData.imageUrl || '',
            manualUrl: partData.manualUrl || '',
            compatibleBrands: partData.compatibleBrands || []
        });
    } else if (initialData?.description) {
      const cleanDesc = initialData.description.replace('SOLICITAÇÃO DE PEÇA NOVA: ', '');
      setPrompt(cleanDesc);
    }
  }, [initialData, partData]);

  // --- Validação ---
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  
  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  };

  const validateDoc = (doc: string) => {
    const cleaned = doc.replace(/\D/g, '');
    return cleaned.length === 11 || cleaned.length === 14;
  };

  const formatPhone = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length > 11) return v.slice(0, 11);
    if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    if (v.length > 2) return v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    return v;
  };

  const formatDoc = (value: string) => {
     const v = value.replace(/\D/g, '');
     if (v.length <= 11) { // CPF Mask
        return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                .replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3')
                .replace(/(\d{3})(\d{3})/, '$1.$2');
     } else { // CNPJ Mask (basic)
        return v.slice(0, 14).replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
     }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    if (name === 'supplierPhone') formattedValue = formatPhone(value);
    if (name === 'supplierDoc') formattedValue = formatDoc(value);

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const toggleBrand = (brand: string) => {
    setFormData(prev => {
      const brands = prev.compatibleBrands || [];
      if (brands.includes(brand)) {
        return { ...prev, compatibleBrands: brands.filter(b => b !== brand) };
      } else {
        return { ...prev, compatibleBrands: [...brands, brand] };
      }
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, manualUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const removeManual = () => {
    setFormData(prev => ({ ...prev, manualUrl: '' }));
  };

  const runValidation = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Nome obrigatório.";
    if (!formData.internalCode.trim()) newErrors.internalCode = "Código interno obrigatório.";
    
    if (formData.supplierEmail && !validateEmail(formData.supplierEmail)) {
      newErrors.supplierEmail = "E-mail inválido.";
    }
    if (formData.supplierPhone && !validatePhone(formData.supplierPhone)) {
      newErrors.supplierPhone = "Telefone inválido.";
    }
    if (formData.supplierDoc && !validateDoc(formData.supplierDoc)) {
      newErrors.supplierDoc = "CPF/CNPJ inválido.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMagicFill = async () => {
    setIsGenerating(true);
    setErrors({});
    try {
      const profile = await generatePartProfile(prompt);
      setFormData({
        name: profile.name,
        internalCode: profile.internalCode,
        originalCode: profile.originalCode || '',
        category: profile.category as PartCategory,
        status: profile.status as PartStatus,
        supplierName: profile.supplierName || '',
        supplierEmail: profile.supplierEmail || '',
        supplierPhone: profile.supplierPhone ? formatPhone(profile.supplierPhone) : '',
        supplierDoc: '', 
        description: profile.description || '',
        imageUrl: '',
        manualUrl: '',
        compatibleBrands: profile.compatibleBrands || []
      });
    } catch (error) {
      alert("Falha ao gerar dados. Verifique a conexão.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (runValidation()) {
      onSave(formData as any);
    } else {
      alert("Corrija os campos em vermelho.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* AI Assistant Banner */}
      <div className="bg-gray-800 text-white p-5 rounded-t-md shadow-lg relative overflow-hidden border-b-4 border-red-700">
        <div className="relative z-10 flex items-start gap-4">
          <div className="bg-gray-700 p-2 rounded">
             <Wand2 className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1">
             <h3 className="font-bold text-lg">Assistente de Cadastro AI</h3>
             <p className="text-gray-400 text-sm mb-3">
               Descreva a peça abaixo (ex: "Embreagem para Volvo B270F") e a Inteligência Artificial preencherá o formulário técnico automaticamente.
             </p>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 placeholder="Digite aqui... (Ex: Filtro de ar Scania K310)"
                 className="flex-1 px-4 py-2 rounded bg-gray-900 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
               />
               <Button onClick={handleMagicFill} isLoading={isGenerating} className="bg-red-600 hover:bg-red-700 border-none">
                 Gerar Dados
               </Button>
             </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-b-md shadow-lg border border-gray-200 space-y-8">
        
        {/* Seção 1: Identificação Técnica */}
        <div>
           <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
             <Box className="w-4 h-4" /> Dados do Produto
           </h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Nome Técnico da Peça" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                error={errors.name}
                placeholder="Ex: Cilindro Mestre de Embreagem"
              />
              <div className="grid grid-cols-2 gap-4">
                 <Input 
                    label="Código Interno (SKU)" 
                    name="internalCode" 
                    value={formData.internalCode} 
                    onChange={handleChange} 
                    error={errors.internalCode}
                    icon={<Hash className="w-3 h-3"/>}
                 />
                 <Input 
                    label="Código Original (OEM)" 
                    name="originalCode" 
                    value={formData.originalCode} 
                    onChange={handleChange} 
                    placeholder="Opcional"
                 />
              </div>
              <Select label="Categoria / Sistema" name="category" value={formData.category} onChange={handleChange}>
                {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Select label="Status de Disponibilidade" name="status" value={formData.status} onChange={handleChange}>
                {Object.values(PartStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
           </div>
        </div>

        {/* Seção 2: Compatibilidade de Marcas */}
        <div>
           <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
             <Cog className="w-4 h-4" /> Compatibilidade de Aplicação
           </h4>
           <div className="bg-gray-50 p-4 rounded border border-gray-200">
             <p className="text-xs text-gray-600 mb-3 font-medium">Selecione as marcas que utilizam esta peça:</p>
             <div className="flex flex-wrap gap-2">
                {availableBrands.map(brand => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => toggleBrand(brand)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      formData.compatibleBrands.includes(brand)
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-gray-500 border-gray-300 hover:border-red-300'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
             </div>
           </div>
        </div>

        {/* Seção 3: Dados do Fornecedor */}
        <div>
           <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
             <User className="w-4 h-4" /> Informações do Fornecedor
           </h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                 label="Razão Social / Fabricante" 
                 name="supplierName" 
                 value={formData.supplierName} 
                 onChange={handleChange} 
              />
              <Input 
                 label="CPF / CNPJ" 
                 name="supplierDoc" 
                 value={formData.supplierDoc} 
                 onChange={handleChange} 
                 error={errors.supplierDoc}
                 placeholder="00.000.000/0000-00"
              />
              <Input 
                 label="E-mail de Contato" 
                 name="supplierEmail" 
                 type="email" 
                 value={formData.supplierEmail} 
                 onChange={handleChange} 
                 error={errors.supplierEmail}
              />
              <Input 
                 label="Telefone Comercial" 
                 name="supplierPhone" 
                 value={formData.supplierPhone} 
                 onChange={handleChange} 
                 error={errors.supplierPhone}
                 placeholder="(00) 00000-0000"
              />
           </div>
        </div>

        {/* Seção 4: Multimídia e Descrição */}
        <div>
           <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
             <FileText className="w-4 h-4" /> Documentação e Imagens
           </h4>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload Imagem */}
              <div className="bg-gray-50 p-4 rounded border border-gray-200 flex flex-col items-center justify-center text-center">
                 {formData.imageUrl ? (
                   <div className="relative w-full h-48 bg-gray-200 rounded overflow-hidden mb-2 border border-gray-300">
                     <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                     <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded hover:bg-red-700">
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                 ) : (
                   <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded mb-2 flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon className="w-10 h-10 mb-2" />
                      <span className="text-xs">Nenhuma imagem selecionada</span>
                   </div>
                 )}
                 <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 px-4 rounded inline-flex items-center gap-2 text-xs uppercase shadow-sm">
                   <Upload className="w-4 h-4" />
                   <span>Carregar Foto da Peça</span>
                   <input type='file' className="hidden" accept="image/*" onChange={handleImageUpload} />
                 </label>
              </div>

              {/* Upload Manual */}
              <div className="bg-gray-50 p-4 rounded border border-gray-200 flex flex-col items-center justify-center text-center">
                 {formData.manualUrl ? (
                    <div className="w-full h-48 bg-white border border-gray-300 rounded flex flex-col items-center justify-center text-green-600 mb-2 relative">
                       <FileText className="w-12 h-12 mb-2" />
                       <span className="font-bold text-sm">Documento Anexado</span>
                       <span className="text-xs text-gray-500">Pronto para envio</span>
                       <button type="button" onClick={removeManual} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded hover:bg-red-700">
                         <X className="w-4 h-4" />
                       </button>
                    </div>
                 ) : (
                    <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded mb-2 flex flex-col items-center justify-center text-gray-400">
                       <FileText className="w-10 h-10 mb-2" />
                       <span className="text-xs">Nenhum manual técnico</span>
                    </div>
                 )}
                 <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 px-4 rounded inline-flex items-center gap-2 text-xs uppercase shadow-sm">
                   <Upload className="w-4 h-4" />
                   <span>Anexar Manual Técnico (PDF/Img)</span>
                   <input type='file' className="hidden" accept="image/*,application/pdf" onChange={handleManualUpload} />
                 </label>
              </div>
           </div>

           <div className="mt-6">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-2">Descrição Detalhada / Aplicação</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                rows={4} 
                className="w-full p-3 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                placeholder="Detalhes técnicos, observações de instalação, etc."
              />
           </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" icon={<Save className="w-4 h-4"/>}>
            {partData ? 'Salvar Alterações' : 'Salvar Cadastro'}
          </Button>
        </div>
      </form>
    </div>
  );
};
