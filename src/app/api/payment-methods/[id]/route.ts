import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { rows: [row] } = await pool.query(
      "SELECT * FROM expense_payment_methods WHERE id = $1",
      [id]
    );

    if (!row) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    const paymentMethod = {
      id: row.id,
      name: row.name,
      type: row.type,
      lastFourDigits: row.last_four_digits || undefined,
      isDefault: row.is_default
    };

    return NextResponse.json(paymentMethod);
  } catch (error) {
    console.error("Error fetching payment method:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment method" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // If setting as default, update other payment methods first
    if (data.isDefault) {
      await pool.query(
        "UPDATE expense_payment_methods SET is_default = false WHERE is_default = true"
      );
    }

    // Build the update query based on provided fields
    const updates: string[] = [];
    const values: (string | boolean | null)[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(data.name);
      paramIndex++;
    }
    if (data.type !== undefined) {
      updates.push(`type = $${paramIndex}`);
      values.push(data.type);
      paramIndex++;
    }
    if (data.lastFourDigits !== undefined) {
      updates.push(`last_four_digits = $${paramIndex}`);
      values.push(data.lastFourDigits);
      paramIndex++;
    }
    if (data.isDefault !== undefined) {
      updates.push(`is_default = $${paramIndex}`);
      values.push(data.isDefault);
      paramIndex++;
    }

    values.push(id); // Add id as the last parameter

    const {
      rows: [paymentMethod],
    } = await pool.query(
      `UPDATE expense_payment_methods 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(paymentMethod);
  } catch (error) {
    console.error("Error updating payment method:", error);
    return NextResponse.json(
      { error: "Failed to update payment method" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const {
      rows: [paymentMethod],
    } = await pool.query(
      "SELECT * FROM expense_payment_methods WHERE id = $1",
      [id]
    );

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    if (paymentMethod.is_default) {
      await pool.query(
        "UPDATE expense_payment_methods SET is_default = false WHERE is_default = true"
      );
      return NextResponse.json(
        { error: "Cannot delete default payment method" },
        { status: 400 }
      );
    }

    await pool.query("DELETE FROM expense_payment_methods WHERE id = $1", [
      id,
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return NextResponse.json(
      { error: "Failed to delete payment method" },
      { status: 500 }
    );
  }
}
