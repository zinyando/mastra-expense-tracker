import { NextRequest, NextResponse } from "next/server";
import expenseWorkflow from "@/mastra/workflows/expense-workflow";
import { pool } from "@/lib/db";

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
  status: "success" | "completed" | "failed" | "suspended";
  output?: T;
  error?: string | Error | undefined;
};

type ExtractExpenseStep = WorkflowStepBase<WorkflowStepOutput>;

type WorkflowResult = {
  status: "success" | "suspended" | "failed";
  steps: {
    "extract-expense-data": ExtractExpenseStep;
    "categorize-expense": ExtractExpenseStep;
    "save-expense": ExtractExpenseStep;
  };
  error?: string | Error | undefined;
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

    const run = expenseWorkflow.createRun();
    const result: WorkflowResult = await run.start({
      inputData: { imageUrl: resumeData.imageUrl },
    });

    if (result.status === "suspended") {
      const resumeResult: WorkflowResult = await run.resume({
        step: stepId,
        resumeData,
      });

      if (resumeResult.status === "failed") {
        return NextResponse.json(
          { error: "Failed to process expense" },
          { status: 500 }
        );
      }

      if (resumeResult.status === "success") {
        return NextResponse.json({
          success: true,
          expense: resumeResult.result,
        });
      }
    }

    if (result.status === "success") {
      return NextResponse.json({
        success: true,
        expense: result.result,
      });
    }

    return NextResponse.json(
      { error: "Failed to process expense" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error processing expense:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

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
