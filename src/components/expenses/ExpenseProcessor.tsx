'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type ExpenseItem = {
  description: string;
  quantity?: number;
  unitPrice?: number;
  total: number;
};

type Expense = {
  id: string;
  merchant: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  items?: ExpenseItem[];
  tax?: number;
  tip?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

interface ExpenseProcessorProps {
  expense: Expense;
  onSave: (expense: Expense) => Promise<void>;
  onCancel: () => void;
}

export default function ExpenseProcessor({ expense, onSave, onCancel }: ExpenseProcessorProps) {
  const [formData, setFormData] = useState<Expense>(expense);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const type = e.target.type;

    setFormData(prev => {
      if (name.includes('.')) { // items.field.index
        const [parent, child, indexStr] = name.split('.');
        if (parent === 'items' && indexStr) {
          const items = JSON.parse(JSON.stringify(prev.items || [])); // Deep copy for safety
          const idx = parseInt(indexStr, 10);
          
          // Ensure the item exists or create a placeholder if adding new row functionality
          while (items.length <= idx) {
            items.push({ description: '', total: 0 }); // Adjust placeholder as needed
          }
          const currentItem = items[idx];

          let processedValue: string | number = value;
          if (child === 'quantity' || child === 'unitPrice' || child === 'total') {
            processedValue = value === '' ? 0 : parseFloat(value);
            if (isNaN(processedValue)) processedValue = 0;
          }
          
          currentItem[child] = processedValue;
          
          // Recalculate item total if quantity or unitPrice changed
          if ((child === 'quantity' || child === 'unitPrice') && currentItem.quantity !== undefined && currentItem.unitPrice !== undefined) {
            currentItem.total = (currentItem.quantity || 0) * (currentItem.unitPrice || 0);
          }

          return { ...prev, items };
        }
        return prev;
      }
      
      // Handle flat properties
      if (type === 'number' || ['amount', 'tax', 'tip'].includes(name)) {
        // For optional fields like tax/tip, allow undefined if cleared. For amount, default to 0.
        const isOptional = ['tax', 'tip'].includes(name);
        const numValue = value === '' ? (isOptional ? undefined : 0) : parseFloat(value);
        return { ...prev, [name]: (value === '' && isOptional) ? undefined : (numValue !== undefined && isNaN(numValue) ? (isOptional ? undefined : 0) : numValue) };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSave(formData);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate totals
  const itemsTotal = formData.items?.reduce((sum, item) => sum + item.total, 0) || 0;
  const taxAmount = formData.tax || 0;
  const tipAmount = formData.tip || 0;
  const total = itemsTotal + taxAmount + tipAmount;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Expense</CardTitle>
      </CardHeader>
      <CardContent>
        
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
                value={formData.date ? formData.date.split('T')[0] : ''}
                onChange={handleChange}
                required
              />
            </div>

            <div className="sm:col-span-3 space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-muted-foreground text-sm">{formData.currency}</span>
                </div>
                <Input
                  type="number"
                  name="amount"
                  id="amount"
                  value={formData.amount === undefined ? '' : String(formData.amount)}
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
              <Select name="category" value={formData.category} onValueChange={handleCategoryChange} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Meals">Meals</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Transportation">Transportation</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
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
                      <TableRow key={index}> {/* Consider using a unique item.id if available */}
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
                            value={String(item.quantity ?? '')}
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
                            value={String(item.unitPrice ?? '')} 
                            onChange={handleChange}
                            className="h-8"
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            name={`items.total.${index}`}
                            value={String(item.total ?? '')}
                            onChange={handleChange} // Or make this read-only and calculated
                            className="h-8 text-right"
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
                value={formData.tax === undefined ? '' : String(formData.tax)}
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
                value={formData.tip === undefined ? '' : String(formData.tip)}
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
                value={String(total)}
                disabled
              />
            </div>

            <div className="sm:col-span-6 space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes || ''}
                onChange={handleChange}
              />
            </div>
          </div>

        </form>
      </CardContent>
      <CardFooter className="flex justify-end space-x-3">
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit} // Attach handleSubmit here as well if form element is not implicitly submitting
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Expense'}
        </Button>
      </CardFooter>
    </Card>
  );
}
