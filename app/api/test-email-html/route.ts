import { NextResponse } from 'next/server';
import { render } from '@react-email/components';
import NewTrackEmail from '@/emails/new-track';
import CustomEmail from '@/emails/custom-email';
import { env, getAppUrl, getBaseUrl } from '@/lib/env';
import { EmailSignature } from '@/domain/value-objects/EmailSignature';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { trackName, trackUrl, coverImage, customContent } = body;

    // Generar URL de unsubscribe de ejemplo
    const baseUrl = getAppUrl();
    const unsubscribeUrl = `${baseUrl}/unsubscribe?token=preview_token`;

    // If customContent is provided, use CustomEmail template (from email editor)
    // Otherwise use NewTrackEmail (for track notifications)
    let html: string;

    if (customContent) {
      html = await render(
        CustomEmail({
          greeting: customContent.greeting || '',
          message: customContent.message || '',
          signature: customContent.signature || '',
          coverImage: coverImage || '',
          unsubscribeUrl
        })
      );
    } else {
      html = await render(
        NewTrackEmail({
          trackName: trackName || 'Test Track',
          trackUrl: trackUrl || 'https://soundcloud.com',
          coverImage: coverImage || '',
          unsubscribeUrl,
          emailSignature: EmailSignature.createGeeBeatDefault().toJSON(),
        })
      );
    }

    return NextResponse.json({ html });
  } catch (error: unknown) {
    console.error('Error rendering email:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Test endpoint con datos de ejemplo
    const baseUrl = getAppUrl();
    const html = await render(
      NewTrackEmail({
        trackName: 'Test Track Name',
        trackUrl: 'https://soundcloud.com/test',
        coverImage: 'https://i1.sndcdn.com/artworks-PvWznzRX9GmmRIlq-mlYTvA-t3000x3000.png',
        unsubscribeUrl: `${baseUrl}/unsubscribe?token=test_token`,
        emailSignature: EmailSignature.createGeeBeatDefault().toJSON(),
      })
    );

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: unknown) {
    console.error('Error rendering email:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
