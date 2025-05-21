// API Types

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

// Legacy Expense interface for backwards compatibility
export interface Expense {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string;
}

// New ExpenseItem interface for line items in a receipt
export interface ExpenseItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  total: number;
}

// New WorkflowExpense interface that matches our expense workflow output
export interface WorkflowExpense {
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
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(response.status, error.error || "An error occurred");
  }
  return response.json();
}

// Categories API
export async function getCategories(): Promise<{ categories: Category[] }> {
  const response = await fetch("/api/categories");
  return handleResponse(response);
}

export async function createCategory(
  data: Omit<Category, "id">
): Promise<Category> {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updateCategory(
  id: string,
  data: Partial<Omit<Category, "id">>
): Promise<Category> {
  const response = await fetch(`/api/categories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(
      response.status,
      error.error || "Failed to delete category"
    );
  }
}

// Expenses API
export async function getExpenses(): Promise<{ expenses: Expense[] }> {
  try {
    const response = await fetch("/api/expenses");
    const data = await handleResponse<{ expenses: Expense[] }>(response);
    return data;
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
}

export async function createExpense(
  data: Omit<Expense, "id">
): Promise<Expense> {
  const response = await fetch("/api/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function getExpenseById(id: string): Promise<Expense> {
  const response = await fetch(`/api/expenses/${id}`);
  return handleResponse(response);
}

export async function updateExpense(
  id: string,
  data: Partial<Omit<Expense, "id">>
): Promise<Expense> {
  const response = await fetch(`/api/expenses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

// Workflow-based expense processing
export async function processExpenseImage(
  imageUrl: string
): Promise<WorkflowExpense> {
  const response = await fetch("/api/expenses/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl }),
  });

  const data = await handleResponse<{
    expense?: WorkflowExpense;
    status?: string;
    suspendedData?: Partial<WorkflowExpense>;
    fallback?: boolean;
    message: string;
  }>(response);

  let expense: WorkflowExpense;

  if (data.expense) {
    expense = data.expense;

    // If using fallback storage, save to localStorage
    return expense;
  } else if (data.status === "suspended" && data.suspendedData) {
    // Add fake ID and timestamps if they don't exist in suspended data
    expense = {
      id: `temp_${Date.now()}`,
      ...data.suspendedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as WorkflowExpense;

    return expense;
  }

  throw new ApiError(500, data.message || "Failed to process expense");
}

export async function updateWorkflowExpense(
  id: string,
  expense: Partial<Omit<WorkflowExpense, "id">>
): Promise<WorkflowExpense> {
  const response = await fetch(`/api/expenses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...expense,
      id,
    }),
  });
  return handleResponse(response);
}

export async function deleteExpense(id: string): Promise<void> {
  const response = await fetch(`/api/expenses/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(
      response.status,
      error.error || "Failed to delete expense"
    );
  }
}

// Payment Methods API
export async function getPaymentMethods(): Promise<{
  paymentMethods: PaymentMethod[];
}> {
  const response = await fetch("/api/payment-methods");
  return handleResponse(response);
}

export async function createPaymentMethod(
  data: Omit<PaymentMethod, "id">
): Promise<PaymentMethod> {
  const response = await fetch("/api/payment-methods", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function updatePaymentMethod(
  id: string,
  data: Partial<Omit<PaymentMethod, "id">>
): Promise<PaymentMethod> {
  const response = await fetch(`/api/payment-methods/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function deletePaymentMethod(id: string): Promise<void> {
  const response = await fetch(`/api/payment-methods/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(
      response.status,
      error.error || "Failed to delete payment method"
    );
  }
}

// Dashboard Stats API
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetch("/api/stats");
  return handleResponse(response);
}
