/**
 * POST /api/public/contacts
 * Public endpoint to add contacts from external websites
 * Requires API key authentication
 */

import { NextResponse } from 'next/server';
import { PostgresContactRepository } from '@/infrastructure/database/repositories/PostgresContactRepository';
import type { BulkImportContactInput } from '@/domain/repositories/IContactRepository';

export const dynamic = 'force-dynamic';

const contactRepository = new PostgresContactRepository();

/**
 * POST /api/public/contacts
 * Add a new contact to a user's list
 */
export async function POST(request: Request) {
  try {
    // Verify API key
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.PUBLIC_CONTACTS_API_KEY;

    if (!expectedApiKey) {
      console.error('PUBLIC_CONTACTS_API_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId, email, name, source = 'website' } = body;

    // Validate required fields
    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if contact already exists
    const existingContact = await contactRepository.findByEmail(email, userId);

    if (existingContact) {
      // If already exists and is unsubscribed, resubscribe
      if (!existingContact.subscribed) {
        await contactRepository.resubscribe(existingContact.id, userId);
        return NextResponse.json(
          {
            message: 'Contact resubscribed successfully',
            contact: { id: existingContact.id, email: existingContact.email }
          },
          { status: 200 }
        );
      }

      // Already subscribed
      return NextResponse.json(
        {
          message: 'Contact already exists',
          contact: { id: existingContact.id, email: existingContact.email }
        },
        { status: 200 }
      );
    }

    // Create new contact using bulkImport
    const contactInput: BulkImportContactInput = {
      userId,
      email: email.toLowerCase().trim(),
      name: name || null,
      subscribed: true,
      source,
      metadata: {
        addedVia: 'public-api',
        timestamp: new Date().toISOString()
      }
    };

    const result = await contactRepository.bulkImport([contactInput]);

    if (result.errors.length > 0) {
      return NextResponse.json(
        { error: result.errors[0].error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: 'Contact added successfully',
        inserted: result.inserted,
        updated: result.updated
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/public/contacts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
