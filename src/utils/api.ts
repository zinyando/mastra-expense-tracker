// API Types

import type {
  PaymentMethod,
  Category,
  LegacyExpense,
  Expense,
  DashboardStats,
} from "@/types";
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
export async function getExpenses(): Promise<{ expenses: LegacyExpense[] }> {
  try {
    const response = await fetch("/api/expenses");
    const data = await handleResponse<{ expenses: LegacyExpense[] }>(response);
    return data;
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
}

export async function createExpense(
  data: Omit<LegacyExpense, "id">
): Promise<LegacyExpense> {
  const response = await fetch("/api/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function getExpenseById(id: string): Promise<LegacyExpense> {
  const response = await fetch(`/api/expenses/${id}`);
  return handleResponse(response);
}

export async function updateExpense(
  id: string,
  data: Partial<Omit<LegacyExpense, "id">>
): Promise<LegacyExpense> {
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
export async function processExpenseImage(imageUrl: string): Promise<Expense> {
  const response = await fetch("/api/expenses/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl }),
  });

  const data = await handleResponse<{
    expense?: Expense;
    status?: string;
    suspendedData?: Partial<Expense>;
    fallback?: boolean;
    message: string;
  }>(response);

  let expense: Expense;

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
    } as Expense;

    return expense;
  }

  throw new ApiError(500, data.message || "Failed to process expense");
}

export async function updateWorkflowExpense(
  id: string,
  expense: Partial<Omit<Expense, "id">>
): Promise<Expense> {
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
