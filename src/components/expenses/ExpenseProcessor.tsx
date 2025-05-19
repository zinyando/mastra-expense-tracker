'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ExpenseItem = {
  description: string;
  quantity?: number;
  unitPrice?: number;
  total: number;
};

type Expense = {
  id: string;
  merchant: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  items?: ExpenseItem[];
  tax?: number;
  tip?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

interface ExpenseProcessorProps {
  expense: Expense;
  onSave: (expense: Expense) => Promise<void>;
  onCancel: () => void;
}

export default function ExpenseProcessor({ expense, onSave, onCancel }: ExpenseProcessorProps) {
  const [formData, setFormData] = useState<Expense>(expense);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      if (name.includes('.')) {
        // Handle nested properties (for items)
        const [parent, child, index] = name.split('.');
        if (parent === 'items' && index) {
          const items = [...(prev.items || [])];
          const idx = parseInt(index);
          items[idx] = {
            ...items[idx],
            [child]: child === 'description' ? value : parseFloat(value)
          };
          return { ...prev, items };
        }
        return prev;
      }
      
      // Handle flat properties
      if (['amount', 'tax', 'tip'].includes(name)) {
        return { ...prev, [name]: parseFloat(value) };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSave(formData);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate totals
  const itemsTotal = formData.items?.reduce((sum, item) => sum + item.total, 0) || 0;
  const taxAmount = formData.tax || 0;
  const tipAmount = formData.tip || 0;
  const total = itemsTotal + taxAmount + tipAmount;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Edit Expense</h3>
        
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="merchant" className="block text-sm font-medium text-gray-700">
                Merchant
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="merchant"
                  id="merchant"
                  value={formData.merchant}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  name="date"
                  id="date"
                  value={formData.date.split('T')[0]}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">{formData.currency}</span>
                </div>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 pl-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <div className="mt-1">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">Select category</option>
                  <option value="Meals">Meals</option>
                  <option value="Travel">Travel</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
              
              {formData.items && formData.items.length > 0 ? (
                <div className="overflow-hidden border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <input
                              type="text"
                              name={`items.description.${index}`}
                              value={item.description}
                              onChange={handleChange}
                              className="block w-full border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <input
                              type="number"
                              name={`items.quantity.${index}`}
                              value={item.quantity || 1}
                              onChange={handleChange}
                              className="block w-full border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
                              min="1"
                              step="1"
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <input
                              type="number"
                              name={`items.unitPrice.${index}`}
                              value={item.unitPrice || (item.total / (item.quantity || 1))}
                              onChange={handleChange}
                              className="block w-full border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <input
                              type="number"
                              name={`items.total.${index}`}
                              value={item.total}
                              onChange={handleChange}
                              className="block w-full border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm"
                              min="0"
                              step="0.01"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No items found</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="tax" className="block text-sm font-medium text-gray-700">
                Tax
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="tax"
                  id="tax"
                  value={formData.tax || 0}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="tip" className="block text-sm font-medium text-gray-700">
                Tip
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="tip"
                  id="tip"
                  value={formData.tip || 0}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="total" className="block text-sm font-medium text-gray-700">
                Total
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  id="total"
                  value={total}
                  className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
                  disabled
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <div className="mt-1">
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes || ''}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
