// API Types

import type { PaymentMethod, Category, Expense, DashboardStats } from "@/types";
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
  data: Omit<Expense, "id" | "createdAt" | "updatedAt" | "paymentMethodName">
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
  data: Partial<
    Omit<Expense, "id" | "createdAt" | "updatedAt" | "paymentMethodName">
  >
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
export type SuspendedWorkflow = {
  status: string;
  suspendedData: Record<string, unknown>;
  suspendedSteps: string[][];
  workflowId: string;
};

export async function processExpenseImage(
  imageUrl: string
): Promise<Expense | SuspendedWorkflow> {
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
    suspendedData?: Record<string, unknown>;
    suspendedSteps?: string[][];
    fallback?: boolean;
    message: string;
    workflowId?: string;
  }>(response);

  let expense: Expense;

  if (data.expense) {
    expense = data.expense;
    return expense;
  } else if (data.status === "suspended") {
    // For suspended workflows, use the actual suspended data or fallback to defaults
    const workflowData = data.suspendedData as
      | { currentData?: Record<string, unknown> }
      | undefined;
    const currentData = workflowData?.currentData;

    // Only use defaults if we don't have valid suspended data
    const expenseData = currentData || {
      merchant: "Pending",
      amount: 0,
      currency: "USD",
      date: new Date().toISOString(),
      description: "Pending expense",
      category: "",
      items: [],
      tax: 0,
      tip: 0,
      notes: "",
    };

    // Create a suspended workflow object with the actual data
    return {
      status: "suspended",
      suspendedData: {
        currentData: expenseData,
      },
      suspendedSteps: data.suspendedSteps || [["review-expense"]],
      workflowId: data.workflowId || `workflow_${Date.now()}`,
    };
  }

  throw new ApiError(500, data.message || "Failed to process expense");
}

export async function resumeWorkflow(
  workflowId: string,
  stepId: string,
  resumeData: Record<string, unknown>
): Promise<Expense | SuspendedWorkflow> {
  const response = await fetch("/api/expenses/resume", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ workflowId, stepId, resumeData }),
  });

  const data = await handleResponse<{
    expense?: Expense;
    status?: string;
    suspendedData?: Record<string, unknown>;
    suspendedSteps?: string[][];
    fallback?: boolean;
    message: string;
  }>(response);

  let expense: Expense;

  if (data.expense) {
    expense = data.expense;
    return expense;
  } else if (data.status === "suspended" && data.suspendedData) {
    // Return suspended workflow information
    return {
      status: "suspended",
      suspendedData: data.suspendedData,
      suspendedSteps: data.suspendedSteps || [],
      workflowId: workflowId,
    };
  }

  throw new ApiError(500, data.message || "Failed to resume workflow");
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
