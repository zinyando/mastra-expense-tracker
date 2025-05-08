import {
  BanknotesIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import StatCard from '@/components/dashboard/StatCard';
import ExpenseChart from '@/components/dashboard/ExpenseChart';
import RecentExpenses from '@/components/dashboard/RecentExpenses';

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <StatCard
          title="Total Expenses"
          value="$12,345.67"
          icon={BanknotesIcon}
          trend={{ value: 12, isPositive: false }}
        />
        <StatCard
          title="Active Categories"
          value="12"
          icon={FolderIcon}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ExpenseChart />
        <RecentExpenses />
      </div>
    </div>
  );
}
