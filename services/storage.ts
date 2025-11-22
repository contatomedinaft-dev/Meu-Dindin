
import { Transaction, TransactionType, Debt, User } from '../types';

const USER_KEY = 'fin_ai_user_session';

// Helper to get dynamic keys based on logged family
const getStorageKey = (familyId: string) => `fin_ai_transactions_${familyId}`;
const getDebtsKey = (familyId: string) => `fin_ai_debts_${familyId}`;

// --- User Session ---

export const saveUserSession = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUserSession = (): User | null => {
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
};

export const logoutUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

// --- Transactions (Scoped by Family) ---

export const saveTransaction = (transaction: Transaction): void => {
  const user = getUserSession();
  if (!user) return; // Safety check

  const key = getStorageKey(user.familyId);
  const current = getTransactions(); 
  const updated = [transaction, ...current];
  localStorage.setItem(key, JSON.stringify(updated));
};

export const getTransactions = (): Transaction[] => {
  const user = getUserSession();
  if (!user) return [];

  const key = getStorageKey(user.familyId);
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse transactions", e);
    return [];
  }
};

export const deleteTransaction = (id: string): void => {
  const user = getUserSession();
  if (!user) return;

  const key = getStorageKey(user.familyId);
  const current = getTransactions();
  const updated = current.filter(t => t.id !== id);
  localStorage.setItem(key, JSON.stringify(updated));
};

// --- Debts (Scoped by Family) ---

export const saveDebt = (debt: Debt): void => {
  const user = getUserSession();
  if (!user) return;

  const key = getDebtsKey(user.familyId);
  const current = getDebts();
  const updated = [debt, ...current];
  localStorage.setItem(key, JSON.stringify(updated));
};

export const getDebts = (): Debt[] => {
  const user = getUserSession();
  if (!user) return [];

  const key = getDebtsKey(user.familyId);
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse debts", e);
    return [];
  }
};

export const updateDebt = (updatedDebt: Debt): void => {
  const user = getUserSession();
  if (!user) return;

  const key = getDebtsKey(user.familyId);
  const current = getDebts();
  const updated = current.map(d => d.id === updatedDebt.id ? updatedDebt : d);
  localStorage.setItem(key, JSON.stringify(updated));
};

export const deleteDebt = (id: string): void => {
  const user = getUserSession();
  if (!user) return;

  const key = getDebtsKey(user.familyId);
  const current = getDebts();
  const updated = current.filter(d => d.id !== id);
  localStorage.setItem(key, JSON.stringify(updated));
};

// --- Helpers ---

export const exportToCSV = (): string => {
  const transactions = getTransactions();
  const headers = ["Data", "Descrição", "Categoria", "Tipo", "Valor", "Usuário", "Parcela"];
  const rows = transactions.map(t => [
    new Date(t.date).toLocaleDateString('pt-BR'),
    `"${t.description}"`, // Quote to handle commas in description
    t.category,
    t.type === TransactionType.INCOME ? "Receita" : "Despesa",
    t.amount.toFixed(2).replace('.', ','),
    t.userName || "N/A",
    t.installmentTotal ? `${t.installmentCurrent}/${t.installmentTotal}` : ""
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(r => r.join(","))
  ].join("\n");

  return csvContent;
};
