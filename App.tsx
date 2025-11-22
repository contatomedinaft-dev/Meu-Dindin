
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, ChatMessage, Forecast, User, TransactionType } from './types';
import * as StorageService from './services/storage';
import * as GeminiService from './services/gemini';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import MonthlySheet from './components/MonthlySheet';
import DebtManager from './components/DebtManager';
import TransactionForm from './components/TransactionForm';
import AuthScreen from './components/AuthScreen';
import { LayoutDashboard, MessageSquareText, Table2, Download, RefreshCw, Menu, X, Trash2, Calendar, AlertCircle, FileWarning, Plus, LogOut, UserCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'list' | 'sheet' | 'debts'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Global Date Filter
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal States
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  // Check User Session on Mount
  useEffect(() => {
    const user = StorageService.getUserSession();
    if (user) {
      handleLogin(user);
    }
  }, []);

  const loadDataForUser = useCallback(() => {
    const loaded = StorageService.getTransactions();
    setTransactions(loaded);
    updateForecast(loaded); 
    
    setMessages([
      { 
        id: 'welcome', 
        role: 'assistant', 
        content: 'Olá! Sou seu assistente financeiro. Estou pronto para ajudar você e sua família.' 
      }
    ]);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    StorageService.saveUserSession(user);
    loadDataForUser();
  };

  const handleLogout = () => {
    StorageService.logoutUser();
    setCurrentUser(null);
    setTransactions([]);
    setForecast(null);
  };

  const updateForecast = useCallback(async (data: Transaction[]) => {
    setIsLoadingForecast(true);
    const prediction = await GeminiService.generateFinancialForecast(data);
    setForecast(prediction);
    setIsLoadingForecast(false);
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!currentUser) return;

    // Add user message
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessingChat(true);

    try {
      // Call Gemini to parse
      const parsed = await GeminiService.parseTransactionFromText(text);

      if (parsed) {
        // Create full transaction object
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          amount: parsed.amount!,
          type: parsed.type!,
          category: parsed.category!,
          description: parsed.description!,
          date: parsed.date!,
          createdAt: Date.now(),
          userId: currentUser.id,
          userName: currentUser.name
        };

        // Save
        StorageService.saveTransaction(newTransaction);
        const updatedList = StorageService.getTransactions();
        setTransactions(updatedList);

        // Reply
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Entendido! Registrei a transação.',
          relatedTransaction: newTransaction
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        // Fallback if not a transaction
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Desculpe, não identifiquei uma transação financeira clara. Tente dizer algo como "Gastei 30 na padaria".'
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Ocorreu um erro ao processar sua mensagem. Tente novamente.'
      }]);
    } finally {
      setIsProcessingChat(false);
    }
  };

  const handleSaveSheetTransactions = (newTransactions: Transaction[]) => {
    if (!currentUser) return;
    // Ensure all transactions have user data
    const enriched = newTransactions.map(t => ({
        ...t,
        userId: currentUser.id,
        userName: currentUser.name
    }));

    enriched.forEach(t => StorageService.saveTransaction(t));
    const updatedList = StorageService.getTransactions();
    setTransactions(updatedList);
    updateForecast(updatedList);
  };

  const handleManualTransactionSave = (newTransactions: Transaction[]) => {
      newTransactions.forEach(t => StorageService.saveTransaction(t));
      const updatedList = StorageService.getTransactions();
      setTransactions(updatedList);
      // Update forecast only if we added current month data to avoid unnecessary calls
      updateForecast(updatedList);
  };

  const handleExportCSV = () => {
    const csv = StorageService.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `minhas_financas_${currentUser?.familyName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      StorageService.deleteTransaction(transactionToDelete);
      const updated = StorageService.getTransactions();
      setTransactions(updated);
      setTransactionToDelete(null);
    }
  };

  const cancelDelete = () => {
    setTransactionToDelete(null);
  };

  // Filter transactions for list view based on current global date
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === currentDate.getMonth() && tDate.getFullYear() === currentDate.getFullYear();
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentDate]);

  const formatMoney = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              {/* Logo styled as Coin */}
              <div className="flex-shrink-0 flex items-center gap-4 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
                 <div className="relative w-14 h-14 transition-transform transform group-hover:scale-110 duration-300 ease-out">
                   {/* Coin Depth/Shadow */}
                   <div className="absolute inset-0 bg-yellow-700 rounded-full shadow-lg translate-y-1"></div>
                   {/* Main Coin Face */}
                   <div className="absolute inset-0 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 rounded-full border-[3px] border-yellow-100 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]">
                     {/* Inner Ring Details */}
                     <div className="absolute inset-1 rounded-full border border-yellow-700/20"></div>
                     {/* Dollar Sign */}
                     <span className="text-yellow-50 font-serif font-black text-3xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">$</span>
                   </div>
                   {/* Shine Effect */}
                   <div className="absolute top-2 left-3 w-4 h-2 bg-white/40 rounded-full rotate-[-45deg] blur-[1px]"></div>
                 </div>
                 
                 <div className="flex flex-col -space-y-1 justify-center h-full">
                    <span className="text-3xl font-['Anton'] tracking-wide leading-none text-slate-800 drop-shadow-sm group-hover:text-slate-900 transition-colors">
                      MEU <span className="text-emerald-600">DINDIN</span>
                    </span>
                 </div>
              </div>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden lg:flex lg:space-x-8 items-center">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`${activeTab === 'dashboard' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors duration-200`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('sheet')}
                className={`${activeTab === 'sheet' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors duration-200`}
              >
                Planilha Mensal
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`${activeTab === 'chat' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors duration-200`}
              >
                Chat IA
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`${activeTab === 'list' ? 'border-blue-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors duration-200`}
              >
                Extrato
              </button>
              <button
                onClick={() => setActiveTab('debts')}
                className={`${activeTab === 'debts' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-rose-600'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full gap-1 transition-colors duration-200`}
              >
                <FileWarning className="w-4 h-4" />
                Dívidas
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-3">
               {/* User Badge */}
               <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                 <div className={`w-2 h-2 rounded-full ${currentUser.role === 'PRIMARY' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                 <span className="text-sm font-semibold text-gray-700 max-w-[100px] truncate">{currentUser.name}</span>
               </div>

               <button 
                 onClick={() => setShowTransactionForm(true)}
                 className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none transition-all hover:shadow-md gap-2"
               >
                 <Plus className="w-4 h-4" />
                 Lançar
               </button>
               
               <button 
                 onClick={handleLogout}
                 className="p-2 text-gray-400 hover:text-rose-600 transition-colors"
                 title="Sair"
               >
                 <LogOut className="w-5 h-5" />
               </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden gap-2">
              <button
                 onClick={() => setShowTransactionForm(true)}
                 className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                 <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-200">
            <div className="pt-2 pb-3 space-y-1 px-2">
              <div className="px-3 py-2 flex items-center justify-between border-b border-gray-100 mb-2">
                  <span className="font-bold text-gray-700">{currentUser.name}</span>
                  <button onClick={handleLogout} className="text-xs text-rose-500 font-medium">Sair</button>
              </div>
              <button onClick={() => {setActiveTab('dashboard'); setMobileMenuOpen(false)}} className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300">Dashboard</button>
              <button onClick={() => {setActiveTab('sheet'); setMobileMenuOpen(false)}} className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300">Planilha</button>
              <button onClick={() => {setActiveTab('chat'); setMobileMenuOpen(false)}} className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300">Chat</button>
              <button onClick={() => {setActiveTab('list'); setMobileMenuOpen(false)}} className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300">Extrato</button>
              <button onClick={() => {setActiveTab('debts'); setMobileMenuOpen(false)}} className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left border-transparent text-rose-600 hover:bg-rose-50 hover:border-rose-300 flex items-center gap-2"><FileWarning className="w-4 h-4"/> Dívidas</button>
              <button onClick={handleExportCSV} className="block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left border-transparent text-blue-600 hover:bg-blue-50 hover:border-blue-300">Exportar CSV</button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'dashboard' && (
          <>
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Visão Geral ({currentUser.familyName})</h1>
                <p className="text-sm text-gray-500">Acompanhe o balanço do mês e previsões.</p>
              </div>
              <button 
                onClick={() => updateForecast(transactions)}
                disabled={isLoadingForecast}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Atualizar Previsão"
              >
                <RefreshCw className={`w-5 h-5 ${isLoadingForecast ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <Dashboard 
              transactions={transactions} 
              forecast={forecast} 
              isLoadingForecast={isLoadingForecast} 
              currentDate={currentDate}
              onDateChange={setCurrentDate}
            />
          </>
        )}

        {activeTab === 'sheet' && (
          <>
            <div className="mb-6">
               <h1 className="text-2xl font-bold text-gray-900">Planilha de Despesas Fixas</h1>
               <p className="text-sm text-gray-500">Preencha suas contas recorrentes para o mês de <strong>{currentDate.toLocaleDateString('pt-BR', { month: 'long' })}</strong>.</p>
            </div>
            <div className="flex justify-end mb-4">
                 <div className="flex items-center bg-white border rounded-lg p-1 shadow-sm">
                    <button onClick={() => {const d = new Date(currentDate); d.setMonth(d.getMonth()-1); setCurrentDate(d)}} className="p-2 hover:bg-gray-50 rounded text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="px-3 text-sm font-medium min-w-[100px] text-center">
                        {currentDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                    </span>
                    <button onClick={() => {const d = new Date(currentDate); d.setMonth(d.getMonth()+1); setCurrentDate(d)}} className="p-2 hover:bg-gray-50 rounded text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>
            <MonthlySheet 
                currentDate={currentDate} 
                transactions={transactions} 
                onSaveTransactions={handleSaveSheetTransactions} 
            />
          </>
        )}

        {activeTab === 'chat' && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
               <h1 className="text-2xl font-bold text-gray-900">Lançamentos via Chat</h1>
               <p className="text-sm text-gray-500">Converse com a IA para registrar seus gastos variáveis (Uber, lanches, etc).</p>
            </div>
            <ChatInterface 
              onSendMessage={handleSendMessage} 
              messages={messages} 
              isProcessing={isProcessingChat}
              userName={currentUser.name}
            />
          </div>
        )}

        {activeTab === 'debts' && (
          <div className="max-w-4xl mx-auto">
            <DebtManager />
          </div>
        )}

        {activeTab === 'list' && (
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-wrap gap-4">
               <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                 <Table2 className="w-5 h-5 text-gray-400" />
                 Histórico: {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
               </h3>
               
               {/* Month Picker for List */}
               <div className="flex items-center bg-white border rounded-lg p-1 shadow-sm">
                    <button onClick={() => {const d = new Date(currentDate); d.setMonth(d.getMonth()-1); setCurrentDate(d)}} className="p-2 hover:bg-gray-50 rounded text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="px-3 text-sm font-medium min-w-[100px] text-center">
                        {currentDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                    </span>
                    <button onClick={() => {const d = new Date(currentDate); d.setMonth(d.getMonth()+1); setCurrentDate(d)}} className="p-2 hover:bg-gray-50 rounded text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsável</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                        {t.installmentTotal && (
                          <span className="ml-2 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                             {t.installmentCurrent}/{t.installmentTotal}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                          {t.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-1.5">
                             <UserCircle2 className="w-3 h-3 text-gray-400" />
                             {t.userName || 'N/A'}
                          </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                        t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'}{formatMoney(t.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => handleDeleteClick(t.id)} className="text-gray-400 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                        Nenhuma transação encontrada para este mês.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Transação?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Transaction Form Modal */}
      {showTransactionForm && (
        <TransactionForm 
           onClose={() => setShowTransactionForm(false)} 
           onSave={handleManualTransactionSave} 
        />
      )}

    </div>
  );
};

export default App;
