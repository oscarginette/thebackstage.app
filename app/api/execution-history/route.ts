import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import Parser from 'rss-parser';
import { env, getAppUrl, getBaseUrl } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Verificar si hay POSTGRES_URL configurado
    if (!env.POSTGRES_URL) {
      console.log('No POSTGRES_URL configured, returning empty history');
      return NextResponse.json({
        history: []
      });
    }

    // Obtener tracks procesados con sus logs de ejecución
    const result = await sql`
      SELECT
        st.track_id,
        st.title,
        st.url,
        st.published_at,
        st.cover_image,
        st.description,
        st.created_at,
        el.emails_sent,
        el.duration_ms,
        el.executed_at
      FROM soundcloud_tracks st
      LEFT JOIN execution_logs el ON el.executed_at >= st.created_at
      WHERE el.new_tracks = 1
      ORDER BY el.executed_at DESC
      LIMIT 20
    `;

    // Obtener información adicional del RSS para imágenes y descripciones
    const parser = new Parser();
    const rssUrl = `https://feeds.soundcloud.com/users/soundcloud:users:${env.SOUNDCLOUD_USER_ID}/sounds.rss`;

    let feed: Parser.Output<{ [key: string]: any }> | undefined;
    try {
      feed = await parser.parseURL(rssUrl);
    } catch (error) {
      console.error('Failed to fetch RSS feed:', error);
    }

    // Enriquecer datos con información del RSS si es necesario
    const enrichedHistory = result.rows.map((row: any) => {
      // Si ya tenemos cover_image y description en la DB, usarlos
      let coverImage = row.cover_image;
      let description = row.description;

      // Si no, intentar obtener del RSS
      if ((!coverImage || !description) && feed) {
        const rssTrack = feed.items.find(
          (item: any) => item.link === row.url || item.guid === row.track_id
        );

        if (rssTrack) {
          coverImage = coverImage || rssTrack.itunes?.image || rssTrack.enclosure?.url || null;
          description = description || rssTrack.contentSnippet || rssTrack.content || null;
        }
      }

      return {
        trackId: row.track_id,
        title: row.title,
        url: row.url,
        publishedAt: row.published_at,
        executedAt: row.executed_at,
        emailsSent: row.emails_sent || 0,
        durationMs: row.duration_ms || 0,
        coverImage,
        description
      };
    });

    return NextResponse.json({
      history: enrichedHistory
    });

  } catch (error: unknown) {
    console.error('Error fetching execution history:', error);
    // Retornar historial vacío en caso de error para no romper la UI
    return NextResponse.json({
      history: []
    });
  }
}
