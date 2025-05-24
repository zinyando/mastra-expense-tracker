//
import { create } from "zustand";
import { Expense } from "@/types";
import * as api from "@/utils/api";

type CreateExpenseData = Omit<
  Expense,
  "id" | "createdAt" | "updatedAt" | "categoryName" | "paymentMethodName"
>;

type UpdateExpenseData = Partial<CreateExpenseData>;

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  error: Error | null;
  fetchExpenses: () => Promise<void>;
  fetchExpenseById: (id: string) => Promise<Expense | undefined>;
  addExpense: (expenseData: CreateExpenseData) => Promise<Expense | undefined>;
  updateExpense: (
    id: string,
    expenseData: UpdateExpenseData
  ) => Promise<Expense | undefined>;
  deleteExpense: (id: string) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  isLoading: false,
  error: null,

  fetchExpenses: async () => {
    set({ isLoading: true, error: null });
    try {
      const { expenses } = await api.getExpenses();
      set({ expenses, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error("Failed to fetch expenses"),
      });
    }
  },

  fetchExpenseById: async (id: string) => {
    const existingExpense = get().expenses.find((exp) => exp.id === id);
    if (existingExpense) {
      return existingExpense;
    }

    set({ isLoading: true, error: null });
    try {
      const expense = await api.getExpenseById(id);
      set((state) => ({
        expenses: state.expenses.find((e) => e.id === id)
          ? state.expenses.map((e) => (e.id === id ? expense : e))
          : [...state.expenses, expense as Expense],
        isLoading: false,
      }));
      return expense;
    } catch (error) {
      console.error(`Failed to fetch expense ${id}:`, error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error(`Failed to fetch expense ${id}`),
      });
      return undefined;
    }
  },

  addExpense: async (expenseData) => {
    set({ isLoading: true, error: null });
    try {
      const newExpense = await api.createExpense(expenseData);
      set((state) => ({
        expenses: [...state.expenses, newExpense],
        isLoading: false,
      }));
      return newExpense;
    } catch (error) {
      console.error("Failed to add expense:", error);
      set({
        isLoading: false,
        error:
          error instanceof Error ? error : new Error("Failed to add expense"),
      });
      return undefined;
    }
  },

  updateExpense: async (id, expenseData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedExpense = await api.updateExpense(id, expenseData);
      set((state) => ({
        expenses: state.expenses.map((exp) =>
          exp.id === id ? { ...exp, ...updatedExpense } : exp
        ),
        isLoading: false,
      }));
      return updatedExpense;
    } catch (error) {
      console.error(`Failed to update expense ${id}:`, error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error(`Failed to update expense ${id}`),
      });
      return undefined;
    }
  },

  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteExpense(id);
      set((state) => ({
        expenses: state.expenses.filter((exp) => exp.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      console.error(`Failed to delete expense ${id}:`, error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error(`Failed to delete expense ${id}`),
      });
    }
  },
}));
