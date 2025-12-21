import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Button } from './Button';
import { Input, Select } from './Input';
import { Trash2, UserPlus, Shield, Users, Lock, Mail, Edit2, CheckCircle2, X } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (id: string, user: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
  currentUserEmail: string;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser, currentUserEmail }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.MECHANIC,
    department: 'Oficina Mecânica'
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'TI / Administrador';
      case UserRole.STOCK: return 'Gerente de Estoque';
      case UserRole.PURCHASING: return 'Agente de Compras';
      case UserRole.MECHANIC: return 'Mecânico / Montagem';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-purple-100 text-purple-800 border-purple-200';
      case UserRole.STOCK: return 'bg-red-100 text-red-800 border-red-200';
      case UserRole.PURCHASING: return 'bg-blue-100 text-blue-800 border-blue-200';
      case UserRole.MECHANIC: return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      department: user.department
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', password: '', role: UserRole.MECHANIC, department: 'Oficina Mecânica' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    if (editingId) {
      onUpdateUser(editingId, formData);
      alert("Usuário atualizado com sucesso!");
    } else {
      onAddUser(formData);
      alert("Usuário criado com sucesso!");
    }
    
    cancelEdit();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Lista de Usuários */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-md border border-gray-300 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-800">Diretório de Usuários Ativos</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-bold">Colaborador</th>
                  <th className="px-6 py-3 font-bold">Função / Acesso</th>
                  <th className="px-6 py-3 font-bold">Credenciais</th>
                  <th className="px-6 py-3 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className={`transition-colors ${editingId === user.id ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wide ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-3 h-3" /> {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-xs mt-1">
                        <Lock className="w-3 h-3" /> {editingId === user.id ? user.password : '••••••••'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(user)}
                          className={`p-2 rounded transition-colors ${editingId === user.id ? 'text-purple-700 bg-purple-100' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                          title="Editar Usuário"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        {user.email !== currentUserEmail ? (
                          <button 
                            onClick={() => onDeleteUser(user.id)}
                            className="text-gray-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-colors"
                            title="Revogar Acesso"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-purple-600 italic border border-purple-200 px-2 py-0.5 rounded bg-purple-50">Admin TI</span>
                        )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Formulário de Cadastro/Edição */}
      <div className="lg:col-span-1">
        <div className={`bg-white p-6 rounded-md border shadow-sm sticky top-6 ${editingId ? 'border-purple-300 ring-4 ring-purple-50' : 'border-gray-300'}`}>
           <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
             <div className="flex items-center gap-2">
               <div className={`${editingId ? 'bg-blue-100' : 'bg-purple-100'} p-2 rounded`}>
                  {editingId ? <Edit2 className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-purple-600" />}
               </div>
               <div>
                 <h3 className="font-bold text-gray-800">{editingId ? 'Editar Usuário' : 'Novo Cadastro'}</h3>
                 <p className="text-xs text-gray-500">{editingId ? 'Alterar informações e senha' : 'Adicionar acesso ao portal'}</p>
               </div>
             </div>
             {editingId && (
               <button onClick={cancelEdit} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                 <X className="w-3 h-3" /> Cancelar
               </button>
             )}
           </div>

           <form onSubmit={handleSubmit} className="space-y-4">
              <Input 
                label="Nome Completo" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: João Silva"
                required
              />
              
              <Input 
                label="E-mail de Acesso" 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="usuario@autoparts.com"
                required
              />

              <Input 
                label={editingId ? "Nova Senha" : "Senha Provisória"}
                type="text" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••"
                required
              />

              <Select 
                label="Perfil de Acesso"
                value={formData.role}
                onChange={(e) => {
                  const role = e.target.value as UserRole;
                  let dept = 'Oficina Mecânica';
                  if (role === UserRole.STOCK) dept = 'Logística e Estoque';
                  if (role === UserRole.PURCHASING) dept = 'Depto. de Compras';
                  if (role === UserRole.ADMIN) dept = 'Tecnologia da Informação';
                  setFormData({...formData, role, department: dept});
                }}
              >
                <option value={UserRole.STOCK}>Estoque</option>
                <option value={UserRole.PURCHASING}>Compras</option>
                <option value={UserRole.MECHANIC}>Mecânica</option>
                <option value={UserRole.ADMIN}>TI / Admin</option>
              </Select>

              {editingId ? (
                <div className="bg-yellow-50 p-3 rounded border border-yellow-100 text-xs text-yellow-800">
                  <p className="flex items-start gap-2">
                    <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                    Ao salvar, a senha será atualizada imediatamente e o usuário deverá usar a nova credencial.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 p-3 rounded border border-blue-100 text-xs text-blue-800">
                  <p className="flex items-start gap-2">
                    <Shield className="w-4 h-4 mt-0.5 shrink-0" />
                    O novo usuário terá acesso imediato ao portal selecionado utilizando as credenciais acima.
                  </p>
                </div>
              )}

              <Button type="submit" className={`w-full ${editingId ? 'bg-blue-600 hover:bg-blue-700 border-blue-600' : 'bg-purple-600 hover:bg-purple-700 border-purple-600'}`} icon={editingId ? <CheckCircle2 className="w-4 h-4"/> : <UserPlus className="w-4 h-4"/>}>
                {editingId ? 'Salvar Alterações' : 'Criar Credencial'}
              </Button>
           </form>
        </div>
      </div>
    </div>
  );
};