import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { Resend } from 'resend';
import { render } from '@react-email/components';
import NewTrackEmail from '@/emails/new-track';

export const dynamic = 'force-dynamic';

export async function POST() {
  const startTime = Date.now();

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Datos de prueba
    const testTrack = {
      trackId: `test-${Date.now()}`,
      title: '🧪 Test Track - Email System Check',
      url: 'https://soundcloud.com/geebeat',
      coverImage: 'https://i1.sndcdn.com/avatars-000000000000-000000-t500x500.jpg',
      publishedAt: new Date().toISOString()
    };

    // Buscar el contacto de prueba
    const contact = await sql`
      SELECT id, email, name, unsubscribe_token
      FROM contacts
      WHERE email = 'info@geebeat.com'
      LIMIT 1
    `;

    if (contact.rows.length === 0) {
      // Crear el contacto si no existe
      const newContact = await sql`
        INSERT INTO contacts (email, name, subscribed)
        VALUES ('info@geebeat.com', 'Gee Beat Test', true)
        RETURNING id, email, name, unsubscribe_token
      `;
      contact.rows[0] = newContact.rows[0];
    }

    const testContact = contact.rows[0];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://backstage.app';
    const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${testContact.unsubscribe_token}`;

    // Renderizar email
    const emailHtml = await render(
      NewTrackEmail({
        trackName: testTrack.title,
        trackUrl: testTrack.url,
        coverImage: testTrack.coverImage,
        unsubscribeUrl,
        customContent: {
          greeting: '🧪 Test Email - System Check',
          message: 'Testing Email Tracking System - This is a test email to verify email events are being tracked correctly.',
          signature: 'Test System'
        }
      })
    );

    // Enviar con Resend
    const { data, error } = await resend.emails.send({
      from: `Gee Beat <${process.env.SENDER_EMAIL}>`,
      to: testContact.email,
      subject: '🧪 Test Email - System Check',
      html: emailHtml,
      tags: [
        { name: 'category', value: 'test' },
        { name: 'track_id', value: testTrack.trackId }
      ]
    });

    if (error) {
      console.error('Error sending test email:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Guardar track de prueba PRIMERO (foreign key requirement)
    await sql`
      INSERT INTO soundcloud_tracks (track_id, title, url, published_at, cover_image)
      VALUES (
        ${testTrack.trackId},
        ${testTrack.title},
        ${testTrack.url},
        ${testTrack.publishedAt},
        ${testTrack.coverImage}
      )
    `;

    // Registrar en DB
    await sql`
      INSERT INTO email_logs (contact_id, track_id, resend_email_id, status)
      VALUES (${testContact.id}, ${testTrack.trackId}, ${data?.id || null}, 'sent')
    `;

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      recipient: testContact.email,
      resendId: data?.id,
      track: testTrack.title,
      duration: Date.now() - startTime,
      nextSteps: [
        '1. Check your inbox at info@geebeat.com',
        '2. Open the email (this will trigger an "opened" event)',
        '3. Click on the track link (this will trigger a "clicked" event)',
        '4. Visit /stats to see the events being tracked'
      ]
    });

  } catch (error: any) {
    console.error('Error in test email:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
