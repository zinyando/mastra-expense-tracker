import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";

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
  notes?: string;
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
    input: {
      imageUrl: string;
    };
    "extract-expense-data": ExtractExpenseStep;
    "categorize-expense": ExtractExpenseStep;
    "review-expense": {
      status: "suspended" | "completed";
      output?: WorkflowStepOutput;
      payload?: {
        currentData: WorkflowStepOutput;
      };
    };
    "save-expense": ExtractExpenseStep;
  };
  error?: string;
  result?: WorkflowStepOutput;
  suspended?: string[][];
};

export const dynamic = "force-dynamic";

export const POST = async (request: NextRequest) => {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    const run = mastra.getWorkflow("expenseWorkflow").createRun();

    const rawResult = await run.start({ inputData: { imageUrl } });
    const workflowResult = rawResult as unknown as WorkflowResult;
    if (workflowResult.status === "suspended") {
      const processedData = workflowResult.steps["categorize-expense"].output;

      if (!processedData) {
        throw new Error("No processed data available from categorize step");
      }

      return NextResponse.json({
        status: "suspended",
        suspendedData: {
          currentData: processedData,
        },
        suspendedSteps: workflowResult.suspended,
        message: "Workflow suspended, waiting for user input",
        fallback: false,
        runId: run.runId,
      });
    }

    console.error("Workflow error:", workflowResult);
    return NextResponse.json(
      { error: workflowResult.error || "Failed to process expense" },
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
  }
};
