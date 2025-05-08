import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // TODO: Replace with actual database query
    const categories = [
      {
        id: '1',
        name: 'Office Supplies',
        color: '#FF5733',
      },
      // Add more sample data as needed
    ];

    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch categories: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, color } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual database insert
    const newCategory = {
      id: Date.now().toString(),
      name,
      color: color || '#000000',
    };

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
