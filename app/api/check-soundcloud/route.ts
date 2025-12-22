import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { Resend } from 'resend';
import NewTrackEmail from '@/emails/new-track';
import { CheckNewTracksUseCase } from '@/domain/services/CheckNewTracksUseCase';
import { trackRepository } from '@/infrastructure/database/repositories';
import { soundCloudRepository } from '@/infrastructure/music-platforms';

// Permitir hasta 60s de ejecución
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  try {
    const userId = process.env.SOUNDCLOUD_USER_ID;

    if (!userId) {
      return NextResponse.json(
        { error: 'SOUNDCLOUD_USER_ID not configured' },
        { status: 400 }
      );
    }

    // 1. Check for new tracks using Clean Architecture
    const useCase = new CheckNewTracksUseCase(
      soundCloudRepository,
      trackRepository
    );

    const result = await useCase.execute({
      artistIdentifier: userId,
      platform: 'soundcloud'
    });

    if (!result.latestTrack) {
      return NextResponse.json({ message: 'No tracks found in feed' });
    }

    const latestTrack = result.latestTrack;

    // 2. Obtener suscriptores activos (no desuscritos)
    const subscribersResult = await sql`
      SELECT email, name FROM subscribers WHERE unsubscribed = false
    `;

    if (subscribersResult.rows.length === 0) {
      return NextResponse.json({
        message: 'No active subscribers found'
      });
    }

    // 3. Enviar emails via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://backstage.app';

    let emailsSent = 0;
    let emailsFailed = 0;

    // Enviar a cada suscriptor
    for (const subscriber of subscribersResult.rows) {
      const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;

      try {
        const { data, error } = await resend.emails.send({
          from: 'Gee Beat <onboarding@resend.dev>',
          to: [subscriber.email],
          subject: 'Hey mate',
          react: NewTrackEmail({
            trackName: latestTrack.title,
            trackUrl: latestTrack.url,
            coverImage: latestTrack.coverImage || '',
            unsubscribeUrl
          })
        });

        if (error) {
          console.error(`Failed to send to ${subscriber.email}:`, error);
          emailsFailed++;
        } else {
          console.log(`Email sent to ${subscriber.email}:`, data?.id);
          emailsSent++;
        }
      } catch (err) {
        console.error(`Error sending to ${subscriber.email}:`, err);
        emailsFailed++;
      }
    }

    // 4. Guardar en DB (o actualizar si ya existe)
    await sql`
      INSERT INTO soundcloud_tracks (track_id, title, url, published_at)
      VALUES (
        ${latestTrack.id},
        ${latestTrack.title},
        ${latestTrack.url},
        ${latestTrack.publishedAt}
      )
      ON CONFLICT (track_id) DO UPDATE
      SET title = EXCLUDED.title, url = EXCLUDED.url
    `;

    // 5. Log de ejecución
    await sql`
      INSERT INTO execution_logs (new_tracks, emails_sent, duration_ms)
      VALUES (1, ${emailsSent}, ${Date.now() - startTime})
    `;

    return NextResponse.json({
      success: true,
      track: latestTrack.title,
      emailsSent,
      emailsFailed,
      totalSubscribers: subscribersResult.rows.length,
      newTracksFound: result.newTracksFound
    });

  } catch (error: any) {
    console.error('Error in check-soundcloud:', error);

    // Log de error
    try {
      await sql`
        INSERT INTO execution_logs (error, duration_ms)
        VALUES (${error.message}, ${Date.now() - startTime})
      `;
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
