
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export const EXPENSE_CATEGORIES = [
  "Aluguel", "Água", "Luz/Energia", "Fatura Cartão de Crédito", "Financiamento Casa",
  "Financiamento Carro", "Despesas Carro", "Condomínio", "IPTU", "IPVA",
  "Telefone/Internet", "Netflix/Streaming", "Mercado", "Refeições fora",
  "Plano de Saúde", "Academia", "Diarista", "Escola/Cursos", "Roupas",
  "Combustível", "Seguro Auto", "Seguro Vida", "Reserva Viagem",
  "Reserva Emergência", "Petshop", "Despesas Bancárias", "Beleza/Barbeiro",
  "Saúde/Exames", "Farmácia", "Água Mineral", "Diversos"
];

export const INCOME_CATEGORIES = [
  "Salário Mensal", "Adiantamento/Vale", "Renda Extra", 
  "Aluguel Recebido", "Investimentos", "Reembolsos", "Outros"
];

export enum UserRole {
  PRIMARY = 'PRIMARY', // Gestor Principal (ex: Marido/Esposa)
  SECONDARY = 'SECONDARY' // Gestor Secundário (ex: Conjuge/Filhos)
}

export interface User {
  id: string;
  name: string;
  familyId: string; // Identificador único da família para agrupar dados
  familyName: string;
  role: UserRole;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string; // ISO string
  createdAt: number;
  // Novos campos para parcelamento
  installmentCurrent?: number; // Qual parcela é esta (ex: 1)
  installmentTotal?: number;   // Total de parcelas (ex: 10)
  // Novos campos de usuário
  userId?: string;
  userName?: string;
}

export interface MonthlySummary {
  month: string; // "YYYY-MM"
  income: number;
  expense: number;
  balance: number;
}

export interface Forecast {
  projectedIncome: number;
  projectedExpense: number;
  advice: string;
  confidence: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isProcessing?: boolean;
  relatedTransaction?: Transaction;
}

export enum DebtStatus {
  PENDING = 'PENDING',
  NEGOTIATING = 'NEGOTIATING',
  PAID = 'PAID'
}

export interface Debt {
  id: string;
  creditor: string; // Quem recebe (Banco, Loja, Pessoa)
  originalValue: number;
  currentValue: number; // Valor com juros
  status: DebtStatus;
  dueDate?: string; // Data de vencimento ou da dívida
  description?: string;
  createdAt: number;
  userId?: string; // Quem cadastrou
}
