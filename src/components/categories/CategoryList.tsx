'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCategoryStore } from '@/store/categoryStore'; // Import Zustand store
import type { Category } from '@/types'; // Assuming Category type is in @/types
import { Skeleton } from '@/components/ui/skeleton';
import Modal from '@/components/ui/Modal';
import CategoryForm from './CategoryForm';

export default function CategoryList() {
  const {
    categories,
    isLoading,
    error: storeError,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory, // Corrected action name
  } = useCategoryStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  // Local error state for form submission errors, distinct from store's loading error
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setFormError(null); // Clear previous form errors
    try {
      await deleteCategory(categoryToDelete.id); // Use correct action name
      setCategoryToDelete(null); // Close confirmation modal
      // No manual refresh needed, store handles UI update
    } catch (err) {
      console.error("Failed to delete category:", err);
      // Display error. This could be a specific message or rely on a global error display from the store if appropriate.
      setFormError(err instanceof Error ? err.message : 'Failed to delete category'); 
    }
  };

  const handleSubmit = async (data: Omit<Category, 'id'>) => {
    setFormError(null); // Clear previous form errors
    try {
      if (editingCategory) {
        // updateCategory from store expects Partial<Omit<Category, "id">>
        // data from CategoryForm is Omit<Category, 'id'>, which is compatible.
        await updateCategory(editingCategory.id, data);
      } else {
        // addCategory from store expects Omit<Category, "id">
        await addCategory(data);
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      // No manual refresh needed, store handles UI update
    } catch (err) {
      console.error('Failed to save category:', err);
      // This error will be caught and displayed by CategoryForm's internal error handling
      // Re-throwing allows CategoryForm to catch it.
      throw err; 
    }
  };

  if (isLoading && categories.length === 0) { // Show skeleton only on initial load
    return (
      <div>
        {/* Header */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">
              <Skeleton className="h-7 w-[120px]" />
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              <Skeleton className="h-5 w-[200px]" />
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Skeleton className="h-10 w-[140px]" />
          </div>
        </div>

        {/* Table */}
        <div className="mt-8 flex flex-col">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        <Skeleton className="h-5 w-[60px]" />
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        <Skeleton className="h-5 w-[60px]" />
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <Skeleton className="h-5 w-[150px]" />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-5 w-[80px]" />
                          </div>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex gap-4 justify-end">
                            <Skeleton className="h-5 w-[40px]" />
                            <Skeleton className="h-4 w-4" />
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

  if (storeError) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <h3 className="text-sm font-medium text-red-800">
          Error loading categories
        </h3>
        <div className="mt-2 text-sm text-red-700">{storeError instanceof Error ? storeError.message : storeError}</div>
      </div>
    );
  }

  return (
    <div>
      {formError && (
        <div className="mb-4 rounded-lg bg-red-50 p-4">
          <h3 className="text-sm font-medium text-red-800">Action Error</h3>
          <div className="mt-2 text-sm text-red-700">
            {formError}
          </div>
        </div>
      )}
      <div className="space-y-6">
        <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Categories</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your expense categories
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={handleAddCategory}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Category
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Color
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
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {category.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.color}
                        </div>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex gap-4 justify-end">
                          <button
                            type="button"
                            onClick={() => handleEditCategory(category)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCategoryToDelete(category);
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
    </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <CategoryForm
          category={editingCategory || undefined} onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={categoryToDelete !== null}
        onClose={() => setCategoryToDelete(null)}
        title="Confirm Delete"
      >
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            Are you sure you want to delete this category?
            {categoryToDelete && (
              <span className="block mt-2 font-medium">
                {categoryToDelete.name}
              </span>
            )}
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              onClick={() => { setFormError(null); setCategoryToDelete(null); }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
              onClick={handleDeleteCategory}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
