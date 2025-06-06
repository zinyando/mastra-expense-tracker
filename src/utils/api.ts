import type { PaymentMethod, Category, Expense, DashboardStats } from "@/types";

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

export async function getCategories(): Promise<{ categories: Category[] }> {
  const response = await fetch(`${getBaseUrl()}/api/categories`);
  return handleResponse(response);
}

export async function createCategory(
  data: Omit<Category, "id">
): Promise<Category> {
  const response = await fetch(`${getBaseUrl()}/api/categories`, {
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
  const response = await fetch(`${getBaseUrl()}/api/categories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/api/categories/${id}`, {
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

export async function getExpenses(): Promise<{ expenses: Expense[] }> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/expenses`);
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
  const response = await fetch(`${getBaseUrl()}/api/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function getExpenseById(id: string): Promise<Expense> {
  const response = await fetch(`${getBaseUrl()}/api/expenses/${id}`);
  return handleResponse(response);
}

export async function updateExpense(
  id: string,
  data: Partial<
    Omit<Expense, "id" | "createdAt" | "updatedAt" | "paymentMethodName">
  >
): Promise<Expense> {
  const response = await fetch(`${getBaseUrl()}/api/expenses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export type SuspendedWorkflow = {
  status: string;
  suspendedData: Record<string, unknown>;
  suspendedSteps: string[][];
  runId: string;
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
    runId?: string;
  }>(response);

  let expense: Expense;

  if (data.expense) {
    expense = data.expense;
    return expense;
  } else if (data.status === "suspended") {
    const workflowData = data.suspendedData as
      | { currentData?: Record<string, unknown> }
      | undefined;
    const currentData = workflowData?.currentData;
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

    return {
      status: "suspended",
      suspendedData: {
        currentData: expenseData,
      },
      suspendedSteps: data.suspendedSteps || [["review-expense"]],
      runId: data.runId || `workflow_${Date.now()}`,
    };
  }

  throw new ApiError(500, data.message || "Failed to process expense");
}

export async function resumeWorkflow(
  runId: string,
  stepId: string,
  resumeData: Record<string, unknown>
): Promise<Expense | SuspendedWorkflow> {
  const response = await fetch("/api/expenses/resume", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ runId, stepId, resumeData }),
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
    return {
      status: "suspended",
      suspendedData: data.suspendedData,
      suspendedSteps: data.suspendedSteps || [],
      runId: runId,
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
  const response = await fetch(`${getBaseUrl()}/api/expenses/${id}`, {
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

export async function getPaymentMethods(): Promise<{
  paymentMethods: PaymentMethod[];
}> {
  const response = await fetch(`${getBaseUrl()}/api/payment-methods`);
  return handleResponse(response);
}

export async function createPaymentMethod(
  data: Omit<PaymentMethod, "id">
): Promise<PaymentMethod> {
  const response = await fetch(`${getBaseUrl()}/api/payment-methods`, {
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
  const response = await fetch(`${getBaseUrl()}/api/payment-methods/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function deletePaymentMethod(id: string): Promise<void> {
  const response = await fetch(`${getBaseUrl()}/api/payment-methods/${id}`, {
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

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${getBaseUrl()}/api/stats`);
  return handleResponse(response);
}
