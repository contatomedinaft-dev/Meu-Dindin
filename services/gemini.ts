import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TransactionType, Forecast } from '../types';

// Initialize Gemini Client
// Note: In a real app, you might handle the key more securely, but for this demo 
// we rely on the environment variable as per instructions.
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const modelId = "gemini-2.5-flash";

/**
 * Parses natural language input into a structured transaction object.
 */
export const parseTransactionFromText = async (text: string): Promise<Partial<Transaction> | null> => {
  if (!apiKey) throw new Error("API Key not found");

  const currentDate = new Date().toISOString();

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `
        Hoje é ${currentDate}.
        Analise o seguinte texto do usuário e extraia os dados financeiros.
        Se o texto não contiver uma transação financeira clara, retorne um objeto com valores nulos ou vazios.
        Texto: "${text}"
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN, description: "True se for uma transação financeira válida" },
            amount: { type: Type.NUMBER, description: "Valor monetário absoluto" },
            type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"], description: "Tipo da transação" },
            category: { type: Type.STRING, description: "Categoria curta (ex: Alimentação, Transporte, Salário)" },
            description: { type: Type.STRING, description: "Descrição curta e clara" },
            date: { type: Type.STRING, description: "Data da transação em formato ISO 8601 (YYYY-MM-DD)" }
          },
          required: ["isValid"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");

    if (!result.isValid) {
      return null;
    }

    return {
      amount: result.amount,
      type: result.type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE,
      category: result.category || 'Geral',
      description: result.description || 'Sem descrição',
      date: result.date || new Date().toISOString()
    };

  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return null;
  }
};

/**
 * Generates financial advice and forecast based on history.
 */
export const generateFinancialForecast = async (transactions: Transaction[]): Promise<Forecast> => {
  if (!apiKey) throw new Error("API Key not found");
  if (transactions.length === 0) {
    return {
      projectedIncome: 0,
      projectedExpense: 0,
      advice: "Adicione transações para receber uma análise.",
      confidence: "Baixa"
    };
  }

  // Summarize data to send less tokens, just last 50 transactions + totals
  const recentTransactions = transactions.slice(0, 50);
  const summary = JSON.stringify(recentTransactions.map(t => ({
    date: t.date,
    amount: t.amount,
    type: t.type,
    category: t.category
  })));

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `
        Atue como um consultor financeiro pessoal. Analise o histórico JSON de transações abaixo.
        Forneça uma previsão para o próximo mês e um conselho curto e prático.
        
        Histórico: ${summary}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectedIncome: { type: Type.NUMBER },
            projectedExpense: { type: Type.NUMBER },
            advice: { type: Type.STRING },
            confidence: { type: Type.STRING, enum: ["Alta", "Média", "Baixa"] }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");

  } catch (error) {
    console.error("Gemini Forecast Error:", error);
    return {
      projectedIncome: 0,
      projectedExpense: 0,
      advice: "Não foi possível gerar previsão no momento.",
      confidence: "Nula"
    };
  }
};
