import { NextResponse } from 'next/server';
import { render } from '@react-email/components';
import NewTrackEmail from '@/emails/new-track';
import CustomEmail from '@/emails/custom-email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { trackName, trackUrl, coverImage, customContent } = body;

    // Generar URL de unsubscribe de ejemplo
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://backstage.app';
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
          unsubscribeUrl
        })
      );
    }

    return NextResponse.json({ html });
  } catch (error: any) {
    console.error('Error rendering email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Test endpoint con datos de ejemplo
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://backstage.app';
    const html = await render(
      NewTrackEmail({
        trackName: 'Test Track Name',
        trackUrl: 'https://soundcloud.com/test',
        coverImage: 'https://i1.sndcdn.com/artworks-PvWznzRX9GmmRIlq-mlYTvA-t3000x3000.png',
        unsubscribeUrl: `${baseUrl}/unsubscribe?token=test_token`
      })
    );

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    console.error('Error rendering email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
