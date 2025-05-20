import { NextRequest, NextResponse } from "next/server";
import expenseWorkflow from "@/mastra/workflows/expense-workflow";
import { pool } from "@/lib/db";
import crypto from 'crypto';

type ExpenseResult = {
  id: string;
  amount: number;
  description: string;
  category?: {
    id: string;
    name: string;
  };
  paymentMethod?: {
    id: string;
    name: string;
  };
  date: string;
  merchant: string;
  currency: string;
};

type WorkflowStepOutput = {
  date: string;
  merchant: string;
  amount: number;
  currency: string;
  category: string;
  items?: Array<{
    description: string;
    total: number;
    quantity?: number;
    unitPrice?: number;
  }>;
};

type WorkflowStepBase<T> = {
  status: 'completed' | 'failed' | 'suspended';
  output?: T;
  error?: string;
};

type ExtractExpenseStep = WorkflowStepBase<WorkflowStepOutput>;

type WorkflowResult = {
  status: 'suspended' | 'failed';
  steps: {
    'extract-expense-data': ExtractExpenseStep;
  };
  error?: string;
  suspendedData?: unknown;
};

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }
    
    console.log("Processing expense from image URL:", imageUrl);

    // Start the expense workflow
    const run = expenseWorkflow.createRun();
    const rawResult = await run.start({ inputData: { imageUrl } });
    const workflowResult = rawResult as unknown as WorkflowResult;

    // Extract data from the workflow result
    const stepResult = workflowResult.steps['extract-expense-data'];
    
    if (workflowResult.status === 'suspended' && stepResult.status === 'completed' && stepResult.output) {
      const expenseData: ExpenseResult = {
        id: crypto.randomUUID(),
        amount: stepResult.output.amount,
        description: stepResult.output.items?.[0]?.description || 'Unknown',
        category: stepResult.output.category ? {
          id: crypto.randomUUID(),
          name: stepResult.output.category
        } : undefined,
        date: stepResult.output.date,
        merchant: stepResult.output.merchant,
        currency: stepResult.output.currency || 'USD'
      };

      try {
        await client.query('BEGIN');

        // Verify category exists if provided
        if (expenseData.category?.id) {
          const { rows: categoryRows } = await client.query(
            'SELECT id FROM expense_categories WHERE id = $1',
            [expenseData.category.id]
          );

          if (categoryRows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json(
              { error: "Category not found" },
              { status: 404 }
            );
          }
        }

        // Verify payment method exists if provided
        if (expenseData.paymentMethod?.id) {
          const { rows: methodRows } = await client.query(
            'SELECT id FROM expense_payment_methods WHERE id = $1',
            [expenseData.paymentMethod.id]
          );

          if (methodRows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json(
              { error: "Payment method not found" },
              { status: 404 }
            );
          }
        }

        // Insert the expense
        const { rows: [newExpense] } = await client.query(`
          INSERT INTO expenses (
            id,
            amount,
            description,
            category_id,
            payment_method_id,
            date,
            merchant,
            currency,
            receipt_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `, [
          crypto.randomUUID(),
          expenseData.amount,
          expenseData.description,
          expenseData.category?.id,
          expenseData.paymentMethod?.id,
          expenseData.date,
          expenseData.merchant,
          expenseData.currency,
          imageUrl
        ]);

        await client.query('COMMIT');

        return NextResponse.json({
          success: true,
          expense: {
            id: newExpense.id,
            amount: parseFloat(newExpense.amount),
            description: newExpense.description,
            categoryId: newExpense.category_id,
            paymentMethodId: newExpense.payment_method_id,
            date: newExpense.date.toISOString().split('T')[0],
            merchant: newExpense.merchant,
            currency: newExpense.currency,
            receiptUrl: newExpense.receipt_url
          }
        });
      } catch (dbError) {
        await client.query('ROLLBACK');
        console.error("Database error:", dbError);
        return NextResponse.json(
          { error: `Failed to save expense to database: ${dbError instanceof Error ? dbError.message : 'Unknown error'}` },
          { status: 500 }
        );
      }
      // Return success response with expense data
      return NextResponse.json({
        status: "success",
        expense: expenseData,
        message: "Expense processed successfully",
      });
    }

    // If we reach here, it means the workflow failed
    console.error("Workflow error:", workflowResult);
    return NextResponse.json(
      { error: workflowResult.error || "Failed to process expense" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error processing expense:", error);
    
    // Extract more detailed error information
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Provide more helpful error response
    return NextResponse.json(
      { 
        error: "Error processing expense", 
        details: errorMessage,
        // Only include stack in development
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined 
      },
      { status: 500 }
    );
  }
}
