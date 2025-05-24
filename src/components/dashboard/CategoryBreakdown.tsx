"use client";

import { useMemo } from "react";

interface CategoryBreakdownProps {
  data: Array<{
    categoryId: string;
    categoryName: string;
    total: number;
  }>;
}

export default function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  // Sort data by total amount (descending)
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data].sort((a, b) => b.total - a.total);
  }, [data]);

  // Calculate total for percentage
  const totalAmount = useMemo(() => {
    return sortedData.reduce((sum, item) => sum + item.total, 0);
  }, [sortedData]);
  
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg bg-white shadow">
        <div className="p-5 text-center text-gray-500 text-sm">
          No category data available.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-indigo-50">
            <tr>
              <th
                scope="col"
                className="px-5 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-5 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                scope="col"
                className="px-5 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
              >
                Percentage
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((category) => {
              const percentage = (category.total / totalAmount) * 100;
              return (
                <tr key={category.categoryId}>
                  <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {category.categoryName || "Uncategorized"}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(category.total)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className="mr-2">{percentage.toFixed(1)}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr className="bg-indigo-50 border-t-2 border-indigo-100">
              <td className="px-5 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                Total
              </td>
              <td className="px-5 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(totalAmount)}
              </td>
              <td className="px-5 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                100%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
