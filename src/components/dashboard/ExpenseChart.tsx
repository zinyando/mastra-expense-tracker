'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ExpenseChartProps {
  data: Array<{
    categoryId: string;
    categoryName: string;
    total: number;
  }>;
}

export default function ExpenseChart({ data }: ExpenseChartProps) {
  const chartData = data.map(item => ({
    name: item.categoryName,
    amount: item.total,
  }));

  return (
    <div className="h-[400px] w-full rounded-lg bg-white p-6 shadow">
      <h3 className="text-lg font-medium text-gray-900">Expenses by Category</h3>
      <div className="mt-6 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(value)
              }
            />
            <Bar
              dataKey="amount"
              fill="#818CF8"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
