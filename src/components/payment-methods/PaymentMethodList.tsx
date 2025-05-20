'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, CreditCardIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentMethod, getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod } from '@/utils/api';
import Modal from '@/components/ui/Modal';
import PaymentMethodForm from './PaymentMethodForm';

export default function PaymentMethodList() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);

  const fetchPaymentMethods = async () => {
    try {
      const data = await getPaymentMethods();
      setPaymentMethods(data.paymentMethods);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleAddPaymentMethod = () => {
    setEditingPaymentMethod(null);
    setIsModalOpen(true);
  };

  const handleEditPaymentMethod = (method: PaymentMethod) => {
    setEditingPaymentMethod(method);
    setIsModalOpen(true);
  };

  const handleDeletePaymentMethod = async () => {
    if (!methodToDelete) return;
    try {
      await deletePaymentMethod(methodToDelete.id);
      setMethodToDelete(null);
      fetchPaymentMethods(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payment method');
    }
  };

  const handleSubmit = async (data: Omit<PaymentMethod, 'id'>) => {
    try {
      if (editingPaymentMethod) {
        await updatePaymentMethod(editingPaymentMethod.id, data);
      } else {
        await createPaymentMethod(data);
      }
      setIsModalOpen(false);
      fetchPaymentMethods(); // Refresh the list
    } catch (err) {
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <Skeleton className="h-8 w-[180px]" />
            <Skeleton className="h-4 w-[250px] mt-2" />
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Skeleton className="h-10 w-[160px]" />
          </div>
        </div>

        {/* Payment Methods List */}
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-5" />
                          <Skeleton className="h-5 w-[80px]" />
                        </div>
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        <Skeleton className="h-5 w-[100px]" />
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="ml-4">
                              <Skeleton className="h-5 w-[150px]" />
                              <Skeleton className="h-4 w-[100px] mt-1" />
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <Skeleton className="h-5 w-[120px]" />
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end gap-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
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

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <h3 className="text-sm font-medium text-red-800">
          Error loading payment methods
        </h3>
        <div className="mt-2 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Payment Methods</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all payment methods available for expenses.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={handleAddPaymentMethod}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Payment Method
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
                      <div className="flex items-center gap-2">
                        <CreditCardIcon className="h-5 w-5 text-gray-400" />
                        <span>Name</span>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Last 4 Digits
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 text-right text-sm font-medium sm:pr-6"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {paymentMethods.map((method) => (
                    <tr key={method.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        <div className="flex items-center gap-2">
                          {method.name}
                          {method.isDefault && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              Default
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {method.type}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {method.lastFourDigits ? `•••• ${method.lastFourDigits}` : '-'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex gap-4 justify-end">
                          <button
                            type="button"
                            onClick={() => handleEditPaymentMethod(method)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setMethodToDelete(method);
                            }}
                            className="text-red-600 hover:text-red-800 flex items-center"
                            disabled={method.isDefault}
                            title={method.isDefault ? 'Cannot delete default payment method' : ''}
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPaymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}
      >
        <PaymentMethodForm
          paymentMethod={editingPaymentMethod || undefined}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={methodToDelete !== null}
        onClose={() => setMethodToDelete(null)}
        title="Confirm Delete"
      >
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            Are you sure you want to delete this payment method?
            {methodToDelete && (
              <span className="block mt-2 font-medium">
                {methodToDelete.name}
                {methodToDelete.lastFourDigits && (
                  <span className="text-gray-500 ml-2">(**** **** **** {methodToDelete.lastFourDigits})</span>
                )}
              </span>
            )}
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              onClick={() => setMethodToDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
              onClick={handleDeletePaymentMethod}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
