import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(
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

    return NextResponse.json(paymentMethod);
  } catch (error) {
    console.error("Error fetching payment method:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment method" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const {
      rows: [paymentMethod],
    } = await pool.query(
      `UPDATE expense_payment_methods 
       SET name = $1, type = $2, last_four_digits = $3, is_default = $4
       WHERE id = $5
       RETURNING *`,
      [data.name, data.type, data.lastFourDigits, data.isDefault, id]
    );

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
