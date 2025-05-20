import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get total expenses
    const { rows: [totalRow] } = await client.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses'
    );

    // Get active categories count
    const { rows: [categoriesRow] } = await client.query(
      'SELECT COUNT(DISTINCT id) as count FROM expense_categories'
    );

    // Get expenses by category
    const { rows: expensesByCategory } = await client.query(`
      SELECT
        c.id as category_id,
        c.name as category_name,
        COALESCE(SUM(e.amount), 0) as total
      FROM expense_categories c
      LEFT JOIN expenses e ON e.category_id = c.id
      GROUP BY c.id, c.name
      ORDER BY total DESC
    `);

    // Get recent expenses
    const { rows: recentExpenses } = await client.query(`
      SELECT
        e.id,
        e.amount,
        e.description,
        e.category_id,
        e.date,
        c.name as category_name,
        pm.name as payment_method_name
      FROM expenses e
      LEFT JOIN expense_categories c ON c.id = e.category_id
      LEFT JOIN expense_payment_methods pm ON pm.id = e.payment_method_id
      ORDER BY e.date DESC
      LIMIT 5
    `);

    // Get monthly trends
    const { rows: [trends] } = await client.query(`
      WITH monthly_totals AS (
        SELECT
          date_trunc('month', date) as month,
          SUM(amount) as total
        FROM expenses
        WHERE date >= date_trunc('month', current_date - interval '1 month')
        GROUP BY date_trunc('month', date)
      )
      SELECT
        COALESCE((SELECT total FROM monthly_totals WHERE month = date_trunc('month', current_date)), 0) as current_month,
        COALESCE((SELECT total FROM monthly_totals WHERE month = date_trunc('month', current_date - interval '1 month')), 0) as previous_month
    `);

    // Calculate trend percentage
    const trend = trends.previous_month !== 0
      ? ((trends.current_month - trends.previous_month) / trends.previous_month) * 100
      : 0;

    await client.query('COMMIT');

    const stats = {
      totalExpenses: parseFloat(totalRow.total),
      activeCategories: parseInt(categoriesRow.count),
      expensesByCategory: expensesByCategory.map(cat => ({
        categoryId: cat.category_id,
        categoryName: cat.category_name,
        total: parseFloat(cat.total)
      })),
      recentExpenses: recentExpenses.map(exp => ({
        id: exp.id,
        amount: parseFloat(exp.amount),
        description: exp.description,
        categoryId: exp.category_id,
        categoryName: exp.category_name,
        paymentMethodName: exp.payment_method_name,
        date: exp.date.toISOString().split('T')[0]
      })),
      monthlyTrends: {
        currentMonth: parseFloat(trends.current_month),
        previousMonth: parseFloat(trends.previous_month),
        trend: Math.round(trend * 10) / 10 // Round to 1 decimal place
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    await client.query('ROLLBACK');
    return NextResponse.json(
      { error: `Failed to fetch statistics: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
