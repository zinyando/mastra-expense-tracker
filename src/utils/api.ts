// API Types
export interface Category {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string;
}

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

export interface Stats {
  totalExpenses: number;
  expensesByCategory: {
    categoryId: string;
    total: number;
  }[];
}

// API Error handling
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(response.status, error.error || 'An error occurred');
  }
  return response.json();
}

// Categories API
export async function getCategories(): Promise<{ categories: Category[] }> {
  const response = await fetch('/api/categories');
  return handleResponse(response);
}

export async function createCategory(data: Omit<Category, 'id'>): Promise<Category> {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateCategory(id: string, data: Partial<Omit<Category, 'id'>>): Promise<Category> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(response.status, error.error || 'Failed to delete category');
  }
}

// Expenses API
export async function getExpenses(): Promise<{ expenses: Expense[] }> {
  const response = await fetch('/api/expenses');
  return handleResponse(response);
}

export async function createExpense(data: Omit<Expense, 'id'>): Promise<Expense> {
  const response = await fetch('/api/expenses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateExpense(id: string, data: Partial<Omit<Expense, 'id'>>): Promise<Expense> {
  const response = await fetch(`/api/expenses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function deleteExpense(id: string): Promise<void> {
  const response = await fetch(`/api/expenses/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(response.status, error.error || 'Failed to delete expense');
  }
}

// Dashboard Stats API
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/stats');
  return handleResponse(response);
}
