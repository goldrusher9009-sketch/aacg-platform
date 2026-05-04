import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'DATABASE_URL not configured',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    // Placeholder - actual connection would be tested here
    return NextResponse.json(
      {
        status: 'configured',
        database: 'PostgreSQL',
        url: dbUrl.replace(/password[^@]*/, 'PASSWORD_REDACTED'),
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
