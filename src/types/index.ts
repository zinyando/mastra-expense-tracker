/**
 * Core data types for the Mastra Expense Tracker application.
 */

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

export interface ExpenseItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  total: number;
}

export interface Expense {
  id: string;
  merchant: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  paymentMethodId?: string;
  paymentMethodName?: string;
  items?: ExpenseItem[];
  tax?: number;
  tip?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
}

export type WorkflowExpense = Expense;

export interface DashboardStats {
  totalExpenses: number;
  activeCategories: number;
  expensesByCategory: Array<{
    categoryId: string;
    categoryName: string;
    total: number;
  }>;
  recentExpenses: Expense[];
  monthlyTrends: {
    currentMonth: number;
    previousMonth: number;
    trend: number;
  };
}
