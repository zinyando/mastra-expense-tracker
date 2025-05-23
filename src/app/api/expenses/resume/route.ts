import { NextRequest, NextResponse } from "next/server";
import expenseWorkflow from "@/mastra/workflows/expense-workflow";
import { pool } from "@/lib/db";
import crypto from "crypto";

// This is similar to the type in create/route.ts
// In a real application, these types would be shared
type WorkflowStepOutput = {
  date: string;
  merchant: string;
  amount: number;
  currency: string;
  category: string;
  categoryId: string;
  items?: Array<{
    description: string;
    total: number;
    quantity?: number;
    unitPrice?: number;
  }>;
  tax?: number;
  tip?: number;
  notes?: string;
  imageUrl: string;
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
  suspended?: string[][];
};

export const dynamic = "force-dynamic";

export const POST = async (request: NextRequest) => {
  const client = await pool.connect();
  try {
    const body = await request.json();
    console.log("Resume endpoint received:", body);

    const { workflowId, stepId, resumeData } = body;

    if (!workflowId || !stepId || !resumeData) {
      console.log("Missing required fields:", {
        hasWorkflowId: !!workflowId,
        hasStepId: !!stepId,
        hasResumeData: !!resumeData,
      });
      return NextResponse.json(
        { error: "workflowId, stepId, and resumeData are required" },
        { status: 400 }
      );
    }

    if (!workflowId || !stepId || !resumeData) {
      return NextResponse.json(
        { error: "workflowId, stepId, and resumeData are required" },
        { status: 400 }
      );
    }

    // Resume the workflow
    const run = expenseWorkflow.createRun({ runId: workflowId });
    const result = await run.start({
      inputData: { imageUrl: resumeData.imageUrl },
    });

    let rawResult;
    if (result.status === "suspended") {
      rawResult = await run.resume({
        step: stepId,
        resumeData: {
          ...resumeData,
        },
      });
    }

    const workflowResult = rawResult as unknown as WorkflowResult;

    // If still suspended, return the suspended state
    if (workflowResult.status === "suspended") {
      return NextResponse.json({
        status: "suspended",
        suspendedData: workflowResult.suspendedData,
        suspendedSteps: workflowResult.suspended,
        message: "Workflow still suspended, waiting for more input",
        fallback: false,
      });
    }

    // If workflow failed, return the error
    if (workflowResult.status === "failed") {
      return NextResponse.json(
        { error: workflowResult.error || "Failed to process expense" },
        { status: 500 }
      );
    }

    // For successful workflows, use the final result
    const expenseOutput = workflowResult.result;

    if (expenseOutput) {
      const expenseData = {
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
        notes: expenseOutput.notes,
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
            null, // payment_method_id will be set later if needed
            expenseData.date,
            expenseData.merchant,
            expenseData.currency,
            null, // receipt_url - this would come from the original request
            expenseOutput.items ? JSON.stringify(expenseOutput.items) : null,
            expenseOutput.tax ?? 0,
            expenseOutput.tip ?? 0,
            expenseData.notes || null,
          ]
        );

        await client.query("COMMIT");

        let categoryName = null;
        if (newExpense.category_id) {
          const { rows: catRows } = await client.query(
            "SELECT name FROM expense_categories WHERE id = $1",
            [newExpense.category_id]
          );
          if (catRows.length > 0) categoryName = catRows[0].name;
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
            items: newExpense.items || undefined,
            tax: newExpense.tax ? parseFloat(newExpense.tax) : undefined,
            tip: newExpense.tip ? parseFloat(newExpense.tip) : undefined,
            notes: newExpense.notes || undefined,
            categoryName: categoryName,
            paymentMethodName: null,
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
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
};
