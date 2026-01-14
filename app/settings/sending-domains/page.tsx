import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UseCaseFactory } from '@/lib/di-container';
import SendingDomainsClient from './SendingDomainsClient';
import { PATHS } from '@/lib/paths';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Senders & Domains - The Backstage',
  description: 'Configure your sender email and verify domains to send from your own address',
};

// Force dynamic rendering (requires authentication)
export const dynamic = 'force-dynamic';

/**
 * Senders & Domains Settings Page (Server Component)
 *
 * Unified page for sender email configuration and domain verification.
 * Fetches both user settings (sender email) and sending domains.
 * Follows Clean Architecture pattern: fetches data via Use Cases,
 * passes to client component for presentation.
 *
 * Security: Requires authentication, redirects to login if unauthorized.
 */
export default async function SendingDomainsPage() {
  console.log('[SendingDomainsPage] START - Loading senders & domains page');

  try {
    // Authentication check
    console.log('[SendingDomainsPage] Checking authentication...');
    const session = await auth();

    console.log('[SendingDomainsPage] Auth result:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });

    if (!session?.user) {
      console.log('[SendingDomainsPage] No session, redirecting to login');
      redirect(PATHS.LOGIN);
    }

    const userId = parseInt(session.user.id);
    console.log('[SendingDomainsPage] User ID parsed:', userId);

    // Fetch user's sending domains using Clean Architecture
    console.log('[SendingDomainsPage] Creating domains use case...');
    const getDomainsUseCase = UseCaseFactory.createGetUserSendingDomainsUseCase();

    console.log('[SendingDomainsPage] Executing GetUserSendingDomainsUseCase for userId:', userId);
    const domains = await getDomainsUseCase.execute(userId);

    console.log('[SendingDomainsPage] Domains loaded successfully:', {
      count: domains.length,
      domains: domains.map(d => ({ id: d.id, domain: d.domain, status: d.status })),
    });

    // Fetch user settings (for sender email)
    console.log('[SendingDomainsPage] Creating user settings use case...');
    const getUserSettingsUseCase = UseCaseFactory.createGetUserSettingsUseCase();

    console.log('[SendingDomainsPage] Executing GetUserSettingsUseCase for userId:', userId);
    const userSettings = await getUserSettingsUseCase.execute(userId);

    console.log('[SendingDomainsPage] User settings loaded:', {
      hasSenderEmail: userSettings.hasSenderEmail(),
      senderEmail: userSettings.senderEmail,
      senderName: userSettings.senderName,
    });

    return (
      <SendingDomainsClient
        initialDomains={domains.map(d => d.toJSON())}
        currentSenderEmail={userSettings.senderEmail}
        currentSenderName={userSettings.senderName}
      />
    );
  } catch (error) {
    console.error('[SendingDomainsPage] FATAL ERROR:', {
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    throw error; // Let error boundary handle it
  }
}
