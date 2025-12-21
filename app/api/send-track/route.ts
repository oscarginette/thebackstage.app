import { NextResponse } from 'next/server';
import * as brevo from '@getbrevo/brevo';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const startTime = Date.now();
  const hasDatabase = !!process.env.POSTGRES_URL;

  try {
    const body = await request.json();
    const { trackId, title, url, coverImage, publishedAt, listIds } = body;

    if (!trackId || !title || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: trackId, title, url' },
        { status: 400 }
      );
    }

    // 1. Verificar si ya existe en DB (solo si hay DB)
    if (hasDatabase) {
      const { sql } = await import('@vercel/postgres');
      const existing = await sql`
        SELECT * FROM soundcloud_tracks WHERE track_id = ${trackId}
      `;

      if (existing.rows.length > 0) {
        return NextResponse.json(
          { error: 'Este track ya ha sido enviado anteriormente' },
          { status: 400 }
        );
      }
    }

    // 2. Obtener listas de Brevo configuradas
    let brevoListIds: number[] = [];

    if (listIds && Array.isArray(listIds) && listIds.length > 0) {
      // Usar las listas pasadas desde el cliente
      brevoListIds = listIds;
    } else if (hasDatabase) {
      // Intentar obtener de la DB
      const { sql } = await import('@vercel/postgres');
      const configResult = await sql`
        SELECT brevo_list_ids FROM app_config WHERE id = 1
      `;

      if (configResult.rows.length > 0 && configResult.rows[0].brevo_list_ids) {
        brevoListIds = JSON.parse(configResult.rows[0].brevo_list_ids);
      }
    }

    if (brevoListIds.length === 0) {
      return NextResponse.json(
        { error: 'No hay listas de Brevo configuradas. Por favor, configura las listas primero.' },
        { status: 400 }
      );
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

    // Configurar destinatarios usando listas de Brevo
    // Brevo requiere messageVersions para enviar a múltiples listas
    const messageVersions: brevo.SendSmtpEmailMessageVersionsInner[] = brevoListIds.map((listId) => {
      // @ts-ignore
      const recipient: any = {
        email: process.env.SENDER_EMAIL!,
        listId: listId
      };

      return {
        to: [recipient]
      };
    });

    sendSmtpEmail.messageVersions = messageVersions;
    sendSmtpEmail.templateId = Number(process.env.BREVO_TEMPLATE_ID);
    sendSmtpEmail.params = {
      TRACK_NAME: title,
      TRACK_URL: url,
      COVER_IMAGE: coverImage || ''
    };

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

    // 4. Guardar en DB (solo si hay DB)
    if (hasDatabase) {
      const { sql } = await import('@vercel/postgres');

      const publishedDateStr = new Date(publishedAt).toISOString();
      const coverImageValue = coverImage || null;

      await sql`
        INSERT INTO soundcloud_tracks (track_id, title, url, published_at, cover_image)
        VALUES (
          ${trackId},
          ${title},
          ${url},
          ${publishedDateStr},
          ${coverImageValue}
        )
      `;

      // 5. Log de ejecución
      await sql`
        INSERT INTO execution_logs (new_tracks, emails_sent, duration_ms)
        VALUES (1, ${brevoListIds.length}, ${Date.now() - startTime})
      `;
    }

    return NextResponse.json({
      success: true,
      track: title,
      listsUsed: brevoListIds.length,
      messageId: response.body?.messageId
    });

  } catch (error: any) {
    console.error('Error sending track:', error);

    // Log de error (solo si hay DB)
    if (hasDatabase) {
      try {
        const { sql } = await import('@vercel/postgres');
        await sql`
          INSERT INTO execution_logs (error, duration_ms)
          VALUES (${error.message}, ${Date.now() - startTime})
        `;
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
