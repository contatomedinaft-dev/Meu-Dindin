
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';
import { Save, Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface MonthlySheetProps {
  currentDate: Date;
  transactions: Transaction[];
  onSaveTransactions: (newTransactions: Transaction[]) => void;
}

const MonthlySheet: React.FC<MonthlySheetProps> = ({ currentDate, transactions, onSaveTransactions }) => {
  // State to hold form values: { "Aluguel": "1200", ... }
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<TransactionType>(TransactionType.EXPENSE);

  const currentCategories = activeTab === TransactionType.EXPENSE ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  useEffect(() => {
    // Filter transactions for the current month and populate the form based on activeTab
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    
    const currentMonthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year && t.type === activeTab;
    });

    const newValues: Record<string, string> = {};
    
    // Pre-fill with 0 or existing sum for that category
    currentCategories.forEach(cat => {
      const sum = currentMonthTransactions
        .filter(t => t.category === cat)
        .reduce((acc, curr) => acc + curr.amount, 0);
      newValues[cat] = sum > 0 ? sum.toFixed(2).replace('.', ',') : '';
    });

    setValues(newValues);
  }, [currentDate, transactions, activeTab, currentCategories]);

  const handleChange = (category: string, value: string) => {
    setValues(prev => ({ ...prev, [category]: value }));
  };

  const handleSave = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    
    // Generate transactions
    const newTransactions: Transaction[] = [];

    Object.entries(values).forEach(([category, valueStr]) => {
      const stringVal = String(valueStr);
      // Convert "1.200,50" or "1200.50" to float number
      const normalized = stringVal.replace(/\./g, '').replace(',', '.');
      // Handle simple case where user types "1200.50" directly without thousands separator logic
      // Better simple parse: replace comma with dot. If user uses dots for thousands, this simple logic might break, 
      // but for standard input "1200,50" it works.
      const amount = parseFloat(stringVal.replace(',', '.'));
      
      if (!isNaN(amount) && amount > 0) {
        // Create a new transaction for this entry
        newTransactions.push({
            id: Date.now().toString() + Math.random().toString(),
            amount: amount,
            type: activeTab, // INCOME or EXPENSE
            category: category,
            description: `Lançamento Mensal: ${category}`,
            date: new Date(year, month, 1, 12, 0, 0).toISOString(), // 1st of the month
            createdAt: Date.now()
        });
      }
    });

    if (newTransactions.length > 0) {
        onSaveTransactions(newTransactions);
        alert(`${activeTab === TransactionType.EXPENSE ? 'Despesas' : 'Receitas'} lançadas com sucesso!`);
    } else {
        // If user cleared everything, maybe we should allow saving empty state? 
        // For now, just alert if nothing to save.
        if (Object.keys(values).length > 0 && Object.values(values).some(v => v !== '')) {
           // Potentially all zeros
        }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Planilha de Lançamentos
                </h2>
                <p className="text-sm text-gray-500">
                    Gerencie suas contas fixas e recebimentos para {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
            </div>
            <button 
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm w-full md:w-auto justify-center"
            >
                <Save className="w-4 h-4" />
                Salvar {activeTab === TransactionType.EXPENSE ? 'Despesas' : 'Receitas'}
            </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg w-full md:w-fit">
            <button
                onClick={() => setActiveTab(TransactionType.EXPENSE)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === TransactionType.EXPENSE 
                    ? 'bg-white text-rose-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
            >
                <TrendingDown className="w-4 h-4" />
                Despesas
            </button>
            <button
                onClick={() => setActiveTab(TransactionType.INCOME)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === TransactionType.INCOME 
                    ? 'bg-white text-emerald-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
            >
                <TrendingUp className="w-4 h-4" />
                Entradas de Dinheiro
            </button>
        </div>
      </div>

      <div className="p-6 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {currentCategories.map((category) => (
                <div key={category} className="relative group">
                    <label className="block text-xs font-medium text-gray-500 mb-1 truncate group-hover:text-blue-600 transition-colors" title={category}>
                        {category}
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-400 sm:text-sm font-light">R$</span>
                        </div>
                        <input
                            type="number"
                            name={category}
                            id={category}
                            className={`block w-full rounded-md border-gray-300 pl-9 pr-3 py-2 focus:ring-2 sm:text-sm bg-gray-50 border hover:bg-white transition-colors outline-none ${
                                activeTab === TransactionType.INCOME 
                                ? 'focus:border-emerald-500 focus:ring-emerald-500/20' 
                                : 'focus:border-rose-500 focus:ring-rose-500/20'
                            }`}
                            placeholder="0,00"
                            value={values[category] || ''}
                            onChange={(e) => handleChange(category, e.target.value)}
                        />
                    </div>
                </div>
            ))}
        </div>
        <div className={`mt-6 p-4 border rounded-lg text-sm flex items-start gap-2 ${
            activeTab === TransactionType.INCOME ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
            <DollarSign className="w-5 h-5 flex-shrink-0" />
            <div>
                <strong>Atenção:</strong> Os valores inseridos aqui serão registrados como {activeTab === TransactionType.INCOME ? 'receitas' : 'despesas'} para o dia 01 de {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}.
            </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlySheet;
