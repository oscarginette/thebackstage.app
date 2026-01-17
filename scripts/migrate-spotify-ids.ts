/**
 * Migration Script: Clean Spotify Artist IDs
 *
 * Problem:
 * - Users can save Spotify IDs in different formats:
 *   - Full URL: https://open.spotify.com/artist/7KdYiTlUhtXvmFgPXcCKf8?si=xxx
 *   - Spotify URI: spotify:artist:7KdYiTlUhtXvmFgPXcCKf8
 *   - Just ID: 7KdYiTlUhtXvmFgPXcCKf8
 *
 * - Spotify API expects clean ID only (22 alphanumeric characters)
 * - This breaks follow/save operations when URL is stored
 *
 * Solution:
 * - Extract clean ID from any format
 * - Update users.spotify_id to contain only the clean ID
 *
 * Usage:
 *   npx tsx scripts/migrate-spotify-ids.ts
 */

import { sql } from '@vercel/postgres';
import { extractSpotifyArtistId, isValidSpotifyArtistId } from '../lib/spotify-utils';

async function migrateSpotifyIds() {
  console.log('🔧 Starting Spotify ID migration...\n');

  try {
    // 1. Get all users with non-null spotify_id
    const result = await sql`
      SELECT id, email, name, spotify_id
      FROM users
      WHERE spotify_id IS NOT NULL
      ORDER BY id
    `;

    const users = result.rows;

    console.log(`📊 Found ${users.length} users with Spotify ID configured\n`);

    if (users.length === 0) {
      console.log('✅ No users to migrate');
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 2. Process each user
    for (const user of users) {
      const currentSpotifyId = user.spotify_id;

      console.log(`\n👤 User ${user.id} (${user.email}):`);
      console.log(`   Current: ${currentSpotifyId}`);

      // Check if already clean
      if (isValidSpotifyArtistId(currentSpotifyId)) {
        console.log(`   ✅ Already clean ID - skipping`);
        skippedCount++;
        continue;
      }

      // Extract clean ID
      const cleanId = extractSpotifyArtistId(currentSpotifyId);

      if (!cleanId) {
        console.log(`   ❌ Invalid format - cannot extract ID`);
        errorCount++;
        continue;
      }

      console.log(`   Extracted: ${cleanId}`);

      // Update database
      try {
        await sql`
          UPDATE users
          SET spotify_id = ${cleanId}
          WHERE id = ${user.id}
        `;

        console.log(`   ✅ Updated successfully`);
        updatedCount++;
      } catch (error) {
        console.log(`   ❌ Update failed:`, error);
        errorCount++;
      }
    }

    // 3. Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Migration Summary:');
    console.log(`   Total users: ${users.length}`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped (already clean): ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 4. Verification
    console.log('🔍 Verification - Current state:');
    const verification = await sql`
      SELECT id, email, spotify_id
      FROM users
      WHERE spotify_id IS NOT NULL
      ORDER BY id
    `;

    verification.rows.forEach((row) => {
      const isValid = isValidSpotifyArtistId(row.spotify_id);
      const status = isValid ? '✅' : '❌';
      console.log(`   ${status} User ${row.id}: ${row.spotify_id}`);
    });

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateSpotifyIds()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
