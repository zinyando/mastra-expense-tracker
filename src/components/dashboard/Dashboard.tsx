'use client';

import { useEffect, useState } from 'react';
import {
  BanknotesIcon,
  FolderIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import StatCard from '@/components/dashboard/StatCard';
import ExpenseChart from '@/components/dashboard/ExpenseChart';
import { getDashboardStats, processExpenseImage, getCategories } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import Modal from '@/components/ui/Modal';
import ExpenseUpload from '@/components/expenses/ExpenseUpload';
import ExpenseProcessor from '@/components/expenses/ExpenseProcessor';
import { WorkflowExpense, DashboardStats, Category } from '@/types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Add Expense modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<WorkflowExpense | null>(null);
  const [workflowRunId, setWorkflowRunId] = useState<string | null>(null);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Handle file upload and processing
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
        console.error("Expense processing failed after upload.");
      }
    } catch (error) {
      console.error("Error in file upload and process workflow:", error);
    } finally {
      setIsProcessingReceipt(false);
    }
  };

  // Handle expense save/resume
  const handleExpenseSaved = (expense: WorkflowExpense) => {
    setIsEditModalOpen(false);
    setCurrentExpense(null);
    setWorkflowRunId(null);
    // Refresh dashboard stats after adding a new expense
    fetchStats();
    
    // You could do something with the expense here if needed
    console.log('Expense saved:', expense.merchant, expense.amount);
  };

  const fetchStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      if (response && response.categories) {
        setCategories(response.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header with Add Button Skeleton */}
        <div className="sm:flex sm:items-center mb-6">
          <div className="sm:flex-auto">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-lg bg-white px-6 py-8 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <Skeleton className="h-5 w-24" />
                <div className="mt-2">
                  <Skeleton className="h-8 w-32" />
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white px-6 py-8 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <Skeleton className="h-5 w-24" />
                <div className="mt-2">
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Recent Expenses */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Expense Chart */}
          <div className="rounded-lg bg-white p-6 shadow">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="aspect-[4/3]">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="rounded-lg bg-white p-6 shadow">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
        <div className="mt-2 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(stats.totalExpenses);

  return (
    <>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold leading-6 text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-700">
              Overview of your expenses and financial activity.
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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <StatCard
            title="Total Expenses"
            value={formattedTotal}
            icon={BanknotesIcon}
            trend={{
              value: stats.monthlyTrends.trend,
              isPositive: stats.monthlyTrends.trend > 0,
            }}
          />
          <StatCard
            title="Active Categories"
            value={stats.activeCategories.toString()}
            icon={FolderIcon}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ExpenseChart data={stats.expensesByCategory} />
          <div className="rounded-lg bg-white shadow">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Expenses</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {stats.recentExpenses && stats.recentExpenses.length > 0 ? (
                stats.recentExpenses.map((expense) => (
                  <div key={expense.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{expense.merchant}</p>
                        <p className="text-sm text-gray-500">{new Date(expense.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: expense.currency || 'USD',
                      }).format(expense.amount)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-6 text-center text-gray-500">No recent expenses</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Receipt"
      >
        <div className="relative">
          {isProcessingReceipt && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}
          <ExpenseUpload
            onUpload={handleFileUploadAndProcess}
          />
        </div>
      </Modal>

      {/* Edit/Review Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Process Expense"
      >
        {currentExpense && (
          <ExpenseProcessor
            expense={currentExpense}
            categories={categories}
            suspendedData={currentExpense}
            workflowRunId={workflowRunId || undefined}
            onResumed={handleExpenseSaved}
            onClose={() => setIsEditModalOpen(false)}
          />
        )}
      </Modal>
    </>
  );
}
