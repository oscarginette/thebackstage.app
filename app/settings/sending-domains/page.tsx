import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UseCaseFactory } from '@/lib/di-container';
import SendingDomainsClient from './SendingDomainsClient';
import { PATHS } from '@/lib/paths';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sending Domains - The Backstage',
  description: 'Verify your domain to send emails from your own address',
};

/**
 * Sending Domains Settings Page (Server Component)
 *
 * Handles authentication and fetches user's sending domains.
 * Follows Clean Architecture pattern: fetches data via Use Case,
 * passes to client component for presentation.
 *
 * Security: Requires authentication, redirects to login if unauthorized.
 */
export default async function SendingDomainsPage() {
  console.log('[SendingDomainsPage] START - Loading sending domains page');

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
    console.log('[SendingDomainsPage] Creating use case...');
    const useCase = UseCaseFactory.createGetUserSendingDomainsUseCase();

    console.log('[SendingDomainsPage] Executing GetUserSendingDomainsUseCase for userId:', userId);
    const domains = await useCase.execute(userId);

    console.log('[SendingDomainsPage] Domains loaded successfully:', {
      count: domains.length,
      domains: domains.map(d => ({ id: d.id, domain: d.domain, status: d.status })),
    });

    return (
      <SendingDomainsClient
        initialDomains={domains.map(d => d.toJSON())}
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
