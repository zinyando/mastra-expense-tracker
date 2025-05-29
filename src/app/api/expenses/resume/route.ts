import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";

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
  try {
    const body = await request.json();

    const { runId, stepId, resumeData } = body;

    if (!runId || !stepId || !resumeData) {
      return NextResponse.json(
        { error: "runId, stepId, and resumeData are required" },
        { status: 400 }
      );
    }

    const workflow = mastra.getWorkflow("expenseWorkflow");

    const run = await workflow.createRun({ runId });

    if (!run) {
      return NextResponse.json(
        { error: "Workflow run not found" },
        { status: 404 }
      );
    }

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

    return NextResponse.json(
      { error: `Unexpected workflow status: ${resumeResult.status}` },
      { status: 400 }
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
  }
};
