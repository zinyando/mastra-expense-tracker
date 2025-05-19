import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // TODO: Replace with actual database query
    const expense = {
      id,
      amount: 150.0,
      description: "Office Supplies",
      categoryId: "1",
      date: "2025-05-08",
    };

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch expense" },
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
    const expense = await request.json();
    
    // Validate required fields for the enhanced expense schema
    if (!expense.merchant || !expense.amount || !expense.date || !expense.category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update the timestamp
    const updatedExpense = {
      ...expense,
      id,  // Ensure we're using the URL param ID
      updatedAt: new Date().toISOString(),
    };

    // TODO: Replace with actual database update using Supabase
    // Example: 
    // const { error } = await supabase
    //   .from('expenses')
    //   .update(updatedExpense)
    //   .eq('id', id);
    
    // if (error) {
    //   throw new Error(`Database error: ${error.message}`);
    // }
    
    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
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

    console.log(`Deleting expense with id: ${id}`);

    // TODO: Replace with actual database delete
    // Return success response
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
