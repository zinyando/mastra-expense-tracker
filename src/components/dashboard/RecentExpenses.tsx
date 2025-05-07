const recentExpenses = [
  {
    id: 1,
    description: 'Office Supplies',
    amount: 234.56,
    category: 'Office',
    date: '2025-05-07',
  },
  {
    id: 2,
    description: 'Client Lunch',
    amount: 89.99,
    category: 'Meals',
    date: '2025-05-06',
  },
  {
    id: 3,
    description: 'Software License',
    amount: 599.00,
    category: 'Software',
    date: '2025-05-05',
  },
  {
    id: 4,
    description: 'Travel Expenses',
    amount: 789.50,
    category: 'Travel',
    date: '2025-05-04',
  },
  {
    id: 5,
    description: 'Marketing Campaign',
    amount: 1299.99,
    category: 'Marketing',
    date: '2025-05-03',
  },
];

export default function RecentExpenses() {
  return (
    <div className="rounded-lg bg-white shadow">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Expenses</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {recentExpenses.map((expense) => (
          <div key={expense.id} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {expense.description}
                </p>
                <p className="text-sm text-gray-500">{expense.category}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  ${expense.amount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">{expense.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
