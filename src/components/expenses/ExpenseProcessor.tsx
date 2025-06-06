"use client";

import { useState } from "react";
import { useExpenseStore } from "@/store/expenseStore";
import type { Category, WorkflowExpense } from "@/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
interface ExpenseProcessorProps {
  expense: WorkflowExpense;
  categories: Category[];
  suspendedData?: WorkflowExpense;
  runId?: string;
  onResumed: (finalExpense: WorkflowExpense) => void;
  onClose: () => void;
}

export default function ExpenseProcessor({
  expense,
  categories,
  suspendedData,
  runId,
  onResumed,
  onClose,
}: ExpenseProcessorProps) {
  const [formData, setFormData] = useState<WorkflowExpense>(() => {
    const initialData = suspendedData || expense;
    return {
      ...initialData,
      currency: initialData.currency || "USD",
    };
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addExpense, updateExpense } = useExpenseStore();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const type = e.target.type;

    setFormData((prev) => {
      if (name.includes(".")) {
        const [parent, child, indexStr] = name.split(".");
        if (parent === "items" && indexStr) {
          const items = JSON.parse(JSON.stringify(prev.items || []));
          const idx = parseInt(indexStr, 10);

          while (items.length <= idx) {
            items.push({ description: "", total: 0 });
          }
          const currentItem = items[idx];

          let processedValue: string | number = value;
          if (
            child === "quantity" ||
            child === "unitPrice" ||
            child === "total"
          ) {
            processedValue = value === "" ? 0 : parseFloat(value);
            if (isNaN(processedValue)) processedValue = 0;
          }

          currentItem[child] = processedValue;

          if (
            (child === "quantity" || child === "unitPrice") &&
            currentItem.quantity !== undefined &&
            currentItem.unitPrice !== undefined
          ) {
            currentItem.total =
              (currentItem.quantity || 0) * (currentItem.unitPrice || 0);
          }

          return { ...prev, items };
        }
        return prev;
      }

      if (type === "number" || ["amount", "tax", "tip"].includes(name)) {
        const isOptional = ["tax", "tip"].includes(name);
        const numValue =
          value === "" ? (isOptional ? undefined : 0) : parseFloat(value);
        return {
          ...prev,
          [name]:
            value === "" && isOptional
              ? undefined
              : numValue !== undefined && isNaN(numValue)
                ? isOptional
                  ? undefined
                  : 0
                : numValue,
        };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, categoryId: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (runId) {
        const categoryName =
          categories.find((c) => c.id === formData.categoryId)?.name || "";

        const resumeData = {
          merchant: formData.merchant,
          amount: formData.amount,
          currency: formData.currency,
          date: formData.date,
          category: categoryName,
          items: formData.items || [],
          tax: formData.tax || 0,
          tip: formData.tip || 0,
          notes: formData.notes || "",
          imageUrl: formData.imageUrl,
          categoryId: formData.categoryId,
        };

        const response = await fetch("/api/expenses/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runId: runId,
            stepId: "review-expense",
            resumeData,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to resume workflow");
        }

        const result = await response.json();
        onResumed(result.expense);
      } else {
        if (formData.id) {
          await updateExpense(formData.id, formData);
        } else {
          const newExpense = await addExpense(formData);
          onResumed(newExpense || formData);
          return;
        }
        onResumed(formData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemsTotal =
    formData.items?.reduce((sum, item) => sum + item.total, 0) || 0;
  const taxAmount = formData.tax || 0;
  const tipAmount = formData.tip || 0;
  const total = itemsTotal + taxAmount + tipAmount;

  return (
    <Card className="w-full max-w-4xl mx-auto max-h-[90vh] flex flex-col">
      <CardHeader>
        <CardTitle>
          {runId ? "Review Expense" : "Edit Expense"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3 space-y-1.5">
              <Label htmlFor="merchant">Merchant</Label>
              <Input
                type="text"
                name="merchant"
                id="merchant"
                value={formData.merchant}
                onChange={handleChange}
                required
              />
            </div>

            <div className="sm:col-span-3 space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                name="date"
                id="date"
                value={formData.date ? formData.date.split("T")[0] : ""}
                onChange={handleChange}
                required
              />
            </div>

            <div className="sm:col-span-3 space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-muted-foreground text-sm">
                    {formData.currency}
                  </span>
                </div>
                <Input
                  type="number"
                  name="amount"
                  id="amount"
                  value={
                    formData.amount === undefined ? "" : String(formData.amount)
                  }
                  onChange={handleChange}
                  className="pl-10"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3 space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select
                name="category"
                value={formData.categoryId}
                onValueChange={handleCategoryChange}
                required
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-6 space-y-1.5">
              <Label>Items</Label>
              {formData.items && formData.items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Description</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(formData.items || []).map((item, index) => (
                      <TableRow key={index}>
                        {/* Consider using a unique item.id if available */}
                        <TableCell>
                          <Input
                            type="text"
                            name={`items.description.${index}`}
                            value={item.description}
                            onChange={handleChange}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            name={`items.quantity.${index}`}
                            value={String(item.quantity ?? "")}
                            onChange={handleChange}
                            className="h-8"
                            min="0"
                            step="1"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            name={`items.unitPrice.${index}`}
                            value={
                              item.unitPrice !== undefined &&
                              item.unitPrice !== null
                                ? item.unitPrice.toFixed(2)
                                : ""
                            }
                            onChange={handleChange}
                            className="h-8 w-24"
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            name={`items.total.${index}`}
                            value={item.total.toFixed(2)}
                            disabled
                            className="h-8 text-right w-24"
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No items found</p>
              )}
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="tax">Tax</Label>
              <Input
                type="number"
                name="tax"
                id="tax"
                value={formData.tax === undefined ? "" : String(formData.tax)}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="tip">Tip</Label>
              <Input
                type="number"
                name="tip"
                id="tip"
                value={formData.tip === undefined ? "" : String(formData.tip)}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="total">Total</Label>
              <Input
                type="number"
                id="total"
                value={total.toFixed(2)}
                disabled
              />
            </div>

            <div className="sm:col-span-6 space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Expense"}
        </Button>
      </CardFooter>
    </Card>
  );
}
