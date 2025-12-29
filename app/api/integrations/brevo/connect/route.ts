import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';
import * as brevo from '@getbrevo/brevo';
import { ConnectBrevoSchema } from '@/lib/validation-schemas';

export const maxDuration = 30;

/**
 * POST /api/integrations/brevo/connect
 *
 * Connects user's Brevo account by validating and storing their API key.
 * Fetches account information from Brevo to verify the key is valid.
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // 2. Parse and validate request body
    const body = await request.json();

    const validation = ConnectBrevoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { apiKey } = validation.data;

    // 3. Validate API key by fetching account info from Brevo
    const accountApi = new brevo.AccountApi();
    accountApi.setApiKey(brevo.AccountApiApiKeys.apiKey, apiKey);

    let accountInfo;
    try {
      const response = await accountApi.getAccount();
      accountInfo = response.body;
    } catch (brevoError: any) {
      console.error('Brevo API error:', brevoError.message);

      // Check if it's an authentication error
      if (brevoError.status === 401 || brevoError.statusCode === 401) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your Brevo API key and try again.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `Brevo API error: ${brevoError.message}` },
        { status: 500 }
      );
    }

    // 4. Encrypt API key (simple base64 for now - use proper encryption in production)
    // TODO: Use pgcrypto or application-level encryption (AES-256)
    const apiKeyEncrypted = Buffer.from(apiKey).toString('base64');

    // 5. Store integration in database
    const result = await sql`
      INSERT INTO brevo_integrations (
        user_id,
        api_key_encrypted,
        account_email,
        account_name,
        company_name,
        is_active,
        updated_at
      )
      VALUES (
        ${userId},
        ${apiKeyEncrypted},
        ${accountInfo.email},
        ${accountInfo.firstName && accountInfo.lastName
          ? `${accountInfo.firstName} ${accountInfo.lastName}`
          : accountInfo.email
        },
        ${accountInfo.companyName || null},
        true,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_id) DO UPDATE SET
        api_key_encrypted = EXCLUDED.api_key_encrypted,
        account_email = EXCLUDED.account_email,
        account_name = EXCLUDED.account_name,
        company_name = EXCLUDED.company_name,
        is_active = true,
        updated_at = CURRENT_TIMESTAMP,
        last_error = NULL
      RETURNING id, account_email, account_name, company_name, created_at
    `;

    const integration = result.rows[0];

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        accountEmail: integration.account_email,
        accountName: integration.account_name,
        companyName: integration.company_name,
        connectedAt: integration.created_at
      }
    });

  } catch (error: unknown) {
    console.error('Error connecting Brevo:', error);

    return NextResponse.json(
      { error: 'Failed to connect Brevo account', details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
