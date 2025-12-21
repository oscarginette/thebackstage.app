import { NextResponse } from 'next/server';
import * as brevo from '@getbrevo/brevo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // HARDCODED: Lista "Yo" (ID: 5) para pruebas
    // La API key MCP no tiene permisos para leer listas de contactos
    const lists = [
      { id: 5, name: 'Yo', totalSubscribers: 1 }
    ];

    console.log('Returning hardcoded lists:', lists);
    return NextResponse.json({ lists });

    /* CODIGO ORIGINAL (descomentar cuando tengas API key estándar):

    if (!process.env.BREVO_API_KEY) {
      return NextResponse.json(
        { error: 'BREVO_API_KEY not configured' },
        { status: 500 }
      );
    }

    console.log('Fetching Brevo lists...');
    const apiInstance = new brevo.ContactsApi();
    apiInstance.setApiKey(
      brevo.ContactsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const response = await apiInstance.getLists();
    const lists = response.body.lists?.map((list: any) => ({
      id: list.id,
      name: list.name,
      totalSubscribers: list.totalSubscribers || list.uniqueSubscribers || 0,
      folderId: list.folderId || null
    })) || [];

    return NextResponse.json({ lists });
    */

  } catch (error: any) {
    console.error('Error fetching Brevo lists:', error.message);
    return NextResponse.json(
      {
        error: 'Failed to fetch Brevo lists',
        details: error.message
      },
      { status: 500 }
    );
  }
}
