
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ShieldCheck, UserCircle2, Users } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('REGISTER');
  const [familyName, setFamilyName] = useState('');
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.PRIMARY);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim() || !userName.trim()) return;

    // Simulating a login/register by creating a user object
    // In a real app, this would validate against a backend
    const familyId = familyName.trim().toLowerCase().replace(/\s+/g, '-');
    
    const user: User = {
      id: Date.now().toString(),
      name: userName,
      familyId: familyId,
      familyName: familyName,
      role: role
    };

    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8 animate-fade-in">
         <div className="relative w-24 h-24 mb-4">
           <div className="absolute inset-0 bg-yellow-700 rounded-full shadow-xl translate-y-2"></div>
           <div className="absolute inset-0 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 rounded-full border-[4px] border-yellow-100 flex items-center justify-center shadow-inner">
             <div className="absolute inset-2 rounded-full border border-yellow-700/20"></div>
             <span className="text-yellow-50 font-serif font-black text-5xl drop-shadow-md">$</span>
           </div>
         </div>
         <h1 className="text-4xl font-['Anton'] text-slate-800">
            MEU <span className="text-emerald-600">DINDIN</span>
         </h1>
         <p className="text-gray-500 mt-2">Gestão Financeira Familiar Inteligente</p>
      </div>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
        <div className="bg-slate-900 p-6 text-center">
           <h2 className="text-xl font-bold text-white">
             {mode === 'REGISTER' ? 'Criar Acesso Familiar' : 'Entrar na Família'}
           </h2>
           <p className="text-slate-400 text-sm mt-1">
             Gerencie finanças em conjunto
           </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          
          {/* Family Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Família</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                required
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                placeholder="Ex: Família Silva"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
               Este nome será sua chave de acesso para compartilhar dados.
            </p>
          </div>

          {/* User Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
            <div className="relative">
              <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                required
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="Ex: Ricardo"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Qual seu perfil?</label>
             <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole(UserRole.PRIMARY)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${role === UserRole.PRIMARY ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                   <div className="font-bold text-gray-800 text-sm mb-1">Principal</div>
                   <div className="text-xs text-gray-500">Gestor financeiro</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole(UserRole.SECONDARY)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${role === UserRole.SECONDARY ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                   <div className="font-bold text-gray-800 text-sm mb-1">Secundário</div>
                   <div className="text-xs text-gray-500">Parceiro(a) / Filho</div>
                </button>
             </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white py-4 rounded-xl font-bold shadow-lg shadow-slate-500/20 transform hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-5 h-5" />
            Acessar Sistema
          </button>

        </form>

        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
           <p className="text-xs text-gray-500">
             Nota: Para visualizar os mesmos dados, ambos os usuários devem digitar exatamente o mesmo <strong>Nome da Família</strong> neste dispositivo.
           </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
