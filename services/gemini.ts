
import { Transaction, TransactionType } from '../types';

/**
 * AI features have been disabled.
 * This file is kept as a placeholder to maintain project structure if needed later.
 */

export const parseTransactionFromText = async (text: string): Promise<Partial<Transaction> | null> => {
  console.warn("AI parsing is disabled.");
  return null;
};

export const generateFinancialForecast = async (transactions: Transaction[]): Promise<any> => {
  console.warn("AI forecast is disabled.");
  return {
      projectedIncome: 0,
      projectedExpense: 0,
      advice: "Análise por IA desativada.",
      confidence: "Nula"
  };
};
