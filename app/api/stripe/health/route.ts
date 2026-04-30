import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

    if (!secretKey || !publishableKey) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Stripe credentials not configured',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: 'configured',
        provider: 'Stripe',
        mode: secretKey.includes('test') ? 'test' : 'live',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
