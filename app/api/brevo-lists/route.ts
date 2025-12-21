import { NextResponse } from 'next/server';
import * as brevo from '@getbrevo/brevo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!process.env.BREVO_API_KEY) {
      return NextResponse.json(
        { error: 'BREVO_API_KEY not configured' },
        { status: 500 }
      );
    }

    console.log('Fetching Brevo lists...');
    console.log('API Key length:', process.env.BREVO_API_KEY.length);

    const apiInstance = new brevo.ContactsApi();
    apiInstance.setApiKey(
      brevo.ContactsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const response = await apiInstance.getLists();
    console.log('Brevo API response status:', response.response.statusCode);
    console.log('Raw lists data:', JSON.stringify(response.body.lists, null, 2));

    const lists = response.body.lists?.map((list: any) => ({
      id: list.id,
      name: list.name,
      totalSubscribers: list.totalSubscribers || list.uniqueSubscribers || 0,
      folderId: list.folderId || null
    })) || [];

    console.log('Processed lists:', lists);
    return NextResponse.json({ lists });

  } catch (error: any) {
    console.error('Error fetching Brevo lists:', error.message);
    console.error('Error code:', error.response?.status);
    console.error('Error body:', error.response?.body);

    let errorMessage = 'Failed to fetch Brevo lists';
    if (error.response?.status === 401) {
      errorMessage = 'No conectado: La API key no tiene permisos para leer listas de contactos';
    } else if (error.response?.status === 403) {
      errorMessage = 'No conectado: Acceso denegado a las listas de Brevo';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        statusCode: error.response?.status || 500,
        details: error.response?.body || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
}
