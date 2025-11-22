
import React, { useState, useEffect } from 'react';
import { Debt, DebtStatus } from '../types';
import { Plus, Trash2, CheckCircle, AlertTriangle, Handshake, DollarSign, Calendar } from 'lucide-react';
import * as StorageService from '../services/storage';

const DebtManager: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form States
  const [creditor, setCreditor] = useState('');
  const [originalValue, setOriginalValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [status, setStatus] = useState<DebtStatus>(DebtStatus.PENDING);
  const [description, setDescription] = useState('');

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
      description,
      createdAt: Date.now(),
      dueDate: new Date().toISOString() // Default to today for now
    };

    StorageService.saveDebt(newDebt);
    loadDebts();
    resetForm();
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro de dívida?')) {
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
  };

  const totalDebt = debts
    .filter(d => d.status !== DebtStatus.PAID)
    .reduce((acc, curr) => acc + curr.currentValue, 0);

  const formatMoney = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            Dívidas e Protestos
          </h1>
          <p className="text-sm text-gray-500">Gerencie pendências financeiras, negociações e quite seus débitos.</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          {showAddForm ? 'Cancelar' : <><Plus className="w-4 h-4" /> Nova Dívida</>}
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-rose-500 to-red-600 text-white p-6 rounded-xl shadow-md">
        <p className="text-rose-100 text-sm font-medium mb-1">Total em Aberto (Dívida Ativa)</p>
        <h2 className="text-3xl font-bold">{formatMoney(totalDebt)}</h2>
        <p className="text-rose-200 text-xs mt-2">Inclui dívidas pendentes e em negociação.</p>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-rose-100 animate-in slide-in-from-top-4">
          <h3 className="font-semibold text-gray-800 mb-4">Cadastrar Dívida / Protesto</h3>
          <form onSubmit={handleAddDebt} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Credor (Quem recebe)</label>
              <input
                type="text"
                required
                value={creditor}
                onChange={e => setCreditor(e.target.value)}
                placeholder="Ex: Banco X, Cartão Y"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Status Atual</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as DebtStatus)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-white"
              >
                <option value={DebtStatus.PENDING}>Pendente (Atrasado)</option>
                <option value={DebtStatus.NEGOTIATING}>Em Negociação</option>
                <option value={DebtStatus.PAID}>Quitado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Valor Original</label>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Valor Atual (Com Juros/Multa)</label>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Descrição / Observação</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Parcela 3/12 atrasada, Protesto em cartório..."
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
            <div className="col-span-2 flex justify-end mt-2">
              <button type="submit" className="bg-rose-600 text-white px-6 py-2 rounded-lg hover:bg-rose-700 transition-colors font-medium">
                Salvar Registro
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Debt List */}
      <div className="grid grid-cols-1 gap-4">
        {debts.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p>Nenhuma dívida registrada. Parabéns!</p>
          </div>
        ) : (
          debts.map(debt => (
            <div key={debt.id} className={`bg-white p-4 rounded-xl shadow-sm border-l-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
              debt.status === DebtStatus.PAID ? 'border-l-emerald-500 opacity-75' : 
              debt.status === DebtStatus.NEGOTIATING ? 'border-l-amber-500' : 'border-l-rose-500'
            }`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-800">{debt.creditor}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    debt.status === DebtStatus.PAID ? 'bg-emerald-100 text-emerald-700' : 
                    debt.status === DebtStatus.NEGOTIATING ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {debt.status === DebtStatus.PAID ? 'Quitado' : 
                     debt.status === DebtStatus.NEGOTIATING ? 'Negociando' : 'Pendente'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{debt.description || 'Sem descrição'}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>Original: {formatMoney(debt.originalValue)}</span>
                  {debt.status !== DebtStatus.PAID && (
                    <span className="text-rose-600 font-bold">Atual: {formatMoney(debt.currentValue)}</span>
                  )}
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
