import React from 'react';
import { UserManagement } from '../components/UserManagement';
import { SystemControl } from '../components/SystemControl';
import { User, UserRole } from '../types';

interface AdminPanelProps {
  activeTab: 'users' | 'system';
  users: User[];
  currentUser: User;
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (id: string, user: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
  onNotify: (msg: string, type: 'success' | 'error') => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  activeTab, users, currentUser, onAddUser, onUpdateUser, onDeleteUser, onNotify
}) => {
  return (
    <div className="space-y-6">
      {activeTab === 'users' && (
        <UserManagement 
          users={users} 
          onAddUser={onAddUser} 
          onUpdateUser={onUpdateUser} 
          onDeleteUser={onDeleteUser} 
          currentUserEmail={currentUser.email} 
        />
      )}
      {activeTab === 'system' && (
        <SystemControl 
          currentUserRole={currentUser.role} 
          onNotify={onNotify} 
        />
      )}
    </div>
  );
};