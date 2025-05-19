'use client';

import { useState } from 'react';
import { PaymentMethod } from '@/utils/api';

interface PaymentMethodFormProps {
  paymentMethod?: PaymentMethod;
  onSubmit: (data: Omit<PaymentMethod, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export default function PaymentMethodForm({
  paymentMethod,
  onSubmit,
  onCancel,
}: PaymentMethodFormProps) {
  const [formData, setFormData] = useState({
    name: paymentMethod?.name || '',
    type: paymentMethod?.type || 'Credit Card',
    lastFourDigits: paymentMethod?.lastFourDigits || '',
    isDefault: paymentMethod?.isDefault || false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentTypes = [
    'Credit Card',
    'Debit Card',
    'Bank Account',
    'Cash',
    'Digital Wallet',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payment method');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Type
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {paymentTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="lastFourDigits" className="block text-sm font-medium text-gray-700">
          Last 4 Digits
        </label>
        <input
          type="text"
          id="lastFourDigits"
          name="lastFourDigits"
          value={formData.lastFourDigits}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
            setFormData((prev) => ({ ...prev, lastFourDigits: value }));
          }}
          placeholder="Optional"
          maxLength={4}
          pattern="\d{0,4}"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          For cards and accounts, enter the last 4 digits for easy identification
        </p>
      </div>

      <div className="relative flex items-start">
        <div className="flex h-5 items-center">
          <input
            id="isDefault"
            name="isDefault"
            type="checkbox"
            checked={formData.isDefault}
            onChange={(e) => setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="isDefault" className="font-medium text-gray-700">
            Set as default
          </label>
          <p className="text-gray-500">Make this the default payment method for new expenses</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {isSubmitting ? 'Saving...' : paymentMethod ? 'Update Payment Method' : 'Add Payment Method'}
        </button>
      </div>
    </form>
  );
}
