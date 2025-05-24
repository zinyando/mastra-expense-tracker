import { z } from "zod";
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { useExpenseStore } from "@/store/expenseStore";

async function fetchCategoriesFromAPI(): Promise<
  { id: string; name: string }[]
> {
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

  return data.categories.map((cat: { id: string; name: string }) => ({
    id: cat.id,
    name: cat.name,
  }));
}

const expenseSchema = z.object({
  merchant: z.string().describe("The name of the merchant or store"),
  amount: z.number().positive().describe("The total amount of the expense"),
  currency: z.string().default("USD").describe("Currency code, e.g., USD, EUR"),
  date: z.string().describe("Date of the expense"),
  category: z.string().describe("Expense category"),
  categoryId: z.string().describe("Expense category ID"),
  imageUrl: z.string().url("Valid image URL is required"),
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

    const formattedData = { ...expenseData, imageUrl };

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
    // Fetch categories with their IDs
    const categoriesResponse = await fetchCategoriesFromAPI();
    const categories = categoriesResponse.map((c) => ({
      id: c.id,
      name: c.name,
    }));

    // Get category names for AI
    const categoryNames = categories.map((c) => c.name);

    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "system",
          content: `You are an expense categorization assistant. Categorize the following expense into one of these categories: ${categoryNames.join(", ")}. Return only the category name.`,
        },
        {
          role: "user",
          content: `Merchant: ${inputData.merchant}, Items: ${inputData.items?.map((i) => i.description).join(", ") || "N/A"}`,
        },
      ],
    });

    const categoryResponse = text.trim();
    let bestMatch = categories.find((c) => c.name === "Other") || {
      id: "other",
      name: "Other",
    };

    if (categoryResponse) {
      // Try exact match first
      const exactMatch = categories.find((c) => c.name === categoryResponse);
      if (exactMatch) {
        bestMatch = exactMatch;
      } else {
        // Try case-insensitive match
        const lowerCaseResponse = categoryResponse.toLowerCase();
        const match = categories.find(
          (c) => c.name.toLowerCase() === lowerCaseResponse
        );
        if (match) {
          bestMatch = match;
        }
      }
    }

    return {
      ...inputData,
      categoryId: bestMatch.id,
      category: bestMatch.name,
    };
  },
});

const reviewExpense = createStep({
  id: "review-expense",
  description: "Allow user to review and confirm expense details",
  inputSchema: expenseSchema,
  resumeSchema: expenseSchema,
  suspendSchema: z.object({
    currentData: expenseSchema,
  }),
  outputSchema: expenseSchema,
  execute: async ({ inputData, resumeData, suspend }) => {
    if (!resumeData) {
      await suspend({
        currentData: inputData,
      });

      return inputData;
    }

    return resumeData;
  },
});

const saveExpense = createStep({
  id: "save-expense",
  description: "Save the expense to the database via store",
  inputSchema: expenseSchema,
  outputSchema: z.object({
    id: z.string(),
    ...expenseSchema.shape,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
  execute: async ({ inputData }) => {
    const addExpense = useExpenseStore.getState().addExpense;

    // Use the category and categoryId that were already set by categorizeExpense step
    const expenseData = {
      merchant: inputData.merchant,
      amount: inputData.amount,
      currency: inputData.currency,
      date: inputData.date,
      description: inputData.notes || `Expense at ${inputData.merchant}`,
      categoryId: inputData.categoryId,
      categoryName: inputData.category, // Use the category name from previous step
      items: inputData.items,
      tax: inputData.tax,
      tip: inputData.tip,
      notes: inputData.notes,
      imageUrl: inputData.imageUrl,
    };

    const savedExpense = await addExpense(expenseData);

    if (!savedExpense) {
      throw new Error("Failed to save expense through the store");
    }

    // Ensure all required fields are present and of the correct type
    return {
      id: savedExpense.id,
      merchant: savedExpense.merchant,
      amount: savedExpense.amount,
      currency: savedExpense.currency || "USD",
      date: savedExpense.date,
      category: inputData.category, // Use category from previous step
      categoryId: inputData.categoryId, // Include categoryId from previous step
      imageUrl: savedExpense.imageUrl || inputData.imageUrl,
      items: savedExpense.items || inputData.items,
      tax: savedExpense.tax || 0,
      tip: savedExpense.tip || 0,
      notes: savedExpense.notes || inputData.notes,
      createdAt: savedExpense.createdAt || new Date().toISOString(),
      updatedAt: savedExpense.updatedAt || new Date().toISOString(),
    };
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

export default expenseWorkflow;
