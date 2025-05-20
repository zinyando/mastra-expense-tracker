"use client";

import { useState, useEffect } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Skeleton } from '@/components/ui/skeleton';
import {
  Expense,
  WorkflowExpense,
  getExpenses,
  getExpenseById,
  processExpenseImage,
  updateWorkflowExpense,
  deleteExpense,
} from "@/utils/api";
import Modal from "@/components/ui/Modal";
import ExpenseUpload from "./ExpenseUpload";
import ExpenseProcessor from "./ExpenseProcessor";

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<WorkflowExpense | null>(
    null
  );
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Function to handle editing an existing expense
  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      setError(null);
      await deleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
      // Refresh the expenses list after deletion
      const { expenses: updatedExpenses } = await getExpenses();
      setExpenses(updatedExpenses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense");
    }
  };

  const handleEditExpense = async (expense: Expense) => {
    try {
      setError(null);

      // Show loading state while we fetch the complete expense details
      const loadingExpense: WorkflowExpense = {
        id: expense.id,
        merchant: expense.description,
        amount: expense.amount,
        currency: "USD",
        date: expense.date,
        category: expense.categoryId,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCurrentExpense(loadingExpense);
      setIsEditModalOpen(true);

      // Try to fetch the complete expense details from the API
      try {
        const completeExpense = await getExpenseById(expense.id);

        // If we get the expense from the API, update with more details if available
        const updatedWorkflowExpense: WorkflowExpense = {
          ...loadingExpense,
          merchant: completeExpense.description || loadingExpense.merchant,
          category: completeExpense.categoryId || loadingExpense.category,
          // Add any additional fields from the API response
        };

        setCurrentExpense(updatedWorkflowExpense);
      } catch (fetchError) {
        // If API fetch fails, we'll just use the basic data we already have
        console.warn("Could not fetch complete expense details:", fetchError);
        // No need to close the modal or show error as we can still edit with basic info
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to prepare expense for editing"
      );
      setIsEditModalOpen(false);
    }
  };

  // Helper function to format dates consistently
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return "";

      // Create a Date object from the string
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        // Try to handle special cases
        if (typeof dateString === "string" && dateString.includes("T")) {
          // It's probably an ISO string with formatting issues
          return dateString.split("T")[0]; // Extract just the YYYY-MM-DD part
        }
        return dateString; // Return original if we can't parse it
      }

      // Format as YYYY-MM-DD
      return date.toISOString().split("T")[0];
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Return original string on error
    }
  };

  // Function to process an uploaded receipt image using the expense workflow
  const handleProcessExpense = async (imageUrl: string) => {
    try {
      const processedExpense = await processExpenseImage(imageUrl);

      // Show the expense in edit mode
      setCurrentExpense(processedExpense);
      setIsUploadModalOpen(false);
      setIsEditModalOpen(true);

      // Refresh the expenses list
      const refreshedData = await getExpenses();
      setExpenses(refreshedData.expenses);
    } catch (error) {
      console.error("Error processing expense:", error);
      setError(
        error instanceof Error ? error.message : "Failed to process expense"
      );
    } finally {
      setIsProcessingReceipt(false);
    }
  };

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const data = await getExpenses();
        setExpenses(data.expenses);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load expenses"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-[150px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[120px]" />
        </div>

        {/* Expenses List */}
        <div className="rounded-lg border bg-card">
          <div className="p-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 hover:bg-accent rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-10" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <h3 className="text-sm font-medium text-red-800">
          Error loading expenses
        </h3>
        <div className="mt-2 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
          Add Expense
        </button>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {formatDate(expense.date)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {expense.description}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {expense.categoryId}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(expense.amount)}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex gap-4 justify-end">
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setExpenseToDelete(expense);
                            }}
                            className="text-red-600 hover:text-red-800 flex items-center"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Expense Receipt"
      >
        {isProcessingReceipt ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-sm text-gray-600">Processing receipt...</p>
          </div>
        ) : (
          <ExpenseUpload
            onUpload={async (file) => {
              try {
                // First upload the file
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/expenses/upload", {
                  method: "POST",
                  body: formData,
                });

                if (!response.ok) {
                  throw new Error("Failed to upload file");
                }

                const data = await response.json();

                // Then process the uploaded file with the workflow
                if (data.url) {
                  setIsProcessingReceipt(true);
                  await handleProcessExpense(data.url);
                }
              } catch (error) {
                console.error("Error uploading file:", error);
                setError(
                  error instanceof Error
                    ? error.message
                    : "Failed to upload file"
                );
                setIsUploadModalOpen(false);
              }
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Expense"
      >
        {currentExpense && (
          <ExpenseProcessor
            expense={currentExpense}
            onSave={async (updatedExpense) => {
              try {
                // Save the updated expense using our utility function
                await updateWorkflowExpense(updatedExpense.id, updatedExpense);

                // Refresh expenses and close the modal
                const updatedData = await getExpenses();
                setExpenses(updatedData.expenses);
                setIsEditModalOpen(false);
                setCurrentExpense(null);
              } catch (error) {
                console.error("Error saving expense:", error);
                throw error;
              }
            }}
            onCancel={() => {
              setIsEditModalOpen(false);
              setCurrentExpense(null);
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={expenseToDelete !== null}
        onClose={() => setExpenseToDelete(null)}
        title="Confirm Delete"
      >
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            Are you sure you want to delete this expense?
            {expenseToDelete && (
              <span className="block mt-2 font-medium">
                {expenseToDelete.description} - {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(expenseToDelete.amount)}
              </span>
            )}
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              onClick={() => setExpenseToDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
              onClick={handleDeleteExpense}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
