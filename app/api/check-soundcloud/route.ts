import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import Parser from 'rss-parser';
import { Resend } from 'resend';
import NewTrackEmail from '@/emails/new-track';

// Permitir hasta 60s de ejecución
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  try {
    // 1. Parsear RSS de SoundCloud
    const parser = new Parser();
    const rssUrl = `https://feeds.soundcloud.com/users/soundcloud:users:${process.env.SOUNDCLOUD_USER_ID}/sounds.rss`;
    const feed = await parser.parseURL(rssUrl);

    if (!feed.items || feed.items.length === 0) {
      return NextResponse.json({ message: 'No tracks found in feed' });
    }

    const latestTrack = feed.items[0];

    // 2. Verificar si ya existe en DB
    const trackId = latestTrack.guid || latestTrack.link;

    if (!trackId) {
      throw new Error('Track ID not found in RSS feed');
    }

    const existing = await sql`
      SELECT * FROM soundcloud_tracks WHERE track_id = ${trackId}
    `;

    if (existing.rows.length > 0) {
      // Ya procesado
      return NextResponse.json({
        message: 'No new tracks',
        lastTrack: latestTrack.title
      });
    }

    // 3. Obtener listas de Brevo configuradas
    const configResult = await sql`
      SELECT brevo_list_ids FROM app_config WHERE id = 1
    `;

    let listIds: number[] = [];
    if (configResult.rows.length > 0 && configResult.rows[0].brevo_list_ids) {
      const rawListIds = configResult.rows[0].brevo_list_ids;
      // Si ya es un array (PostgreSQL JSONB), usarlo directamente
      listIds = Array.isArray(rawListIds) ? rawListIds : JSON.parse(rawListIds);
    }

    if (listIds.length === 0) {
      throw new Error('No Brevo lists configured. Please configure lists in the dashboard.');
    }

    // 4. Enviar email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: 'Gee Beat <onboarding@resend.dev>', // Dominio de prueba de Resend
      to: [process.env.SENDER_EMAIL!], // Por ahora a ti mismo para probar
      subject: 'Hey mate',
      react: NewTrackEmail({
        trackName: latestTrack.title || 'Sin título',
        trackUrl: latestTrack.link || '',
        coverImage: latestTrack.itunes?.image || latestTrack.enclosure?.url || ''
      })
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    console.log('Email sent:', data?.id);

    // 5. Guardar en DB
    const publishedDate = latestTrack.pubDate
      ? new Date(latestTrack.pubDate).toISOString()
      : new Date().toISOString();

    await sql`
      INSERT INTO soundcloud_tracks (track_id, title, url, published_at)
      VALUES (
        ${trackId},
        ${latestTrack.title || 'Sin título'},
        ${latestTrack.link || ''},
        ${publishedDate}
      )
    `;

    // 6. Log de ejecución
    await sql`
      INSERT INTO execution_logs (new_tracks, emails_sent, duration_ms)
      VALUES (1, ${listIds.length}, ${Date.now() - startTime})
    `;

    return NextResponse.json({
      success: true,
      track: latestTrack.title,
      listsUsed: listIds.length,
      messageId: data?.id
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
