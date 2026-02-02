import { Transaction, TransactionType, Debt, User, DebtStatus, DebtCategory } from '../types';
import { supabase } from './supabase';

const USER_KEY = 'fin_ai_user_session';

// --- Helpers para Mapeamento (Snake Case DB <-> Camel Case App) ---

const mapTransactionFromDB = (dbItem: any): Transaction => ({
  id: dbItem.id,
  amount: Number(dbItem.amount),
  type: dbItem.type as TransactionType,
  category: dbItem.category,
  description: dbItem.description,
  date: dbItem.date,
  createdAt: Number(dbItem.created_at),
  installmentCurrent: dbItem.installment_current || undefined,
  installmentTotal: dbItem.installment_total || undefined,
  userId: dbItem.user_id,
  userName: dbItem.user_name
});

const mapTransactionToDB = (t: Transaction, familyId: string) => ({
  id: t.id,
  amount: t.amount,
  type: t.type,
  category: t.category,
  description: t.description,
  date: t.date,
  created_at: t.createdAt,
  installment_current: t.installmentCurrent || null,
  installment_total: t.installmentTotal || null,
  user_id: t.userId,
  user_name: t.userName,
  family_id: familyId
});

const mapDebtFromDB = (dbItem: any): Debt => ({
  id: dbItem.id,
  creditor: dbItem.creditor,
  originalValue: Number(dbItem.original_value),
  currentValue: Number(dbItem.current_value),
  status: dbItem.status as DebtStatus,
  category: dbItem.category as DebtCategory,
  dueDate: dbItem.due_date,
  description: dbItem.description,
  createdAt: Number(dbItem.created_at),
  userId: dbItem.user_id
});

const mapDebtToDB = (d: Debt, familyId: string) => ({
  id: d.id,
  creditor: d.creditor,
  original_value: d.originalValue,
  current_value: d.currentValue,
  status: d.status,
  category: d.category,
  due_date: d.dueDate,
  description: d.description,
  created_at: d.createdAt,
  user_id: d.userId,
  family_id: familyId
});

// --- User Session (Mantém LocalStorage para persistência de login simples) ---

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

// --- Transactions (Supabase) ---

export const saveTransaction = async (transaction: Transaction): Promise<void> => {
  const user = getUserSession();
  if (!user) return;

  const dbPayload = mapTransactionToDB(transaction, user.familyId);
  
  const { error } = await supabase
    .from('transactions')
    .upsert(dbPayload);

  if (error) console.error('Error saving transaction:', error);
};

export const saveTransactionsBulk = async (transactions: Transaction[]): Promise<void> => {
    const user = getUserSession();
    if (!user) return;

    const dbPayloads = transactions.map(t => mapTransactionToDB(t, user.familyId));

    const { error } = await supabase
        .from('transactions')
        .upsert(dbPayloads);
    
    if (error) console.error('Error bulk saving:', error);
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const user = getUserSession();
  if (!user) return [];

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('family_id', user.familyId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data.map(mapTransactionFromDB);
};

export const updateTransaction = async (updatedTransaction: Transaction): Promise<void> => {
  // Same as save (upsert handles update based on PK)
  await saveTransaction(updatedTransaction);
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) console.error('Error deleting transaction:', error);
};

export const deleteTransactions = async (ids: string[]): Promise<void> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .in('id', ids);

  if (error) console.error('Error deleting transactions:', error);
};

// --- Debts (Supabase) ---

export const saveDebt = async (debt: Debt): Promise<void> => {
  const user = getUserSession();
  if (!user) return;

  const dbPayload = mapDebtToDB(debt, user.familyId);
  const { error } = await supabase
    .from('debts')
    .upsert(dbPayload);

  if (error) console.error('Error saving debt:', error);
};

export const getDebts = async (): Promise<Debt[]> => {
  const user = getUserSession();
  if (!user) return [];

  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .eq('family_id', user.familyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching debts:', error);
    return [];
  }

  return data.map(mapDebtFromDB);
};

export const updateDebt = async (updatedDebt: Debt): Promise<void> => {
  await saveDebt(updatedDebt);
};

export const deleteDebt = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('debts')
    .delete()
    .eq('id', id);
    
  if (error) console.error('Error deleting debt:', error);
};

// --- Helpers ---

export const exportToCSV = (transactions: Transaction[]): string => {
  // Requires transactions passed as arg since getTransactions is now async
  const headers = ["Data", "Descrição", "Categoria", "Tipo", "Valor", "Usuário", "Parcela"];
  const rows = transactions.map(t => [
    new Date(t.date).toLocaleDateString('pt-BR'),
    `"${t.description}"`,
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
