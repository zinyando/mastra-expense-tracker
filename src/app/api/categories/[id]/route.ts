import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // TODO: Replace with actual database query
    const category = {
      id,
      name: 'Office Supplies',
      color: '#FF5733',
    };

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
    const { name, color } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual database update
    const updatedCategory = {
      id,
      name,
      color: color || '#000000',
    };

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
  try {
    const { id } = params;

    // TODO: Replace with actual database delete
    console.log(`Deleting category with id: ${id}`);
    // Return success response
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
