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
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="w-full rounded-lg bg-white p-5 shadow">
        <div className="h-[250px] flex items-center justify-center">
          <p className="text-sm text-gray-500 text-center">
            No category data available.
          </p>
        </div>
      </div>
    );
  }
  
  // Check if all values are zero
  const hasNonZeroValues = data.some(item => item.total > 0);
  if (!hasNonZeroValues) {
    return (
      <div className="w-full rounded-lg bg-white p-5 shadow">
        <div className="h-[250px] flex items-center justify-center">
          <p className="text-sm text-gray-500 text-center">
            All categories currently have zero expenses.
          </p>
        </div>
      </div>
    );
  }

  // Sort data by total amount (descending)
  const sortedData = [...data].sort((a, b) => b.total - a.total);
  
  // Filter out zero values for better visualization
  const nonZeroCategories = sortedData.filter(item => item.total > 0);
  
  // If we have more than 5 non-zero categories, limit to top 5
  // Otherwise use all non-zero categories
  const categoriesToShow = nonZeroCategories.length > 5 
    ? nonZeroCategories.slice(0, 5) 
    : nonZeroCategories;
  
  const chartData = categoriesToShow.map(item => ({
    name: item.categoryName || 'Uncategorized',
    amount: item.total,
  }));

  // Calculate total for percentage (using all data, not just displayed categories)
  const totalAmount = sortedData.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="w-full rounded-lg bg-white p-5 shadow">
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 20,
              left: 0,
              bottom: 5,
            }}
            barSize={30}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" scale="point" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              domain={[0, 'dataMax']} 
              tickCount={5}
            />
            <Tooltip
              formatter={(value: number) => {
                const percentage = ((value / totalAmount) * 100).toFixed(1);
                return [
                  `${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(value)} (${percentage}%)`,
                  'Amount'
                ];
              }}
              cursor={{ fill: '#f9fafb' }}
            />
            <Bar
              dataKey="amount"
              fill="#818CF8"
              name="Amount"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
