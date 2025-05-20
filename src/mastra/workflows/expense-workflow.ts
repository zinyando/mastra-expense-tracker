import { z } from "zod";
import { createWorkflow, createStep } from "@mastra/core/workflows/vNext";
import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";

// Helper function to fetch categories from API
async function fetchCategoriesFromAPI(): Promise<string[]> {
  // Make API call to fetch categories
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/categories`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }

  const data = await response.json();
  if (!data.categories?.length) {
    throw new Error("No categories found");
  }

  // Extract category names from the result
  return data.categories.map((cat: { name: string }) => cat.name);
}

// Define schemas
const expenseSchema = z.object({
  merchant: z.string().describe("The name of the merchant or store"),
  amount: z.number().positive().describe("The total amount of the expense"),
  currency: z.string().default("USD").describe("Currency code, e.g., USD, EUR"),
  date: z.string().describe("Date of the expense"),
  category: z.string().describe("Expense category"),
  items: z
    .array(
      z.object({
        description: z.string(),
        quantity: z.number().positive().optional(),
        unitPrice: z.number().positive().optional(),
        total: z.number().positive(),
      })
    )
    .optional(),
  tax: z.number().optional(),
  tip: z.number().optional(),
  notes: z.string().optional(),
});

// Step 1: Extract text from receipt image using GPT-4o Vision
const extractExpenseData = createStep({
  id: "extract-expense-data",
  description:
    "Extract structured expense data from receipt image using GPT-4o",
  inputSchema: z.object({
    imageUrl: z.string().url("Valid image URL is required"),
  }),
  outputSchema: expenseSchema,
  execute: async ({ inputData }) => {
    const { imageUrl } = inputData;

    const { object: expenseData } = await generateObject({
      model: openai.chat("gpt-4o"),
      schema: expenseSchema,
      messages: [
        {
          role: "system",
          content: `You are an image data extractor assistant. Extract all expense information from this receipt in JSON format. Include merchant, amount, currency, date, category, and line items if available.\n\nFor the date, extract it exactly as it appears on the receipt. For the amount, extract just the number (no currency symbols). Ensure all number fields are actual numbers, not strings. If there is no quantity or unit price, set them to 1. If there is no tax or tip, set them to 0. If there is no notes, set it to "".`,
        },
        {
          role: "user",
          content: [{ type: "image", image: imageUrl }],
        },
      ],
      temperature: 0.1,
    });

    // Format the date to ISO if needed
    const formattedData = { ...expenseData };

    // Try to convert date to ISO format if it's not already
    if (formattedData.date && !formattedData.date.includes("T")) {
      try {
        // Create a Date object from the string and convert to ISO
        const dateObj = new Date(formattedData.date);
        if (!isNaN(dateObj.getTime())) {
          formattedData.date = dateObj.toISOString();
        }
      } catch (error) {
        // If date parsing fails, keep the original string
        console.warn(
          "Could not convert date to ISO format:",
          formattedData.date,
          error
        );
      }
    }

    return expenseSchema.parse(formattedData);
  },
});

// Step 2: Categorize expense
const categorizeExpense = createStep({
  id: "categorize-expense",
  description: "Categorize the expense based on merchant and items",
  inputSchema: expenseSchema,
  outputSchema: expenseSchema,
  execute: async ({ inputData }) => {
    // Fetch categories from API instead of hardcoding them
    const categories = await fetchCategoriesFromAPI();

    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "system",
          content: `You are an expense categorization assistant. Categorize the following expense into one of these categories: ${categories.join(", ")}. Return only the category name.`,
        },
        {
          role: "user",
          content: `Merchant: ${inputData.merchant}, Items: ${inputData.items?.map((i) => i.description).join(", ") || "N/A"}`,
        },
      ],
    });

    const categoryResponse = text.trim();

    // Try to find best matching category from our fetched list
    let bestMatch = "Other";

    if (categoryResponse) {
      // Exact match
      if (categories.includes(categoryResponse)) {
        bestMatch = categoryResponse;
      } else {
        // Fuzzy match - look for closest match in case of capitalization or minor spelling differences
        const lowerCaseResponse = categoryResponse.toLowerCase();
        const match = categories.find(
          (c) => c.toLowerCase() === lowerCaseResponse
        );
        if (match) {
          bestMatch = match;
        }
      }
    }

    return {
      ...inputData,
      category: bestMatch,
    };
  },
});

// Step 3: Review and confirm expense (can be suspended for user input)
const reviewExpense = createStep({
  id: "review-expense",
  description: "Allow user to review and edit expense details",
  inputSchema: expenseSchema,
  outputSchema: expenseSchema,
  suspendSchema: expenseSchema.partial(),
  execute: async ({ inputData }) => {
    // This step can be suspended to wait for user input
    // In a real app, you'd show a UI for the user to review and edit
    // For now, we'll just pass through the data
    return inputData;

    // In a real implementation, you might do something like:
    // return suspend({
    //   message: 'Please review the expense details',
    //   data: inputData
    // });
  },
});

// Step 4: Save to database
const saveExpense = createStep({
  id: "save-expense",
  description: "Save the expense to the database",
  inputSchema: expenseSchema,
  outputSchema: z.object({
    id: z.string(),
    ...expenseSchema.shape,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
  execute: async ({ inputData }) => {
    // In a real implementation, you would save to your database here
    // This is a mock implementation
    const newExpense = {
      id: `exp_${Date.now()}`,
      ...inputData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Simulate database save
    console.log("Saving expense to database:", newExpense);

    return newExpense;
  },
});

// Main workflow
export const expenseWorkflow = createWorkflow({
  id: "expense-workflow",
  inputSchema: z.object({
    imageUrl: z.string().url("Valid image URL is required"),
  }),
  outputSchema: z.object({
    id: z.string(),
    ...expenseSchema.shape,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
  steps: [
    extractExpenseData,
    categorizeExpense,
    reviewExpense,
    saveExpense,
  ] as const,
})
  .then(extractExpenseData)
  .then(categorizeExpense)
  .then(reviewExpense)
  .then(saveExpense)
  .commit();

/*
Example usage:

import Mastra from '@mastra/core';

const mastra = new Mastra({
  vnext_workflows: {
    'expense-workflow': expenseWorkflow,
  },
});

async function processReceipt(imageUrl: string) {
  const workflow = mastra.vnext_getWorkflow('expense-workflow');
  const run = workflow.createRun();
  const result = await run.start({ inputData: { imageUrl } });
  
  if (result.status === 'success') {
    return result.result;
  }
  
  if (result.status === 'suspended') {
    // Handle suspended workflow
    return null;
  }
  
  throw new Error('Failed to process expense');
}
*/

export default expenseWorkflow;
