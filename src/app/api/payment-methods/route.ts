import { NextResponse } from 'next/server';

let paymentMethodsData = [
  {
    id: '1',
    name: 'Corporate Credit Card',
    type: 'Credit Card',
    isDefault: true,
  },
  {
    id: '2',
    name: 'Personal Credit Card',
    type: 'Credit Card',
    lastFourDigits: '1234',
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
  return NextResponse.json({ paymentMethods: paymentMethodsData });
}

export async function POST(request: Request) {
  const data = await request.json();
  
  // Create a new array with updated default states
  const updatedMethods = data.isDefault
    ? paymentMethodsData.map(method => ({ ...method, isDefault: false }))
    : [...paymentMethodsData];

  const newPaymentMethod = {
    id: Math.random().toString(36).substring(7),
    ...data,
  };

  // Update the data store
  paymentMethodsData = [...updatedMethods, newPaymentMethod];
  return NextResponse.json(newPaymentMethod);
}

export async function PUT(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  const data = await request.json();

  const methodIndex = paymentMethodsData.findIndex(method => method.id === id);
  if (methodIndex === -1) {
    return new NextResponse('Payment method not found', { status: 404 });
  }

  // Create a new array with updated payment methods
  const updatedMethods = data.isDefault
    ? paymentMethodsData.map(method => ({
        ...method,
        isDefault: method.id === id ? true : false,
      }))
    : paymentMethodsData.map(method =>
        method.id === id ? { ...method, ...data } : method
      );

  // Update the data store
  paymentMethodsData = updatedMethods;
  return NextResponse.json(
    updatedMethods.find(method => method.id === id)
  );
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  const method = paymentMethodsData.find(m => m.id === id);
  if (!method) {
    return new NextResponse('Payment method not found', { status: 404 });
  }

  if (method.isDefault) {
    return new NextResponse('Cannot delete default payment method', { status: 400 });
  }

  // Create a new array without the deleted method
  paymentMethodsData = paymentMethodsData.filter(m => m.id !== id);
  return new NextResponse(null, { status: 204 });
}
