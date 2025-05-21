import { Expense } from "@/types";

interface RecentExpensesProps {
  expenses: Expense[];
}

export default function RecentExpenses({ expenses }: RecentExpensesProps) {
  return (
    <div className="rounded-lg bg-white shadow">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Expenses</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {expenses.map((expense) => (
          <div key={expense.id} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {expense.description}
                </p>
                <p className="text-sm text-gray-500">{expense.categoryName || expense.categoryId}</p>
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
