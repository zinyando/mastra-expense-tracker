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
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading dashboard data...</div>
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
