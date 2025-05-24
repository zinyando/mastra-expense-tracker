"use client";

import { useState, useEffect, useMemo } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Skeleton } from "@/components/ui/skeleton";
import { Expense, WorkflowExpense, Category } from "@/types"; // Assuming WorkflowExpense and Category are in @/types
import { processExpenseImage } from "@/utils/api"; // updateWorkflowExpense is likely handled in ExpenseProcessor
import { useExpenseStore } from "@/store/expenseStore";
import { useCategoryStore } from "@/store/categoryStore";
import Modal from "@/components/ui/Modal";
import ExpenseUpload from "./ExpenseUpload";
import ExpenseProcessor from "./ExpenseProcessor";

export default function ExpenseList() {
  const {
    expenses,
    isLoading: isLoadingExpenses,
    error: errorExpenses,
    fetchExpenses,
    fetchExpenseById,
    deleteExpense: deleteExpenseFromStore,
  } = useExpenseStore();

  const {
    categories: categoriesList,
    isLoading: isLoadingCategories,
    error: errorCategories,
    fetchCategories,
  } = useCategoryStore();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<WorkflowExpense | null>(
    null
  );
  const [workflowRunId, setWorkflowRunId] = useState<string | null>(null);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false); // This might be managed inside ExpenseUpload or Processor
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const overallLoading = isLoadingExpenses || isLoadingCategories;
  const overallError = errorExpenses || errorCategories;

  const categoriesMap = useMemo(() => {
    return categoriesList.reduce(
      (acc, category) => {
        acc[category.id] = category;
        return acc;
      },
      {} as Record<string, Category>
    );
  }, [categoriesList]);

  // Function to handle deleting an expense
  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      // Error state will be handled by the store, component can listen if needed
      await deleteExpenseFromStore(expenseToDelete.id);
      setExpenseToDelete(null); // Close confirmation modal or clear selection
      // The store update will trigger a re-render with the updated expenses list
    } catch (err) {
      // Optionally, handle/display error specific to this action if not covered by global store error
      console.error("Delete expense error (local component):", err);
      // setError(err instanceof Error ? err.message : "Failed to delete expense"); // This local error state might be redundant
    }
  };

  const handleEditExpense = async (expense: Expense) => {
    try {
      // Show loading state while we fetch the complete expense details
      const loadingExpense: WorkflowExpense = {
        id: expense.id,
        merchant: expense.merchant, // Use expense.merchant
        description: expense.description, // Add description field
        amount: expense.amount,
        currency: "USD", // Ensure this is correct or from expense.currency
        date: expense.date,
        categoryId: expense.categoryId,
        items: expense.items || [], // Use existing items if available
        createdAt: expense.createdAt || new Date().toISOString(), // Prefer existing timestamps
        updatedAt: expense.updatedAt || new Date().toISOString(),
        // Ensure all required fields from 'Expense' type are present
        paymentMethodId: expense.paymentMethodId,
        tax: expense.tax,
        tip: expense.tip,
        notes: expense.notes,
        categoryName: expense.categoryName,
        paymentMethodName: expense.paymentMethodName,
      };

      setCurrentExpense(loadingExpense);
      setIsEditModalOpen(true);

      // Try to fetch the complete expense details using the store action
      try {
        const completeExpense = await fetchExpenseById(expense.id); // This ensures it's in the store and returns it

        if (completeExpense) {
          const updatedWorkflowExpense: WorkflowExpense = {
            // Ensure WorkflowExpense includes all necessary fields from Expense
            id: completeExpense.id,
            merchant: completeExpense.merchant || loadingExpense.merchant, // Prefer completeExpense.merchant directly
            amount: completeExpense.amount,
            currency: completeExpense.currency,
            date: completeExpense.date,
            categoryId: completeExpense.categoryId,
            items: completeExpense.items || [],
            description: completeExpense.description, // Add if WorkflowExpense has it
            // categoryName: completeExpense.categoryName, // Add if needed by WorkflowExpense
            // paymentMethodId: completeExpense.paymentMethodId, // Add if needed
            // paymentMethodName: completeExpense.paymentMethodName, // Add if needed
            createdAt: completeExpense.createdAt,
            updatedAt: completeExpense.updatedAt,
          };
          setCurrentExpense(updatedWorkflowExpense);
        } else {
          // If store couldn't fetch/find, use basic data (though store's fetch should handle errors)
          console.warn(
            "Could not fetch complete expense details via store, using basic data."
          );
          setCurrentExpense(loadingExpense);
        }
      } catch (fetchError) {
        console.warn(
          "Error fetching complete expense details via store:",
          fetchError
        );
        setCurrentExpense(loadingExpense); // Fallback to basic data
        // The store's error state (errorExpenses) should reflect this failure.
      }
    } catch (error) {
      console.error(
        "Failed to prepare expense for editing (local component):",
        error
      );
      // setError(error instanceof Error ? error.message : "Failed to prepare expense for editing");
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

  // New handler for file upload and then processing
  const handleFileUploadAndProcess = async (file: File) => {
    setIsProcessingReceipt(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/expenses/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({
          message: "File upload failed with status: " + uploadResponse.status,
        }));
        throw new Error(errorData.message || "File upload failed");
      }

      const uploadResult = await uploadResponse.json();
      if (!uploadResult.url) {
        throw new Error("File upload did not return a URL.");
      }

      const imageUrl = uploadResult.url;
      const result = await processExpenseImage(imageUrl);

      if ("status" in result && result.status === "suspended") {
        const suspendedWorkflow = result;
        setCurrentExpense(
          suspendedWorkflow.suspendedData.currentData as WorkflowExpense
        );
        setWorkflowRunId(suspendedWorkflow.workflowId);
        setIsUploadModalOpen(false);
        setIsEditModalOpen(true);
      } else if ("merchant" in result) {
        setCurrentExpense(result as WorkflowExpense);
        setIsUploadModalOpen(false);
        setIsEditModalOpen(true);
      } else {
        // Handle case where processing might return null or undefined, e.g. show an error
        console.error("Expense processing failed after upload.");
        // Optionally set an error message for the user
      }
    } catch (error) {
      console.error("Error in file upload and process workflow:", error);
      // Optionally, set a user-facing error message in the UI
      // For example, by using a new state variable like setUploadError((error as Error).message)
    } finally {
      setIsProcessingReceipt(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [fetchExpenses, fetchCategories]);

  if (overallLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold leading-6 text-gray-900">Expenses</h1>
            <p className="mt-2 text-sm text-gray-700">
              <Skeleton className="h-4 w-[300px]" />
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <Skeleton className="h-9 w-[120px]" />
          </div>
        </div>

        {/* Table Skeleton */}
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
                        Merchant
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
                    {[...Array(5)].map((_, index) => (
                      <tr key={`skeleton-${index}`}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <Skeleton className="h-4 w-[80px]" />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <Skeleton className="h-4 w-[120px]" />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 truncate max-w-xs">
                          <Skeleton className="h-4 w-[150px]" />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <Skeleton className="h-4 w-[100px]" />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <Skeleton className="h-4 w-[60px]" />
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-3">
                            <Skeleton className="h-4 w-[30px]" />
                            <Skeleton className="h-5 w-5" />
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
      </div>
    );
  }

  if (overallError) {
    return (
      <div className="text-center py-10 px-4 sm:px-6 lg:px-8">
        <p className="text-red-500">
          Error loading data:{" "}
          {overallError?.message || "An unknown error occurred"}
        </p>
        <button
          onClick={() => {
            fetchExpenses();
            fetchCategories();
          }}
          className="mt-4 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-indigo-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">
            Expenses
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all your expenses including their date, merchant,
            category, and amount.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-indigo-600"
          >
            <PlusIcon className="h-5 w-5 -ml-0.5 mr-1.5 inline" />
            Add Expense
          </button>
        </div>
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
                      Merchant
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
                  {expenses.length > 0 ? (
                    expenses.map((exp) => (
                      <tr key={exp.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {formatDate(exp.date)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {exp.merchant}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 truncate max-w-xs">
                          {exp.description}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {categoriesMap[exp.categoryId]?.name ||
                            exp.categoryId}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: exp.currency || "USD",
                          }).format(exp.amount)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleEditExpense(exp)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setExpenseToDelete(exp)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-10 text-gray-500"
                      >
                        No expenses found. Click &quot;Add Expense&quot; to get
                        started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          if (!isProcessingReceipt) setIsUploadModalOpen(false);
        }}
        title="Upload Expense Receipt"
      >
        {isProcessingReceipt ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-sm text-gray-600">Processing receipt...</p>
          </div>
        ) : (
          <ExpenseUpload onUpload={handleFileUploadAndProcess} />
        )}
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setCurrentExpense(null);
        }}
        title={
          workflowRunId
            ? "Review Expense"
            : currentExpense?.id
              ? "Edit Expense"
              : "Add New Expense"
        }
      >
        {currentExpense ? (
          <ExpenseProcessor
            expense={currentExpense}
            categories={categoriesList}
            suspendedData={workflowRunId ? currentExpense : undefined}
            workflowRunId={workflowRunId || undefined}
            onResumed={() => {
              setIsEditModalOpen(false);
              setCurrentExpense(null);
              setWorkflowRunId(null);
            }}
            onClose={() => {
              setIsEditModalOpen(false);
              setCurrentExpense(null);
              setWorkflowRunId(null);
            }}
          />
        ) : null}
      </Modal>

      <Modal
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        title="Confirm Delete Expense"
      >
        {expenseToDelete && (
          <div>
            <p className="text-sm text-gray-500">
              Are you sure you want to delete the expense for &quot;
              {expenseToDelete.merchant}&quot; on{" "}
              {formatDate(expenseToDelete.date)}? This action cannot be undone.
            </p>
            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row-reverse gap-3">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto"
                onClick={async () => {
                  await handleDeleteExpense();
                  // setExpenseToDelete(null); // handleDeleteExpense already sets this
                }}
              >
                Delete
              </button>
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto"
                onClick={() => setExpenseToDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
