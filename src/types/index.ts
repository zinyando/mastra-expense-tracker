/**
 * Core data types for the Mastra Expense Tracker application.
 */

// From src/utils/api.ts
export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  lastFourDigits?: string;
  isDefault: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  description: string;
}

// Renamed from 'Expense' in src/utils/api.ts to avoid naming conflict
// and to denote its usage for simpler/legacy expense structures.
export interface LegacyExpense {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string;
}

export interface ExpenseItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  total: number;
}

// This was 'WorkflowExpense' in src/utils/api.ts and structurally
// equivalent to 'Expense' in src/components/expenses/ExpenseProcessor.tsx
export interface Expense {
  id: string;
  merchant: string;
  amount: number;
  currency: string;
  date: string;
  categoryId: string;
  items?: ExpenseItem[];
  tax?: number;
  tip?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalExpenses: number;
  activeCategories: number;
  expensesByCategory: Array<{
    categoryId: string;
    categoryName: string;
    total: number;
  }>;
  recentExpenses: LegacyExpense[]; // Ensure this uses LegacyExpense
  monthlyTrends: {
    currentMonth: number;
    previousMonth: number;
    trend: number;
  };
}
