import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { rows: [category] } = await pool.query(
      'SELECT * FROM expense_categories WHERE id = $1',
      [params.id]
    );

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch category: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, color, description } = body;

    // Validate required fields
    if (!name || !color) {
      return NextResponse.json(
        { error: 'Name and color are required' },
        { status: 400 }
      );
    }

    const { rows: [category] } = await pool.query(
      'SELECT * FROM expense_categories WHERE id = $1',
      [id]
    );

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    const { rows: [updatedCategory] } = await pool.query(
      `UPDATE expense_categories
       SET name = $1, color = $2, description = $3
       WHERE id = $4
       RETURNING *`,
      [name, color, description || null, id]
    );

    return NextResponse.json(updatedCategory);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to update category: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if the category exists
    const { rows: [category] } = await client.query(
      'SELECT * FROM expense_categories WHERE id = $1',
      [params.id]
    );

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if there are any expenses using this category
    const { rows: expenses } = await client.query(
      'SELECT id FROM expenses WHERE category_id = $1 LIMIT 1',
      [params.id]
    );

    if (expenses.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category: it is being used by expenses' },
        { status: 400 }
      );
    }

    // Delete the category
    await client.query(
      'DELETE FROM expense_categories WHERE id = $1',
      [params.id]
    );

    await client.query('COMMIT');
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    await client.query('ROLLBACK');
    return NextResponse.json(
      { error: `Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
