import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      checks: {
        api: 'operational',
        database: 'checking...',
        stripe: 'checking...',
        supabase: 'checking...',
      },
    },
    { status: 200 }
  );
}
