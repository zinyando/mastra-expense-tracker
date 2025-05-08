import { NextResponse } from 'next/server';

const paymentMethods = [
  {
    id: '1',
    name: 'Corporate Credit Card',
    type: 'Credit Card',
    lastFourDigits: '4242',
    isDefault: true,
  },
  {
    id: '2',
    name: 'Business Debit Card',
    type: 'Debit Card',
    lastFourDigits: '8888',
    isDefault: false,
  },
  {
    id: '3',
    name: 'Petty Cash',
    type: 'Cash',
    isDefault: false,
  },
];

export async function GET() {
  return NextResponse.json({ paymentMethods });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newPaymentMethod = {
      id: String(paymentMethods.length + 1),
      ...data,
      isDefault: false,
    };
    paymentMethods.push(newPaymentMethod);
    return NextResponse.json({ paymentMethod: newPaymentMethod });
  } catch (err) {
    console.error('Error creating payment method:', err);
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
  }
}
