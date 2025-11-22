
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend, AreaChart, Area, ComposedChart } from 'recharts';
import { Transaction, TransactionType } from '../types';
import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  forecast: any;
  isLoadingForecast: boolean;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, forecast, isLoadingForecast, currentDate, onDateChange }) => {
  
  // Handlers for Month Navigation
  const prevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    const targetMonth = currentDate.getMonth();
    const targetYear = currentDate.getFullYear();

    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (tDate.getMonth() === targetMonth && tDate.getFullYear() === targetYear) {
        if (t.type === TransactionType.INCOME) income += t.amount;
        else expense += t.amount;
      }
    });

    return { income, expense, balance: income - expense };
  }, [transactions, currentDate]);

  // Future Cash Flow Data (Next 6 Months)
  const futureCashFlow = useMemo(() => {
    const data = [];
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
      const futureDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthIdx = futureDate.getMonth();
      const year = futureDate.getFullYear();
      
      let inc = 0;
      let exp = 0;

      transactions.forEach(t => {
        const tDate = new Date(t.date);
        if (tDate.getMonth() === monthIdx && tDate.getFullYear() === year) {
           if (t.type === TransactionType.INCOME) inc += t.amount;
           else exp += t.amount;
        }
      });

      data.push({
        name: futureDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        Receitas: inc,
        Despesas: exp,
        Saldo: inc - exp
      });
    }
    return data;
  }, [transactions]);

  // Data for Category Chart (Current Month)
  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    const targetMonth = currentDate.getMonth();
    const targetYear = currentDate.getFullYear();
    
    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (tDate.getMonth() === targetMonth && tDate.getFullYear() === targetYear && t.type === TransactionType.EXPENSE) {
        data[t.category] = (data[t.category] || 0) + t.amount;
      }
    });

    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
  }, [transactions, currentDate]);

  // Upcoming Specific Installments/Events
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0,0,0,0);
    
    return transactions
      .filter(t => new Date(t.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5); // Next 5 items
  }, [transactions]);

  const formatMoney = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Date Filter Control */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            Visão de {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button onClick={prevMonth} className="p-2 hover:bg-white rounded-md transition-all text-gray-600">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 font-medium text-gray-700 min-w-[140px] text-center">
                {currentDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-white rounded-md transition-all text-gray-600">
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Receitas</p>
            <h3 className="text-2xl font-bold text-emerald-600">{formatMoney(summary.income)}</h3>
          </div>
          <ArrowUpCircle className="w-10 h-10 text-emerald-100 text-emerald-500 stroke-current" />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Despesas</p>
            <h3 className="text-2xl font-bold text-rose-600">{formatMoney(summary.expense)}</h3>
          </div>
          <ArrowDownCircle className="w-10 h-10 text-rose-100 text-rose-500 stroke-current" />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Balanço</p>
            <h3 className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-gray-800' : 'text-rose-600'}`}>
              {formatMoney(summary.balance)}
            </h3>
          </div>
          <Wallet className="w-10 h-10 text-blue-100 text-blue-500 stroke-current" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Future Cash Flow Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
             <div>
               <h4 className="text-lg font-semibold text-gray-800">Provisionamento (Próximos 6 Meses)</h4>
               <p className="text-xs text-gray-500">Visualize suas receitas e despesas parceladas futuras.</p>
             </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={futureCashFlow} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(val) => `R$${val/1000}k`} />
                <Tooltip 
                    formatter={(value: number) => formatMoney(value)} 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="Receitas" fill="#10b981" barSize={20} radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="Despesas" fill="#f43f5e" barSize={20} radius={[4, 4, 0, 0]} stackId="a" />
                <Line type="monotone" dataKey="Saldo" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Gastos por Categoria ({currentDate.toLocaleDateString('pt-BR', { month: 'short' })})</h4>
          <div className="h-64 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{fontSize: 11}} width={80} />
                  <Tooltip 
                    formatter={(value: number) => formatMoney(value)}
                    cursor={{fill: 'transparent'}}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                     {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#3b82f6" : "#60a5fa"} />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Sem dados para este mês.
              </div>
            )}
          </div>
        </div>

        {/* Next Events & Forecast */}
        <div className="space-y-6">
           {/* Next Installments */}
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-500" />
                <h4 className="text-lg font-semibold text-gray-800">Próximos Vencimentos</h4>
              </div>
              <div className="space-y-3">
                {upcomingEvents.length > 0 ? upcomingEvents.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                     <div className="flex items-center gap-3">
                       <div className={`w-2 h-2 rounded-full ${t.type === 'INCOME' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                       <div>
                          <p className="text-sm font-medium text-gray-800">{t.description}</p>
                          <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString('pt-BR')} • {t.category}</p>
                       </div>
                     </div>
                     <span className={`text-sm font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatMoney(t.amount)}
                     </span>
                  </div>
                )) : (
                   <p className="text-sm text-gray-400">Nenhum lançamento futuro registrado.</p>
                )}
              </div>
           </div>

           {/* AI Forecast (Small) */}
           <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-lg font-semibold">Análise IA</h4>
                </div>
                
                {isLoadingForecast ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                  </div>
                ) : forecast ? (
                    <div>
                      <p className="text-sm italic text-slate-200 leading-relaxed mb-2">"{forecast.advice}"</p>
                      <div className="flex justify-between text-xs text-slate-400 border-t border-white/10 pt-2 mt-2">
                         <span>Previsão baseada no histórico</span>
                         <span>{forecast.confidence} confiança</span>
                      </div>
                    </div>
                ) : (
                  <p className="text-sm text-slate-400">Adicione dados para análise.</p>
                )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
