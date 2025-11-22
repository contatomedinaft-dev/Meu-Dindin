
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { ChatMessage, Transaction } from '../types';

interface ChatInterfaceProps {
  onSendMessage: (text: string) => Promise<void>;
  messages: ChatMessage[];
  isProcessing: boolean;
  userName?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onSendMessage, messages, isProcessing, userName }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    const text = input;
    setInput('');
    await onSendMessage(text);
  };

  const formatMoney = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-700">Assistente Financeiro</h3>
        <p className="text-xs text-gray-500">Olá, {userName}! Fale naturalmente para lançar seus gastos.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center p-8">
            <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 ml-1" />
            </div>
            <p className="mb-2 font-medium text-gray-600">Comece sua gestão!</p>
            <p className="text-sm">Tente digitar:<br/>"Recebi meu salário de 5000"<br/>ou<br/>"Uber 25 reais"</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`
                max-w-[80%] rounded-2xl p-4 shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}
              `}
            >
              {msg.role === 'assistant' && msg.relatedTransaction ? (
                <div>
                  <p className="mb-2 text-sm">{msg.content}</p>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
                     <div className="flex items-center gap-2 mb-1">
                        {msg.relatedTransaction.type === 'INCOME' 
                          ? <span className="text-xs font-bold text-white bg-emerald-500 px-2 py-0.5 rounded">RECEITA</span>
                          : <span className="text-xs font-bold text-white bg-rose-500 px-2 py-0.5 rounded">DESPESA</span>
                        }
                        <span className="font-medium text-gray-900">{formatMoney(msg.relatedTransaction.amount)}</span>
                     </div>
                     <div className="text-gray-600 flex justify-between">
                       <span>{msg.relatedTransaction.category}</span>
                       <span className="text-gray-400 text-xs">{new Date(msg.relatedTransaction.date).toLocaleDateString('pt-BR')}</span>
                     </div>
                     <div className="text-gray-500 italic mt-1 text-xs">"{msg.relatedTransaction.description}"</div>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-line text-sm">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {isProcessing && (
           <div className="flex justify-start">
             <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
               <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
               <span className="text-xs text-gray-400">Processando...</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua transação..."
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          disabled={isProcessing}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isProcessing}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-3 rounded-xl transition-colors flex items-center justify-center min-w-[50px]"
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
