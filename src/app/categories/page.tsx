import { PlusIcon } from '@heroicons/react/24/outline';

const categories = [
  {
    id: 1,
    name: 'Office Supplies',
    description: 'General office supplies and equipment',
    color: '#3B82F6', // blue
    expenseCount: 15,
    totalAmount: 2345.67,
  },
  {
    id: 2,
    name: 'Travel',
    description: 'Business travel expenses',
    color: '#10B981', // green
    expenseCount: 8,
    totalAmount: 4567.89,
  },
  {
    id: 3,
    name: 'Software',
    description: 'Software licenses and subscriptions',
    color: '#6366F1', // indigo
    expenseCount: 12,
    totalAmount: 1234.56,
  },
  {
    id: 4,
    name: 'Meals',
    description: 'Business meals and entertainment',
    color: '#F59E0B', // yellow
    expenseCount: 25,
    totalAmount: 789.12,
  },
];

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
        <button
          type="button"
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400"
          >
            <div className="flex-shrink-0">
              <div
                className="h-10 w-10 rounded-full"
                style={{ backgroundColor: category.color }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="focus:outline-none">
                <p className="text-sm font-medium text-gray-900">{category.name}</p>
                <p className="truncate text-sm text-gray-500">
                  {category.description}
                </p>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span>{category.expenseCount} expenses</span>
                  <span className="mx-2">•</span>
                  <span>${category.totalAmount.toFixed(2)} total</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <button
                type="button"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
