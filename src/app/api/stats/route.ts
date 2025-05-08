import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // TODO: Replace with actual database queries
    const stats = {
      totalExpenses: 12345.67,
      activeCategories: 12,
      expensesByCategory: [
        { categoryId: '1', categoryName: 'Office Supplies', total: 5000.00 },
        { categoryId: '2', categoryName: 'Travel', total: 3500.00 },
        // Add more sample data as needed
      ],
      recentExpenses: [
        {
          id: '1',
          amount: 150.00,
          description: 'Office Supplies',
          categoryId: '1',
          date: '2025-05-08',
        },
        // Add more sample data as needed
      ],
      monthlyTrends: {
        currentMonth: 12345.67,
        previousMonth: 11000.00,
        trend: -12, // percentage change
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch statistics: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
