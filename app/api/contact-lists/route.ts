/**
 * Contact Lists API
 *
 * GET  /api/contact-lists - List all contact lists with stats
 * POST /api/contact-lists - Create a new contact list
 *
 * Multi-tenant isolation enforced via session.user.id
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';

/**
 * GET /api/contact-lists
 * Retrieve all contact lists with statistics for the authenticated user
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const useCase = UseCaseFactory.createGetContactListsWithStatsUseCase();
    const lists = await useCase.execute(parseInt(session.user.id));

    return NextResponse.json({ lists });
  } catch (error: any) {
    console.error('Error fetching contact lists:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contact lists' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contact-lists
 * Create a new contact list
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const useCase = UseCaseFactory.createCreateContactListUseCase();
    const list = await useCase.execute({
      userId: parseInt(session.user.id),
      name: body.name,
      description: body.description,
      color: body.color,
    });

    return NextResponse.json({ list }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating contact list:', error);

    // Handle quota limit error
    if (error.message.includes('maximum limit')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    // Handle duplicate name error (PostgreSQL unique constraint)
    if (
      error.message.includes('duplicate') ||
      error.code === '23505' ||
      error.constraint === 'unique_list_name_per_user'
    ) {
      return NextResponse.json(
        { error: 'A list with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create contact list' },
      { status: 400 }
    );
  }
}
