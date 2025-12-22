import { hash } from 'bcrypt';
import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function createTestUser() {
  try {
    // Hash the password "password123"
    const passwordHash = await hash('password123', 10);

    // Create test user
    const result = await sql`
      INSERT INTO users (email, password_hash, name, role, subscription_plan)
      VALUES (
        'test@example.com',
        ${passwordHash},
        'Test User',
        'artist',
        'free'
      )
      ON CONFLICT (email) DO UPDATE
      SET password_hash = ${passwordHash}
      RETURNING id, email, name;
    `;

    console.log('✅ Test user created successfully:');
    console.log('   Email: test@example.com');
    console.log('   Password: password123');
    console.log('   User ID:', result.rows[0].id);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();
