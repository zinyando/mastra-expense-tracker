import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();
  try {
    const { id } = params;

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
      WHERE e.id = $1
    `, [id]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const expense = {
      id: rows[0].id,
      amount: parseFloat(rows[0].amount),
      description: rows[0].description,
      categoryId: rows[0].category_id,
      categoryName: rows[0].category_name,
      paymentMethodId: rows[0].payment_method_id,
      paymentMethodName: rows[0].payment_method_name,
      date: rows[0].date.toISOString().split('T')[0],
      merchant: rows[0].merchant,
      currency: rows[0].currency
    };

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json(
      { error: `Failed to fetch expense: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();
  try {
    const { id } = params;
    const updates = await request.json();
    
    // Validate required fields
    if (!updates.amount || !updates.description || !updates.categoryId || !updates.date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // Verify expense exists
    const { rows: existingRows } = await client.query(
      'SELECT id FROM expenses WHERE id = $1',
      [id]
    );

    if (existingRows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Verify category exists
    const { rows: categoryRows } = await client.query(
      'SELECT id FROM expense_categories WHERE id = $1',
      [updates.categoryId]
    );

    if (categoryRows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Verify payment method exists if provided
    if (updates.paymentMethodId) {
      const { rows: methodRows } = await client.query(
        'SELECT id FROM expense_payment_methods WHERE id = $1',
        [updates.paymentMethodId]
      );

      if (methodRows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: "Payment method not found" },
          { status: 404 }
        );
      }
    }

    // Update the expense
    const { rows: [updatedExpense] } = await client.query(`
      UPDATE expenses
      SET
        amount = $1,
        description = $2,
        category_id = $3,
        payment_method_id = $4,
        date = $5,
        merchant = $6,
        currency = $7
      WHERE id = $8
      RETURNING *
    `, [
      updates.amount,
      updates.description,
      updates.categoryId,
      updates.paymentMethodId,
      updates.date,
      updates.merchant,
      updates.currency || 'USD',
      id
    ]);

    await client.query('COMMIT');

    return NextResponse.json({
      id: updatedExpense.id,
      amount: parseFloat(updatedExpense.amount),
      description: updatedExpense.description,
      categoryId: updatedExpense.category_id,
      paymentMethodId: updatedExpense.payment_method_id,
      date: updatedExpense.date.toISOString().split('T')[0],
      merchant: updatedExpense.merchant,
      currency: updatedExpense.currency
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: `Failed to update expense: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log(`Deleting expense with id: ${id}`);

    // TODO: Replace with actual database delete
    // Return success response
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
