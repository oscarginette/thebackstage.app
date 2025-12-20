import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import Parser from 'rss-parser';
import * as brevo from '@getbrevo/brevo';

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

    // 3. Enviar email via Brevo
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY!
    );

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = {
      email: process.env.SENDER_EMAIL!,
      name: 'Gee Beat'
    };

    const recipients = JSON.parse(process.env.RECIPIENT_EMAILS || '[]');
    sendSmtpEmail.to = recipients.map((email: string) => ({ email }));
    sendSmtpEmail.templateId = Number(process.env.BREVO_TEMPLATE_ID);
    sendSmtpEmail.params = {
      TRACK_NAME: latestTrack.title || 'Sin título',
      TRACK_URL: latestTrack.link || '',
      COVER_IMAGE: latestTrack.itunes?.image || latestTrack.enclosure?.url || ''
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    // 4. Guardar en DB
    await sql`
      INSERT INTO soundcloud_tracks (track_id, title, url, published_at)
      VALUES (
        ${trackId},
        ${latestTrack.title || 'Sin título'},
        ${latestTrack.link || ''},
        ${new Date(latestTrack.pubDate || Date.now())}
      )
    `;

    // 5. Log de ejecución
    await sql`
      INSERT INTO execution_logs (new_tracks, emails_sent, duration_ms)
      VALUES (1, ${recipients.length}, ${Date.now() - startTime})
    `;

    return NextResponse.json({
      success: true,
      track: latestTrack.title,
      emailsSent: recipients.length
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
