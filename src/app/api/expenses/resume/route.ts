import { NextRequest, NextResponse } from "next/server";
import expenseWorkflow from "@/mastra/workflows/expense-workflow";
import { pool } from "@/lib/db";

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

    const { workflowId, stepId, resumeData } = body;

    if (!workflowId || !stepId || !resumeData) {
      return NextResponse.json(
        { error: "workflowId, stepId, and resumeData are required" },
        { status: 400 }
      );
    }

    // Resume the workflow from where it was suspended
    const run = expenseWorkflow.createRun({ runId: workflowId });
    const rawResult = await run.resume({
      step: stepId,
      resumeData: {
        ...resumeData,
      },
    });

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

    // For successful workflows, return the result
    if (workflowResult.result) {
      return NextResponse.json({
        success: true,
        expense: workflowResult.result
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
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
};
