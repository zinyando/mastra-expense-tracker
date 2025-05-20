import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT
        e.id,
        e.amount,
        e.description,
        e.category_id,
        e.payment_method_id,
        e.date,
        e.merchant,
        e.currency,
        c.name as category_name,
        pm.name as payment_method_name
      FROM expenses e
      LEFT JOIN expense_categories c ON c.id = e.category_id
      LEFT JOIN expense_payment_methods pm ON pm.id = e.payment_method_id
      ORDER BY e.date DESC
    `);

    const expenses = rows.map(row => ({
      id: row.id,
      amount: parseFloat(row.amount),
      description: row.description,
      categoryId: row.category_id,
      categoryName: row.category_name,
      paymentMethodId: row.payment_method_id,
      paymentMethodName: row.payment_method_name,
      date: row.date.toISOString().split('T')[0],
      merchant: row.merchant,
      currency: row.currency
    }));

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: `Failed to fetch expenses: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { amount, description, categoryId, paymentMethodId, date, merchant, currency = 'USD' } = body;

    // Validate required fields
    if (!amount || !description || !categoryId || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // Verify category exists
    const { rows: categoryRows } = await client.query(
      'SELECT id FROM expense_categories WHERE id = $1',
      [categoryId]
    );

    if (categoryRows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Verify payment method exists if provided
    if (paymentMethodId) {
      const { rows: methodRows } = await client.query(
        'SELECT id FROM expense_payment_methods WHERE id = $1',
        [paymentMethodId]
      );

      if (methodRows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: "Payment method not found" },
          { status: 404 }
        );
      }
    }

    // Insert the expense
    const { rows: [newExpense] } = await client.query(`
      INSERT INTO expenses (
        id,
        amount,
        description,
        category_id,
        payment_method_id,
        date,
        merchant,
        currency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      crypto.randomUUID(),
      amount,
      description,
      categoryId,
      paymentMethodId,
      date,
      merchant,
      currency
    ]);

    await client.query('COMMIT');

    return NextResponse.json({
      id: newExpense.id,
      amount: parseFloat(newExpense.amount),
      description: newExpense.description,
      categoryId: newExpense.category_id,
      paymentMethodId: newExpense.payment_method_id,
      date: newExpense.date.toISOString().split('T')[0],
      merchant: newExpense.merchant,
      currency: newExpense.currency
    }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: `Failed to create expense: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
