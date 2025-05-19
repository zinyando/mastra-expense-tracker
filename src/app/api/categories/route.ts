import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // TODO: Replace with actual database query
    const categories = [
      {
        id: '1',
        name: 'Meals',
        color: '#FF5733', // Orange-red
      },
      {
        id: '2',
        name: 'Travel',
        color: '#4CAF50', // Green
      },
      {
        id: '3',
        name: 'Office Supplies',
        color: '#2196F3', // Blue
      },
      {
        id: '4',
        name: 'Entertainment',
        color: '#9C27B0', // Purple
      },
      {
        id: '5',
        name: 'Transportation',
        color: '#FFC107', // Amber
      },
      {
        id: '6',
        name: 'Utilities',
        color: '#607D8B', // Blue-grey
      },
      {
        id: '7',
        name: 'Healthcare',
        color: '#E91E63', // Pink
      },
      {
        id: '8',
        name: 'Other',
        color: '#795548', // Brown
      },
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
