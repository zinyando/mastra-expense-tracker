import { NextRequest, NextResponse } from "next/server";
import expenseWorkflow from "@/mastra/workflows/expense-workflow";
import { pool } from "@/lib/db";
import crypto from "crypto";

// This local ExpenseResult type is an intermediate representation.
// The final response aims to match the global Expense type.
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
  tax: number;
  tip: number;
  notes?: string; // Added notes
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
  tax?: number;
  tip?: number;
  notes?: string; // Added notes to workflow output type if it can provide it
};

type WorkflowStepBase<T> = {
  status: "completed" | "failed" | "suspended";
  output?: T;
  error?: string;
};

type ExtractExpenseStep = WorkflowStepBase<WorkflowStepOutput>;

type WorkflowResult = {
  status: "success" | "suspended" | "failed";
  steps: {
    "extract-expense-data": ExtractExpenseStep;
    "categorize-expense": ExtractExpenseStep;
    "save-expense": ExtractExpenseStep;
  };
  error?: string;
  suspendedData?: unknown;
  result?: WorkflowStepOutput;
};

export const dynamic = "force-dynamic";

export const POST = async (request: NextRequest) => {
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
    // For successful workflows, use the final result
    const expenseOutput =
      workflowResult.status === "success"
        ? workflowResult.result
        : workflowResult.steps["extract-expense-data"].output;

    if (expenseOutput) {
      const expenseData: ExpenseResult = {
        id: crypto.randomUUID(),
        amount: expenseOutput.amount,
        description: expenseOutput.items?.[0]?.description || "Unknown",
        category: expenseOutput.category
          ? {
              id: crypto.randomUUID(),
              name: expenseOutput.category,
            }
          : undefined,
        date: expenseOutput.date,
        merchant: expenseOutput.merchant,
        currency: expenseOutput.currency || "USD",
        tax: expenseOutput.tax ?? 0,
        tip: expenseOutput.tip ?? 0,
        notes: expenseOutput.notes // Assuming workflow might provide notes
      };

      try {
        await client.query("BEGIN");

        // Create category if it doesn't exist
        let categoryId = null;
        if (expenseData.category?.name) {
          const { rows: existingCategory } = await client.query(
            "SELECT id FROM expense_categories WHERE name = $1",
            [expenseData.category.name]
          );

          if (existingCategory.length > 0) {
            categoryId = existingCategory[0].id;
          } else {
            const {
              rows: [newCategory],
            } = await client.query(
              "INSERT INTO expense_categories (id, name) VALUES ($1, $2) RETURNING id",
              [expenseData.category.id, expenseData.category.name]
            );
            categoryId = newCategory.id;
          }
        }

        // Verify payment method exists if provided
        if (expenseData.paymentMethod?.id) {
          const { rows: methodRows } = await client.query(
            "SELECT id FROM expense_payment_methods WHERE id = $1",
            [expenseData.paymentMethod.id]
          );

          if (methodRows.length === 0) {
            await client.query("ROLLBACK");
            return NextResponse.json(
              { error: "Payment method not found" },
              { status: 404 }
            );
          }
        }

        // Insert the expense
        const {
          rows: [newExpense],
        } = await client.query(
          `
          INSERT INTO expenses (
            id,
            amount,
            description,
            category_id,
            payment_method_id,
            date,
            merchant,
            currency,
            receipt_url,
            items,
            tax,
            tip,
            notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *
        `,
          [
            crypto.randomUUID(),
            expenseData.amount,
            expenseData.description,
            categoryId,
            expenseData.paymentMethod?.id,
            expenseData.date,
            expenseData.merchant,
            expenseData.currency,
            imageUrl,
            expenseOutput.items ? JSON.stringify(expenseOutput.items) : null,
            expenseOutput.tax ?? 0,
            expenseOutput.tip ?? 0,
            expenseData.notes || null,
          ]
        );

        await client.query("COMMIT");

        let categoryName = null;
        if (newExpense.category_id) {
          const { rows: catRows } = await client.query('SELECT name FROM expense_categories WHERE id = $1', [newExpense.category_id]);
          if (catRows.length > 0) categoryName = catRows[0].name;
        }

        let paymentMethodName = null;
        // Note: paymentMethod is not strongly typed in expenseData for name, so we only use ID here.
        // If paymentMethod name is needed, workflow/expenseData needs to ensure it's available or fetched.
        if (newExpense.payment_method_id) {
          const { rows: pmRows } = await client.query('SELECT name FROM expense_payment_methods WHERE id = $1', [newExpense.payment_method_id]);
          if (pmRows.length > 0) paymentMethodName = pmRows[0].name;
        }

        return NextResponse.json({
          success: true,
          expense: {
            id: newExpense.id,
            amount: parseFloat(newExpense.amount),
            description: newExpense.description,
            categoryId: newExpense.category_id,
            paymentMethodId: newExpense.payment_method_id,
            date: newExpense.date.toISOString().split("T")[0],
            merchant: newExpense.merchant,
            currency: newExpense.currency,
            receiptUrl: newExpense.receipt_url,
            items: newExpense.items || undefined, // Ensure it's undefined if null/empty
            tax: newExpense.tax ? parseFloat(newExpense.tax) : undefined,
            tip: newExpense.tip ? parseFloat(newExpense.tip) : undefined,
            notes: newExpense.notes || undefined,
            categoryName: categoryName,
            paymentMethodName: paymentMethodName,
            createdAt: new Date(newExpense.created_at).toISOString(),
            updatedAt: new Date(newExpense.updated_at).toISOString(),
          },
        });
      } catch (dbError) {
        await client.query("ROLLBACK");
        console.error("Database error:", dbError);
        return NextResponse.json(
          {
            error: `Failed to save expense to database: ${dbError instanceof Error ? dbError.message : "Unknown error"}`,
          },
          { status: 500 }
        );
      }
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
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
};
