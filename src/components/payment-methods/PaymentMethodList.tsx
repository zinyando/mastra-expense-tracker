'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, CreditCardIcon, TrashIcon, PencilIcon, StarIcon } from '@heroicons/react/24/outline'; // Added PencilIcon, StarIcon
import { Skeleton } from '@/components/ui/skeleton';
import { usePaymentMethodStore } from '@/store/paymentMethodStore';
import { PaymentMethod } from '@/types'; // Using central types
import Modal from '@/components/ui/Modal';
import PaymentMethodForm from './PaymentMethodForm';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function PaymentMethodList() {
  const {
    paymentMethods,
    isLoading,
    error: storeError, // Renamed to avoid conflict with potential local error states
    fetchPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
  } = usePaymentMethodStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);
  const [formError, setFormError] = useState<string | null>(null); // For non-form specific errors (e.g., delete)

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]); // Added fetchPaymentMethods to dependency array

  const handleAddPaymentMethod = () => {
    setEditingPaymentMethod(null);
    setFormError(null); // Clear previous errors
    setIsModalOpen(true);
  };

  const handleEditPaymentMethod = (method: PaymentMethod) => {
    setEditingPaymentMethod(method);
    setFormError(null); // Clear previous errors
    setIsModalOpen(true);
  };

  // New function to open delete confirmation, separating from actual deletion logic
  const openDeleteConfirmation = (method: PaymentMethod) => {
    setMethodToDelete(method);
    setFormError(null); // Clear previous errors
  };

  const handleDeletePaymentMethod = async () => {
    if (!methodToDelete) return;
    setFormError(null); // Clear error before attempting delete
    try {
      await deletePaymentMethod(methodToDelete.id); // Use store action
      setMethodToDelete(null); // Close confirmation modal
      // No manual refresh needed, store handles UI update
    } catch (err) {
      console.error("Failed to delete payment method:", err);
      setFormError(err instanceof Error ? err.message : 'Failed to delete payment method');
    }
  };
  
  const handleSetDefault = async (id: string) => {
    setFormError(null);
    try {
      await setDefaultPaymentMethod(id);
      // UI should update based on store changes reflecting the new default
    } catch (err) {
      console.error("Failed to set default payment method:", err);
      setFormError(err instanceof Error ? err.message : 'Failed to set default payment method');
    }
  };

  const handleSubmit = async (data: Omit<PaymentMethod, 'id'>) => { // Assuming form provides Omit<PaymentMethod, 'id'>
    setFormError(null);
    try {
      if (editingPaymentMethod) {
        // updatePaymentMethod from store expects Partial<Omit<PaymentMethod, "id">>
        // data from form is Omit<PaymentMethod, 'id'>, which is compatible.
        await updatePaymentMethod(editingPaymentMethod.id, data);
      } else {
        // addPaymentMethod from store expects Omit<PaymentMethod, "id">
        await addPaymentMethod(data);
      }
      setIsModalOpen(false);
      setEditingPaymentMethod(null);
      // No manual refresh needed, store handles UI update
    } catch (err) {
      console.error('Failed to save payment method:', err);
      // Re-throw error to be handled by PaymentMethodForm's internal error display
      throw err; 
    }
  };

  if (isLoading && !paymentMethods.length) { 
    return (
      <div className="space-y-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <Skeleton className="h-8 w-[220px]" />
            <Skeleton className="h-4 w-[300px] mt-2" />
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Skeleton className="h-10 w-[180px]" />
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Skeleton className="h-5 w-[100px]" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-[80px]" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-[100px]" /></TableHead>
                  <TableHead className="text-right"><Skeleton className="h-5 w-[80px] float-right" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-12 rounded-md" />
                        <Skeleton className="h-5 w-[150px]" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-[70px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[90px]" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(storeError || formError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{storeError?.message || formError}</AlertDescription>
        </Alert>
      )}

      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Methods</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage your payment methods for expense tracking.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button onClick={handleAddPaymentMethod}>
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Payment Method
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Payment Methods</CardTitle>
          <CardDescription>
            View and manage all your registered payment methods.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && paymentMethods.length > 0 && <p className="p-4 text-center text-sm text-gray-500">Updating list...</p>}
          {!isLoading && paymentMethods.length === 0 && !storeError && (
            <div className="p-6 text-center">
              <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No payment methods</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding a new payment method.</p>
            </div>
          )}
          {paymentMethods.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Last 4 Digits</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentMethods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <CreditCardIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">{method.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">{method.type}</TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">{method.lastFourDigits || 'N/A'}</TableCell>
                    <TableCell>
                      {method.isDefault ? (
                        <StarIcon className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleSetDefault(method.id)} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                          Set Default
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditPaymentMethod(method)} title="Edit">
                        <PencilIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteConfirmation(method)} title="Delete">
                        <TrashIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
