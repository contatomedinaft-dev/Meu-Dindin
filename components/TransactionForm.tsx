
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';
import { X, Calendar, DollarSign, Layers, Calculator, RotateCw } from 'lucide-react';
import * as StorageService from '../services/storage';

interface TransactionFormProps {
  onClose: () => void;
  onSave: (transactions: Transaction[]) => void;
  initialData?: Transaction | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, onSave, initialData }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Parcelamento
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState(2);

  // Load initial data for editing
  useEffect(() => {
    if (initialData) {
        setType(initialData.type);
        setAmount(initialData.amount.toString());
        setDescription(initialData.description);
        setCategory(initialData.category);
        setDate(new Date(initialData.date).toISOString().split('T')[0]);
        
        // Check if it was already an installment
        if (initialData.installmentTotal && initialData.installmentTotal > 1) {
            setIsInstallment(true);
            setInstallments(initialData.installmentTotal);
        } else {
            setIsInstallment(false);
        }
    }
  }, [initialData]);

  const categories = type === TransactionType.EXPENSE ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !category) return;

    const user = StorageService.getUserSession();
    const numAmount = parseFloat(amount);
    const baseDate = new Date(date);
    // Fix date timezone issue by setting time to noon
    baseDate.setHours(12, 0, 0, 0);

    const newTransactions: Transaction[] = [];

    const commonData = {
        type,
        category,
        userId: initialData?.userId || user?.id,
        userName: initialData?.userName || user?.name,
        createdAt: initialData?.createdAt || Date.now()
    };

    if (initialData) {
        // --- EDIT MODE ---
        
        if (isInstallment && installments > 1) {
            // Case 1: Editing and transforming into installment (or updating installment plan)
            // The CURRENT transaction becomes installment #1 (or we keep its current index if logic permits, but simplest is treating edit as start/reset)
            
            // Note: Simplification -> Treat the edited transaction as the "Anchor" (1/N) or (Current/N)
            // If user explicitly sets installments, we update this one and generate FUTURE ones.
            
            // 1. Update the existing transaction to be 1/N
            newTransactions.push({
                ...commonData,
                id: initialData.id, // Keep ID
                amount: numAmount,
                description: `${description} (1/${installments})`, // Update desc
                date: baseDate.toISOString(),
                installmentCurrent: 1,
                installmentTotal: installments
            });

            // 2. Generate the REST (2..N)
            for (let i = 1; i < installments; i++) {
                const futureDate = new Date(baseDate);
                futureDate.setMonth(baseDate.getMonth() + i);

                newTransactions.push({
                    ...commonData,
                    id: Date.now().toString() + Math.random().toString(), // New IDs
                    amount: numAmount,
                    description: `${description} (${i + 1}/${installments})`,
                    date: futureDate.toISOString(),
                    installmentCurrent: i + 1,
                    installmentTotal: installments
                });
            }

        } else {
            // Case 2: Standard Edit (Single)
            newTransactions.push({
                ...commonData,
                id: initialData.id,
                amount: numAmount,
                description,
                date: baseDate.toISOString(),
                // Remove installment data if user unchecked the box
                installmentCurrent: undefined,
                installmentTotal: undefined
            });
        }

    } else {
        // --- NEW MODE ---

        if (isInstallment && installments > 1) {
            // Generate Multiple New Transactions
            for (let i = 0; i < installments; i++) {
                const installmentDate = new Date(baseDate);
                installmentDate.setMonth(baseDate.getMonth() + i);
                
                newTransactions.push({
                ...commonData,
                id: Date.now().toString() + Math.random().toString(),
                amount: numAmount, // Valor da parcela
                description: `${description} (${i + 1}/${installments})`,
                date: installmentDate.toISOString(),
                installmentCurrent: i + 1,
                installmentTotal: installments
                });
            }
        } else {
            // Single New Transaction
            newTransactions.push({
                ...commonData,
                id: Date.now().toString(),
                amount: numAmount,
                description,
                date: baseDate.toISOString(),
            });
        }
    }

    onSave(newTransactions);
    onClose();
  };

  const totalValue = isInstallment && amount ? parseFloat(amount) * installments : parseFloat(amount || '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">
            {initialData ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setType(TransactionType.EXPENSE)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === TransactionType.EXPENSE ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.INCOME)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
            >
              Receita
            </button>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
                {isInstallment ? 'Valor da Parcela (Mensal)' : 'Valor Total'}
            </label>
            <div className="relative">
               <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 type="number" 
                 step="0.01" 
                 required
                 value={amount}
                 onChange={e => setAmount(e.target.value)}
                 className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                 placeholder="0.00"
               />
            </div>
            {isInstallment && amount && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700 flex items-center gap-2">
                    <Calculator className="w-3 h-3" />
                    <span>
                        {installments}x de R$ {parseFloat(amount).toFixed(2)} = <strong>Total: R$ {totalValue.toFixed(2)}</strong>
                    </span>
                </div>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
            <input 
              type="text" 
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: Freelance Design, Compra TV..."
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
            <select 
              required
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">Selecione...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Data (Início)</label>
            <div className="relative">
               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 type="date" 
                 required
                 value={date}
                 onChange={e => setDate(e.target.value)}
                 className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
               />
            </div>
          </div>

          {/* Parcelamento Checkbox - Available for Edit as well */}
          <div className="pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer">
                <input 
                    type="checkbox" 
                    checked={isInstallment} 
                    onChange={e => setIsInstallment(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" 
                />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Layers className="w-4 h-4 text-gray-500" />
                    Lançamento Parcelado / Recorrente
                </span>
                </label>
                
                {isInstallment && (
                <div className="mt-3 pl-6 animate-in slide-in-from-top-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Qtd. Parcelas / Meses</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            min="2" 
                            max="120" 
                            value={installments}
                            onChange={e => setInstallments(parseInt(e.target.value))}
                            className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                        {initialData && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 flex items-center gap-1">
                                <RotateCw className="w-3 h-3" />
                                Criará futuros
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                        Serão gerados {installments} lançamentos mensais a partir da data selecionada.
                    </p>
                </div>
                )}
          </div>

          <button 
            type="submit"
            className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-medium transition-colors shadow-lg shadow-slate-500/20"
          >
            {initialData ? 'Salvar Alterações & Recorrência' : 'Salvar Lançamento'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
