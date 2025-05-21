import { z } from "zod";
import { createWorkflow, createStep } from "@mastra/core/workflows/vNext";
import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";

async function fetchCategoriesFromAPI(): Promise<string[]> {
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

  return data.categories.map((cat: { name: string }) => cat.name);
}

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

    const formattedData = { ...expenseData };

    if (formattedData.date && !formattedData.date.includes("T")) {
      try {
        const dateObj = new Date(formattedData.date);
        if (!isNaN(dateObj.getTime())) {
          formattedData.date = dateObj.toISOString();
        }
      } catch (error) {
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

const categorizeExpense = createStep({
  id: "categorize-expense",
  description: "Categorize the expense based on merchant and items",
  inputSchema: expenseSchema,
  outputSchema: expenseSchema,
  execute: async ({ inputData }) => {
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

    let bestMatch = "Other";

    if (categoryResponse) {
      if (categories.includes(categoryResponse)) {
        bestMatch = categoryResponse;
      } else {
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
    const newExpense = {
      id: `exp_${Date.now()}`,
      ...inputData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return newExpense;
  },
});

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
  steps: [extractExpenseData, categorizeExpense, saveExpense] as const,
})
  .then(extractExpenseData)
  .then(categorizeExpense)
  .then(saveExpense)
  .commit();

export default expenseWorkflow;
