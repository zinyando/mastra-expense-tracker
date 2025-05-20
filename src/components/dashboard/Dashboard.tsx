'use client';

import { useEffect, useState } from 'react';
import {
  BanknotesIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import StatCard from '@/components/dashboard/StatCard';
import ExpenseChart from '@/components/dashboard/ExpenseChart';
import RecentExpenses from '@/components/dashboard/RecentExpenses';
import { DashboardStats, getDashboardStats } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-lg bg-white px-6 py-8 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <Skeleton className="h-5 w-24" />
                <div className="mt-2">
                  <Skeleton className="h-8 w-32" />
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white px-6 py-8 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <Skeleton className="h-5 w-24" />
                <div className="mt-2">
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Recent Expenses */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Expense Chart */}
          <div className="rounded-lg bg-white p-6 shadow">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="aspect-[4/3]">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="rounded-lg bg-white p-6 shadow">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24 mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
        <div className="mt-2 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(stats.totalExpenses);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <StatCard
          title="Total Expenses"
          value={formattedTotal}
          icon={BanknotesIcon}
          trend={{
            value: stats.monthlyTrends.trend,
            isPositive: stats.monthlyTrends.trend > 0,
          }}
        />
        <StatCard
          title="Active Categories"
          value={stats.activeCategories.toString()}
          icon={FolderIcon}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ExpenseChart data={stats.expensesByCategory} />
        <RecentExpenses expenses={stats.recentExpenses} />
      </div>
    </div>
  );
}
