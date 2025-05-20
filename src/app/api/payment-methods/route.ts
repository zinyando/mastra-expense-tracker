import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const { rows } = await pool.query('SELECT * FROM expense_payment_methods ORDER BY name');
    return NextResponse.json({ paymentMethods: rows });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const data = await request.json();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // If this is going to be the default payment method, unset any existing default
    if (data.isDefault) {
      await client.query(
        'UPDATE expense_payment_methods SET is_default = false WHERE is_default = true'
      );
    }

    // Insert the new payment method
    const { rows: [newPaymentMethod] } = await client.query(
      `INSERT INTO expense_payment_methods (id, name, type, last_four_digits, is_default)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [randomUUID(), data.name, data.type, data.lastFourDigits || null, data.isDefault || false]
    );

    await client.query('COMMIT');
    return NextResponse.json(newPaymentMethod);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating payment method:', error);
    return NextResponse.json(
      { error: 'Failed to create payment method' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function PUT(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  const data = await request.json();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if the payment method exists
    const { rows: [existingMethod] } = await client.query(
      'SELECT * FROM payment_methods WHERE id = $1',
      [id]
    );

    if (!existingMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // If this will be the default payment method, unset any existing default
    if (data.isDefault) {
      await client.query(
        'UPDATE expense_payment_methods SET is_default = false WHERE is_default = true'
      );
    }

    // Update the payment method
    const { rows: [updatedMethod] } = await client.query(
      `UPDATE payment_methods
       SET name = $1, type = $2, last_four_digits = $3, is_default = $4
       WHERE id = $5
       RETURNING *`,
      [data.name, data.type, data.lastFourDigits || null, data.isDefault || false, id]
    );

    await client.query('COMMIT');
    return NextResponse.json(updatedMethod);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if the payment method exists and if it's the default
    const { rows: [existingMethod] } = await client.query(
      'SELECT * FROM payment_methods WHERE id = $1',
      [id]
    );

    if (!existingMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    if (existingMethod.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete default payment method' },
        { status: 400 }
      );
    }

    // Delete the payment method
    await client.query(
      'DELETE FROM payment_methods WHERE id = $1',
      [id]
    );

    await client.query('COMMIT');
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
