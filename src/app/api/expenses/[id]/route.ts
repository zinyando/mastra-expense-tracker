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
        e.items,
        e.tax,
        e.tip,
        e.notes,
        e.created_at,
        e.updated_at,
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
      date: new Date(rows[0].date).toISOString().split('T')[0],
      merchant: rows[0].merchant,
      currency: rows[0].currency,
      items: rows[0].items || undefined,
      tax: rows[0].tax ? parseFloat(rows[0].tax) : undefined,
      tip: rows[0].tip ? parseFloat(rows[0].tip) : undefined,
      notes: rows[0].notes || undefined,
      createdAt: new Date(rows[0].created_at).toISOString(),
      updatedAt: new Date(rows[0].updated_at).toISOString()
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
    const { amount, description, categoryId, paymentMethodId, date, merchant, currency, items, tax, tip, notes } = await request.json();
    const updates = { amount, description, categoryId, paymentMethodId, date, merchant, currency, items, tax, tip, notes }; // Reconstruct for clarity if needed or use directly
    
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
        currency = $7,
        items = $8,
        tax = $9,
        tip = $10,
        notes = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING id, amount, description, category_id, payment_method_id, date, merchant, currency, items, tax, tip, notes, created_at, updated_at
    `, [
      updates.amount,
      updates.description,
      updates.categoryId,
      updates.paymentMethodId,
      updates.date,
      updates.merchant,
      updates.currency || 'USD',
      updates.items || null, // Assuming items are already in JSON format or your DB handles it
      updates.tax || null,
      updates.tip || null,
      updates.notes || null,
      id
    ]);

    let categoryName = null;
    if (updatedExpense.category_id) {
      const { rows: catRows } = await client.query('SELECT name FROM expense_categories WHERE id = $1', [updatedExpense.category_id]);
      if (catRows.length > 0) categoryName = catRows[0].name;
    }

    let paymentMethodName = null;
    if (updatedExpense.payment_method_id) {
      const { rows: pmRows } = await client.query('SELECT name FROM expense_payment_methods WHERE id = $1', [updatedExpense.payment_method_id]);
      if (pmRows.length > 0) paymentMethodName = pmRows[0].name;
    }

    await client.query('COMMIT');

    return NextResponse.json({
      id: updatedExpense.id,
      amount: parseFloat(updatedExpense.amount),
      description: updatedExpense.description,
      categoryId: updatedExpense.category_id,
      categoryName: categoryName,
      paymentMethodId: updatedExpense.payment_method_id,
      paymentMethodName: paymentMethodName,
      date: new Date(updatedExpense.date).toISOString().split('T')[0],
      merchant: updatedExpense.merchant,
      currency: updatedExpense.currency,
      items: updatedExpense.items || undefined,
      tax: updatedExpense.tax ? parseFloat(updatedExpense.tax) : undefined,
      tip: updatedExpense.tip ? parseFloat(updatedExpense.tip) : undefined,
      notes: updatedExpense.notes || undefined,
      createdAt: new Date(updatedExpense.created_at).toISOString(),
      updatedAt: new Date(updatedExpense.updated_at).toISOString(),
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
  const client = await pool.connect();
  try {
    const { id } = params;

    await client.query('BEGIN');

    const deleteResult = await client.query(
      'DELETE FROM expenses WHERE id = $1 RETURNING id',
      [id]
    );

    if (deleteResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await client.query('COMMIT');
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: `Failed to delete expense: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
