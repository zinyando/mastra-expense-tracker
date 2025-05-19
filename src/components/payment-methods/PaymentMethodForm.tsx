'use client';

import { useState } from 'react';
import { PaymentMethod } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle } from 'lucide-react';

interface PaymentMethodFormProps {
  paymentMethod?: PaymentMethod;
  onSubmit: (data: Omit<PaymentMethod, 'id'>) => Promise<void>;
  onCancel: () => void;
}

const paymentTypes = [
  { value: 'credit-card', label: 'Credit Card' },
  { value: 'debit-card', label: 'Debit Card' },
  { value: 'bank-account', label: 'Bank Account' },
  { value: 'cash', label: 'Cash' },
  { value: 'digital-wallet', label: 'Digital Wallet' },
  { value: 'other', label: 'Other' },
];

export default function PaymentMethodForm({
  paymentMethod,
  onSubmit,
  onCancel,
}: PaymentMethodFormProps) {
  const [formData, setFormData] = useState({
    name: paymentMethod?.name || '',
    type: paymentMethod?.type || paymentTypes[0].label,
    lastFourDigits: paymentMethod?.lastFourDigits || '',
    isDefault: paymentMethod?.isDefault || false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payment method');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Card className="border-destructive/50 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Enter payment method name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select payment type" />
          </SelectTrigger>
          <SelectContent>
            {paymentTypes.map((type) => (
              <SelectItem key={type.value} value={type.label}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastFourDigits">Last 4 Digits</Label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
            ••••
          </span>
          <Input
            type="text"
            id="lastFourDigits"
            name="lastFourDigits"
            value={formData.lastFourDigits}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
              setFormData((prev) => ({ ...prev, lastFourDigits: value }));
            }}
            className="pl-14 font-mono"
            placeholder="1234"
            maxLength={4}
            pattern="\d{0,4}"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          For cards and accounts, enter the last 4 digits for easy identification
        </p>
      </div>

      <div className="flex items-start space-x-3">
        <Checkbox
          id="isDefault"
          checked={formData.isDefault}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, isDefault: checked === true }))
          }
        />
        <div className="space-y-1 leading-none">
          <Label
            htmlFor="isDefault"
            className="cursor-pointer font-normal"
          >
            Set as default
          </Label>
          <p className="text-sm text-muted-foreground">
            Make this the default payment method for new expenses
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : paymentMethod ? 'Update Payment Method' : 'Add Payment Method'}
        </Button>
      </div>
    </form>
  );
}
