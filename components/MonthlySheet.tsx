
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types';
import { Save, Calendar, DollarSign, TrendingUp, TrendingDown, Layers, Repeat, Check } from 'lucide-react';

interface MonthlySheetProps {
  currentDate: Date;
  transactions: Transaction[];
  onSaveTransactions: (newTransactions: Transaction[], idsToDelete: string[]) => void;
}

const MonthlySheet: React.FC<MonthlySheetProps> = ({ currentDate, transactions, onSaveTransactions }) => {
  // State to hold form values: { "Aluguel": "1200", ... }
  const [values, setValues] = useState<Record<string, string>>({});
  // State to hold installment counts: { "Aluguel": 12, ... }
  const [installments, setInstallments] = useState<Record<string, number>>({});
  // Track existing IDs per category to allow replacement/editing
  const [existingIds, setExistingIds] = useState<Record<string, string[]>>({});
  
  const [expandedRecurrence, setExpandedRecurrence] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<TransactionType>(TransactionType.EXPENSE);

  const currentCategories = activeTab === TransactionType.EXPENSE ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  useEffect(() => {
    // Filter transactions for the current month
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    
    const currentMonthTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year && t.type === activeTab;
    });

    const newValues: Record<string, string> = {};
    const newInstallments: Record<string, number> = {};
    const newExpanded: Record<string, boolean> = {};
    const newExistingIds: Record<string, string[]> = {};
    
    currentCategories.forEach(cat => {
      const matchingTrans = currentMonthTransactions.filter(t => t.category === cat);
      // Aggregate amount for the sheet view
      const sum = matchingTrans.reduce((acc, curr) => acc + curr.amount, 0);
      
      // Store IDs so we can replace them if the user edits
      newExistingIds[cat] = matchingTrans.map(t => t.id);

      if (sum > 0) {
        newValues[cat] = sum.toFixed(2).replace('.', ',');
        newInstallments[cat] = 1; 
      }
    });

    setValues(newValues);
    setInstallments(newInstallments);
    setExpandedRecurrence(newExpanded);
    setExistingIds(newExistingIds);
  }, [currentDate, transactions, activeTab, currentCategories]);

  const handleChange = (category: string, value: string) => {
    setValues(prev => ({ ...prev, [category]: value }));
  };

  const toggleRecurrence = (category: string) => {
    setExpandedRecurrence(prev => {
        const isNowExpanded = !prev[category];
        if (!isNowExpanded) {
            setInstallments(curr => ({ ...curr, [category]: 1 }));
        } else {
            // Default to 12 months (Annual) when opening, as it's the most common use case for "Recurrence"
            setInstallments(curr => ({ ...curr, [category]: 12 }));
        }
        return { ...prev, [category]: isNowExpanded };
    });
  };

  const handleInstallmentChange = (category: string, count: number) => {
      setInstallments(prev => ({ ...prev, [category]: Math.max(1, count) }));
  };

  const handleSave = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const baseDate = new Date(year, month, 1, 12, 0, 0);
    
    const newTransactions: Transaction[] = [];
    const idsToDelete: string[] = [];
    let savedCount = 0;

    Object.entries(values).forEach(([category, valueStr]) => {
      const stringVal = String(valueStr);
      const amount = parseFloat(stringVal.replace(/\./g, '').replace(',', '.'));
      
      if (!isNaN(amount) && amount > 0) {
        // Mark existing transactions of this category for deletion (Replacement logic)
        if (existingIds[category] && existingIds[category].length > 0) {
            idsToDelete.push(...existingIds[category]);
        }

        const numInstallments = installments[category] || 1;

        if (numInstallments > 1) {
            // Create multiple future transactions
            for (let i = 0; i < numInstallments; i++) {
                const futureDate = new Date(baseDate);
                futureDate.setMonth(baseDate.getMonth() + i);

                newTransactions.push({
                    id: Date.now().toString() + Math.random().toString(),
                    amount: amount, 
                    type: activeTab,
                    category: category,
                    description: `Lançamento Planilha: ${category} (${i + 1}/${numInstallments})`,
                    date: futureDate.toISOString(),
                    createdAt: Date.now(),
                    installmentCurrent: i + 1,
                    installmentTotal: numInstallments
                });
            }
        } else {
            // Single transaction (Replacement for current month)
            newTransactions.push({
                id: Date.now().toString() + Math.random().toString(),
                amount: amount,
                type: activeTab,
                category: category,
                description: `Lançamento Planilha: ${category}`,
                date: baseDate.toISOString(),
                createdAt: Date.now()
            });
        }
        savedCount++;
      } else if ((isNaN(amount) || amount === 0) && existingIds[category]?.length > 0) {
          // If user cleared the value, remove existing transactions
          idsToDelete.push(...existingIds[category]);
      }
    });

    if (newTransactions.length > 0 || idsToDelete.length > 0) {
        onSaveTransactions(newTransactions, idsToDelete);
        alert(`${savedCount} categorias atualizadas com sucesso!`);
        setExpandedRecurrence({});
        setInstallments({});
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Planilha de Custos Mensais
                </h2>
                <p className="text-sm text-gray-500">
                    Edite os valores deste mês. Use o botão <Layers className="w-3 h-3 inline text-gray-400" /> para configurar recorrências anuais (Ex: Aluguel 12x).
                </p>
            </div>
            <button 
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm w-full md:w-auto justify-center font-medium"
            >
                <Save className="w-4 h-4" />
                Salvar Alterações
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
                Custos / Saídas
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
                Entradas / Renda
            </button>
        </div>
      </div>

      <div className="p-6 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
            {currentCategories.map((category) => {
                const isExpanded = expandedRecurrence[category];
                const installmentCount = installments[category] || 1;
                const currentValue = values[category];
                
                return (
                <div key={category} className={`relative group p-3 rounded-lg border transition-all ${isExpanded ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-gray-50 hover:border-gray-100'}`}>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-600 truncate uppercase tracking-wide" title={category}>
                            {category}
                        </label>
                        <button 
                            onClick={() => toggleRecurrence(category)}
                            className={`p-1.5 rounded-md transition-colors flex items-center gap-1 ${isExpanded ? 'bg-blue-100 text-blue-700' : 'text-gray-300 hover:text-blue-500 hover:bg-gray-100'}`}
                            title="Configurar Recorrência / Anual"
                        >
                            <span className="text-[10px] font-medium hidden group-hover:inline">Recorrência</span>
                            <Layers className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-400 sm:text-sm font-light">R$</span>
                        </div>
                        <input
                            type="number"
                            name={category}
                            id={category}
                            className={`block w-full rounded-md border-gray-300 pl-9 pr-3 py-2 focus:ring-2 sm:text-sm border hover:bg-white transition-colors outline-none ${
                                activeTab === TransactionType.INCOME 
                                ? 'focus:border-emerald-500 focus:ring-emerald-500/20' 
                                : 'focus:border-rose-500 focus:ring-rose-500/20'
                            } ${isExpanded ? 'bg-white' : 'bg-gray-50'}`}
                            placeholder="0,00"
                            value={values[category] || ''}
                            onChange={(e) => handleChange(category, e.target.value)}
                        />
                    </div>

                    {isExpanded && (
                        <div className="mt-3 animate-in slide-in-from-top-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                             <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs text-gray-600 font-medium">Repetir:</span>
                                <div className="flex items-center bg-white border border-blue-200 rounded-md px-2 py-1 w-20">
                                    <input 
                                        type="number" 
                                        min="2" 
                                        max="60"
                                        value={installmentCount}
                                        onChange={(e) => handleInstallmentChange(category, parseInt(e.target.value))}
                                        className="w-full outline-none text-sm font-bold text-blue-700 text-center"
                                    />
                                </div>
                                <span className="text-xs text-gray-500">meses</span>
                             </div>
                             
                             {/* Quick Buttons */}
                             <div className="flex gap-2 mb-3">
                                <button 
                                    onClick={() => handleInstallmentChange(category, 6)}
                                    className={`flex-1 py-1.5 text-[10px] border rounded transition-colors ${installmentCount === 6 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50'}`}
                                >
                                    Semestral (6x)
                                </button>
                                <button 
                                    onClick={() => handleInstallmentChange(category, 12)}
                                    className={`flex-1 py-1.5 text-[10px] border rounded transition-colors font-medium ${installmentCount === 12 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50'}`}
                                >
                                    Anual (12x)
                                </button>
                             </div>

                             {currentValue && (
                                <div className="text-[10px] text-gray-500 pt-2 border-t border-blue-100">
                                    <div className="flex justify-between items-center">
                                        <span>Total estimado:</span>
                                        <span className="font-bold text-blue-700">
                                            R$ {(parseFloat(currentValue.replace(',','.')) * installmentCount).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                        </span>
                                    </div>
                                    <div className="text-[9px] text-gray-400 mt-1 flex items-center gap-1 justify-end">
                                        <Repeat className="w-3 h-3" />
                                        Até {new Date(new Date().setMonth(new Date().getMonth() + installmentCount - 1)).toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})}
                                    </div>
                                </div>
                             )}
                        </div>
                    )}
                </div>
            )})}
        </div>
        
        <div className={`mt-6 p-4 border rounded-lg text-sm flex items-start gap-2 ${
            activeTab === TransactionType.INCOME ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
            <DollarSign className="w-5 h-5 flex-shrink-0" />
            <div>
                <strong>Dica:</strong> Para custos fixos anuais (como Aluguel), preencha o valor da parcela, clique no ícone <Layers className="w-3 h-3 inline" /> e selecione <strong>Anual (12x)</strong>. O sistema lançará automaticamente para os próximos 12 meses.
            </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlySheet;
