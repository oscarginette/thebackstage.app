import { NextResponse } from 'next/server';
import { SendTrackEmailUseCase, ValidationError } from '@/domain/services/SendTrackEmailUseCase';
import {
  trackRepository,
  contactRepository,
  emailLogRepository,
  executionLogRepository
} from '@/infrastructure/database/repositories';
import { resendEmailProvider } from '@/infrastructure/email';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const useCase = new SendTrackEmailUseCase(
      trackRepository,
      contactRepository,
      resendEmailProvider,
      emailLogRepository,
      executionLogRepository
    );

    const result = await useCase.execute({
      trackId: body.trackId,
      title: body.title,
      url: body.url,
      coverImage: body.coverImage,
      publishedAt: body.publishedAt,
      customContent: body.customContent
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error sending track:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
