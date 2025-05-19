'use client';

import { useState } from 'react';
import { Category } from '@/utils/api';

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: Omit<Category, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export default function CategoryForm({ category, onSubmit, onCancel }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    color: category?.color || '#000000',
    description: category?.description || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
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
        <label htmlFor="color" className="block text-sm font-medium text-gray-700">
          Color
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="color"
            id="color"
            name="color"
            value={formData.color}
            onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
            className="h-8 w-8 rounded-md border-gray-300 p-0"
          />
          <input
            type="text"
            value={formData.color}
            onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            pattern="^#[0-9A-Fa-f]{6}$"
            placeholder="#000000"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          rows={3}
        />
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
          {isSubmitting ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
        </button>
      </div>
    </form>
  );
}
