import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // TODO: Replace with actual database query
    const expenses = [
      {
        id: '1',
        amount: 150.00,
        description: 'Office Supplies',
        categoryId: '1',
        date: '2025-05-08',
      },
      // Add more sample data as needed
    ];

    return NextResponse.json({ expenses });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, description, categoryId, date } = body;

    // Validate required fields
    if (!amount || !description || !categoryId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual database insert
    const newExpense = {
      id: Date.now().toString(),
      amount,
      description,
      categoryId,
      date,
    };

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
