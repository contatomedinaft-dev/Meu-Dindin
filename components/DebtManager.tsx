
import React, { useState, useEffect } from 'react';
import { Debt, DebtStatus, DebtCategory } from '../types';
import { Plus, Trash2, CheckCircle, AlertTriangle, Handshake, ZapOff, Siren, FileWarning } from 'lucide-react';
import * as StorageService from '../services/storage';

const DebtManager: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form States
  const [creditor, setCreditor] = useState('');
  const [originalValue, setOriginalValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [status, setStatus] = useState<DebtStatus>(DebtStatus.PENDING);
  const [category, setCategory] = useState<DebtCategory>(DebtCategory.UTILITY);
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = () => {
    const loaded = StorageService.getDebts();
    setDebts(loaded);
  };

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditor || !currentValue) return;

    const newDebt: Debt = {
      id: Date.now().toString(),
      creditor,
      originalValue: originalValue ? parseFloat(originalValue) : parseFloat(currentValue),
      currentValue: parseFloat(currentValue),
      status,
      category,
      description,
      createdAt: Date.now(),
      dueDate: new Date(dueDate).toISOString()
    };

    StorageService.saveDebt(newDebt);
    loadDebts();
    resetForm();
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      StorageService.deleteDebt(id);
      loadDebts();
    }
  };

  const handleUpdateStatus = (debt: Debt, newStatus: DebtStatus) => {
    const updated = { ...debt, status: newStatus };
    StorageService.updateDebt(updated);
    loadDebts();
  };

  const resetForm = () => {
    setCreditor('');
    setOriginalValue('');
    setCurrentValue('');
    setDescription('');
    setStatus(DebtStatus.PENDING);
    setCategory(DebtCategory.UTILITY);
    setDueDate(new Date().toISOString().split('T')[0]);
  };

  const totalDebt = debts
    .filter(d => d.status !== DebtStatus.PAID)
    .reduce((acc, curr) => acc + curr.currentValue, 0);

  const formatMoney = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Separate Utility Bills (Essential) from other Debts
  const essentialDebts = debts.filter(d => 
    (d.category === DebtCategory.UTILITY) && d.status !== DebtStatus.PAID
  );
  
  const otherDebts = debts.filter(d => 
    (d.category !== DebtCategory.UTILITY) || d.status === DebtStatus.PAID
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileWarning className="w-6 h-6 text-rose-600" />
            Contas em Atraso & Dívidas
          </h1>
          <p className="text-sm text-gray-500">Controle contas de consumo (risco de corte) e outras pendências.</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          {showAddForm ? 'Cancelar' : <><Plus className="w-4 h-4" /> Novo Registro</>}
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-xl shadow-md border-t-4 border-rose-500 flex justify-between items-center">
        <div>
           <p className="text-slate-300 text-sm font-medium mb-1">Total Geral em Aberto</p>
           <h2 className="text-3xl font-bold">{formatMoney(totalDebt)}</h2>
        </div>
        {essentialDebts.length > 0 && (
            <div className="bg-rose-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 animate-pulse">
                <Siren className="w-5 h-5" />
                <div className="text-xs font-bold leading-tight">
                    {essentialDebts.length} CONTA(S)<br/>EM RISCO
                </div>
            </div>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-rose-100 animate-in slide-in-from-top-4">
          <h3 className="font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">Novo Registro de Atraso/Dívida</h3>
          <form onSubmit={handleAddDebt} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
                 <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Pendência</label>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                        { id: DebtCategory.UTILITY, label: 'Conta de Consumo', icon: <ZapOff className="w-4 h-4"/> },
                        { id: DebtCategory.CREDIT_CARD, label: 'Cartão de Crédito', icon: null },
                        { id: DebtCategory.LOAN, label: 'Empréstimo', icon: null },
                        { id: DebtCategory.OTHER, label: 'Outros', icon: null },
                    ].map((type) => (
                        <button
                            key={type.id}
                            type="button"
                            onClick={() => setCategory(type.id)}
                            className={`p-2 rounded-lg border text-sm flex items-center justify-center gap-2 transition-all ${
                                category === type.id 
                                ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold' 
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            }`}
                        >
                            {type.icon}
                            {type.label}
                        </button>
                    ))}
                 </div>
                 {category === DebtCategory.UTILITY && (
                     <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Atenção: Contas de consumo (Água, Luz, etc.) serão destacadas como risco de corte.
                     </p>
                 )}
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Credor / Empresa</label>
              <input
                type="text"
                required
                value={creditor}
                onChange={e => setCreditor(e.target.value)}
                placeholder="Ex: Enel, Sabesp, Nubank"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Vencimento Original</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Valor Original da Conta</label>
              <input
                type="number"
                step="0.01"
                value={originalValue}
                onChange={e => setOriginalValue(e.target.value)}
                placeholder="0.00"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Valor Atual (Para Quitar)</label>
              <input
                type="number"
                step="0.01"
                required
                value={currentValue}
                onChange={e => setCurrentValue(e.target.value)}
                placeholder="0.00"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                    value={status}
                    onChange={e => setStatus(e.target.value as DebtStatus)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-white"
                >
                    <option value={DebtStatus.PENDING}>Pendente (Atrasado)</option>
                    <option value={DebtStatus.NEGOTIATING}>Em Negociação</option>
                    <option value={DebtStatus.PAID}>Quitado / Resolvido</option>
                </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Observação</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Ref. mês 05/2024, Segunda via solicitada..."
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
            <div className="col-span-2 flex justify-end mt-2 pt-2 border-t border-gray-100">
              <button type="submit" className="bg-rose-600 text-white px-6 py-2 rounded-lg hover:bg-rose-700 transition-colors font-medium shadow-lg shadow-rose-200">
                Salvar Pendência
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CRITICAL SECTION: UTILITIES */}
      {essentialDebts.length > 0 && (
          <div className="space-y-3">
             <h3 className="text-lg font-bold text-rose-700 flex items-center gap-2">
                <ZapOff className="w-5 h-5" />
                Alerta de Corte: Contas Essenciais
             </h3>
             {essentialDebts.map(debt => (
                <div key={debt.id} className="bg-white border-l-4 border-rose-500 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                        ATRASADO
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 text-lg">{debt.creditor}</h4>
                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 rounded border border-gray-200">
                                {new Date(debt.dueDate || debt.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                        <p className="text-rose-600 font-medium text-sm mt-0.5">
                            Valor Atual: {formatMoney(debt.currentValue)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 max-w-md">{debt.description}</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                         <button 
                            onClick={() => handleUpdateStatus(debt, DebtStatus.PAID)}
                            className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1"
                         >
                            <CheckCircle className="w-4 h-4" />
                            Já Paguei
                         </button>
                         <button 
                             onClick={() => handleDelete(debt.id)}
                             className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                         >
                             <Trash2 className="w-4 h-4" />
                         </button>
                    </div>
                </div>
             ))}
          </div>
      )}

      {/* OTHER DEBTS */}
      <div className="space-y-3 pt-4">
        <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Outras Dívidas e Histórico
        </h3>
        
        {otherDebts.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
            <p className="text-sm">Nenhuma outra pendência registrada.</p>
          </div>
        ) : (
          otherDebts.map(debt => (
            <div key={debt.id} className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all opacity-100 ${
                debt.status === DebtStatus.PAID ? 'opacity-60 bg-gray-50' : ''
            }`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-800">{debt.creditor}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    debt.status === DebtStatus.PAID ? 'bg-emerald-100 text-emerald-700' : 
                    debt.status === DebtStatus.NEGOTIATING ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {debt.status === DebtStatus.PAID ? 'Quitado' : 
                     debt.status === DebtStatus.NEGOTIATING ? 'Em Negociação' : 
                     (debt.category === DebtCategory.LOAN ? 'Empréstimo' : 
                      debt.category === DebtCategory.CREDIT_CARD ? 'Cartão' : 'Pendente')}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{debt.description || 'Sem descrição'}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>Original: {formatMoney(debt.originalValue)}</span>
                  {debt.status !== DebtStatus.PAID && (
                    <span className="text-gray-900 font-bold">Atual: {formatMoney(debt.currentValue)}</span>
                  )}
                  {debt.dueDate && <span>Venc: {new Date(debt.dueDate).toLocaleDateString('pt-BR')}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-0 pt-2 md:pt-0 mt-2 md:mt-0">
                {debt.status !== DebtStatus.PAID && (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(debt, DebtStatus.NEGOTIATING)}
                      title="Marcar como Em Negociação"
                      className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors"
                    >
                      <Handshake className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(debt, DebtStatus.PAID)}
                      title="Marcar como Quitado"
                      className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button 
                  onClick={() => handleDelete(debt.id)}
                  title="Excluir registro"
                  className="p-2 hover:bg-gray-100 text-gray-400 hover:text-rose-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebtManager;