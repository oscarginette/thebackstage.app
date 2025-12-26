import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.mjmlContent) {
      return NextResponse.json(
        { error: 'mjmlContent is required' },
        { status: 400 }
      );
    }

    // Lazy import to avoid issues during build
    const { MJMLCompiler } = await import('@/infrastructure/email/MJMLCompiler');
    const compiler = new MJMLCompiler();
    const result = compiler.compile({ mjmlContent: body.mjmlContent });

    if (result.errors.length > 0) {
      return NextResponse.json({
        html: result.html,
        errors: result.errors,
        hasErrors: true
      });
    }

    return NextResponse.json({
      html: result.html,
      errors: [],
      hasErrors: false
    });
  } catch (error: any) {
    console.error('Error compiling MJML:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to compile MJML' },
      { status: 500 }
    );
  }
}
