
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { X, Save, UserCircle2, Users, Shield } from 'lucide-react';

interface SettingsModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user.name);
  const [familyName, setFamilyName] = useState(user.familyName);
  const [role, setRole] = useState<UserRole>(user.role);

  const handleSave = () => {
     if (!name.trim() || !familyName.trim()) return;
     
     // Generate ID from name (slug)
     const familyId = familyName.trim().toLowerCase().replace(/\s+/g, '-');
     
     const updatedUser: User = {
         ...user,
         name,
         familyName,
         familyId,
         role
     };
     onSave(updatedUser);
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      Configurações
                  </h3>
                  <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                      <X className="w-5 h-5"/>
                  </button>
              </div>
              
              <div className="p-6 space-y-5">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
                      <strong>Nota:</strong> O "Nome da Família" funciona como sua chave de acesso. Ao alterá-lo, você mudará para o espaço de dados daquela família.
                  </div>

                  {/* Family Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nome da Família</label>
                    <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                            value={familyName}
                            onChange={e => setFamilyName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Ex: Minha Família"
                        />
                    </div>
                  </div>
                  
                  {/* User Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Seu Nome</label>
                    <div className="relative">
                        <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Ex: Visitante"
                        />
                    </div>
                  </div>

                   {/* Role */}
                   <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Perfil de Acesso</label>
                        <div className="flex gap-3">
                             <button 
                                type="button" 
                                onClick={() => setRole(UserRole.PRIMARY)} 
                                className={`flex-1 p-3 border rounded-xl text-xs font-bold transition-all ${role === UserRole.PRIMARY ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                             >
                                 PRINCIPAL
                                 <span className="block font-normal text-[10px] mt-1 opacity-75">Gestor Financeiro</span>
                             </button>
                             <button 
                                type="button" 
                                onClick={() => setRole(UserRole.SECONDARY)} 
                                className={`flex-1 p-3 border rounded-xl text-xs font-bold transition-all ${role === UserRole.SECONDARY ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                             >
                                 SECUNDÁRIO
                                 <span className="block font-normal text-[10px] mt-1 opacity-75">Dependente</span>
                             </button>
                        </div>
                   </div>

                  <button 
                    onClick={handleSave} 
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-slate-200 mt-2 flex items-center justify-center gap-2 transition-all"
                  >
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                  </button>
              </div>
          </div>
      </div>
  );
};
export default SettingsModal;
