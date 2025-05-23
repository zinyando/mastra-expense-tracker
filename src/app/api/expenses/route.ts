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
      ORDER BY e.created_at DESC
    `);

    const expenses = rows.map((row) => ({
      id: row.id,
      amount: parseFloat(row.amount),
      description: row.description,
      categoryId: row.category_id,
      categoryName: row.category_name,
      paymentMethodId: row.payment_method_id,
      paymentMethodName: row.payment_method_name,
      date: new Date(row.date).toISOString().split("T")[0],
      merchant: row.merchant,
      currency: row.currency,
      items: row.items || undefined,
      tax: row.tax ? parseFloat(row.tax) : undefined,
      tip: row.tip ? parseFloat(row.tip) : undefined,
      notes: row.notes || undefined,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    }));

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      {
        error: `Failed to fetch expenses: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
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
    const {
      amount,
      description,
      categoryId,
      paymentMethodId,
      date,
      merchant,
      currency = "USD",
      items,
      tax,
      tip,
      notes,
    } = body;

    // Validate required fields
    if (!amount || !description || !categoryId || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    // Verify category exists
    const { rows: categoryRows } = await client.query(
      "SELECT id FROM expense_categories WHERE id = $1",
      [categoryId]
    );

    if (categoryRows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Verify payment method exists if provided
    if (paymentMethodId) {
      const { rows: methodRows } = await client.query(
        "SELECT id FROM expense_payment_methods WHERE id = $1",
        [paymentMethodId]
      );

      if (methodRows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Payment method not found" },
          { status: 404 }
        );
      }
    }

    // Insert the expense
    const {
      rows: [insertedExpenseData],
    } = await client.query(
      `
      INSERT INTO expenses (
        id, amount, description, category_id, payment_method_id, date, merchant, currency, items, tax, tip, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12)
      RETURNING id, amount, description, category_id, payment_method_id, date, merchant, currency, items, tax, tip, notes, created_at, updated_at
    `,
      [
        crypto.randomUUID(),
        amount,
        description,
        categoryId,
        paymentMethodId,
        date,
        merchant,
        currency,
        items ? JSON.stringify(items) : null,
        tax || null,
        tip || null,
        notes || null,
      ]
    );

    let categoryName = null;
    if (insertedExpenseData.category_id) {
      const { rows: catRows } = await client.query(
        "SELECT name FROM expense_categories WHERE id = $1",
        [insertedExpenseData.category_id]
      );
      if (catRows.length > 0) categoryName = catRows[0].name;
    }

    let paymentMethodName = null;
    if (insertedExpenseData.payment_method_id) {
      const { rows: pmRows } = await client.query(
        "SELECT name FROM expense_payment_methods WHERE id = $1",
        [insertedExpenseData.payment_method_id]
      );
      if (pmRows.length > 0) paymentMethodName = pmRows[0].name;
    }

    await client.query("COMMIT");

    return NextResponse.json(
      {
        id: insertedExpenseData.id,
        amount: parseFloat(insertedExpenseData.amount),
        description: insertedExpenseData.description,
        categoryId: insertedExpenseData.category_id,
        categoryName: categoryName,
        paymentMethodId: insertedExpenseData.payment_method_id,
        paymentMethodName: paymentMethodName,
        date: new Date(insertedExpenseData.date).toISOString().split("T")[0],
        merchant: insertedExpenseData.merchant,
        currency: insertedExpenseData.currency,
        items: insertedExpenseData.items || undefined,
        tax: insertedExpenseData.tax
          ? parseFloat(insertedExpenseData.tax)
          : undefined,
        tip: insertedExpenseData.tip
          ? parseFloat(insertedExpenseData.tip)
          : undefined,
        notes: insertedExpenseData.notes || undefined,
        createdAt: new Date(insertedExpenseData.created_at).toISOString(),
        updatedAt: new Date(insertedExpenseData.updated_at).toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating expense:", error);
    return NextResponse.json(
      {
        error: `Failed to create expense: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
