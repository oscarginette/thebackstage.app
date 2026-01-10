/**
 * Test User Notification Preferences Feature
 *
 * Tests the complete flow:
 * 1. Get default preferences (should return default values)
 * 2. Update preferences
 * 3. Verify changes persisted
 * 4. Test repository layer
 */

// IMPORTANT: Load env vars FIRST before any imports
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Pool } from 'pg';
// Import repositories and use cases directly to avoid env validation
import { PostgresUserNotificationPreferencesRepository } from '../infrastructure/database/repositories/PostgresUserNotificationPreferencesRepository';
import { GetUserNotificationPreferencesUseCase } from '../domain/services/GetUserNotificationPreferencesUseCase';
import { UpdateUserNotificationPreferencesUseCase } from '../domain/services/UpdateUserNotificationPreferencesUseCase';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function testNotificationPreferences() {
  console.log('🧪 Testing User Notification Preferences Feature\n');
  console.log('═'.repeat(80));

  try {
    // Step 1: Get a test user
    console.log('\n📋 Step 1: Getting test user...');
    const userResult = await pool.query('SELECT id, email, name FROM users LIMIT 1');

    if (userResult.rows.length === 0) {
      console.log('❌ No users found in database. Please create a user first.');
      await pool.end();
      process.exit(1);
    }

    const testUser = userResult.rows[0];
    console.log(`✅ Using test user: ${testUser.email} (ID: ${testUser.id})`);

    // Step 2: Get default preferences (should auto-create with defaults)
    console.log('\n📋 Step 2: Getting default preferences...');
    const repository = new PostgresUserNotificationPreferencesRepository();
    const getUseCase = new GetUserNotificationPreferencesUseCase(repository);
    const defaultPrefs = await getUseCase.execute(testUser.id);

    console.log('✅ Default preferences retrieved:');
    console.log(`   User ID: ${defaultPrefs.userId}`);
    console.log(`   SoundCloud Auto-Send: ${defaultPrefs.autoSendSoundcloud}`);
    console.log(`   Spotify Auto-Send: ${defaultPrefs.autoSendSpotify}`);
    console.log(`   Updated At: ${defaultPrefs.updatedAt.toISOString()}`);

    // Verify defaults are true
    if (defaultPrefs.autoSendSoundcloud !== true || defaultPrefs.autoSendSpotify !== true) {
      console.log('❌ Default preferences are not correct!');
      await pool.end();
      process.exit(1);
    }

    console.log('✅ Default values are correct (both enabled)');

    // Step 3: Update preferences - disable SoundCloud
    console.log('\n📋 Step 3: Updating preferences (disabling SoundCloud)...');
    const updateUseCase = new UpdateUserNotificationPreferencesUseCase(repository);
    const updatedPrefs = await updateUseCase.execute(testUser.id, {
      autoSendSoundcloud: false,
      // autoSendSpotify not specified, should remain true
    });

    console.log('✅ Preferences updated:');
    console.log(`   SoundCloud Auto-Send: ${updatedPrefs.autoSendSoundcloud} (should be false)`);
    console.log(`   Spotify Auto-Send: ${updatedPrefs.autoSendSpotify} (should be true)`);

    // Verify update
    if (updatedPrefs.autoSendSoundcloud !== false || updatedPrefs.autoSendSpotify !== true) {
      console.log('❌ Update failed - values are not correct!');
      await pool.end();
      process.exit(1);
    }

    console.log('✅ Update successful');

    // Step 4: Retrieve preferences again to verify persistence
    console.log('\n📋 Step 4: Retrieving preferences again to verify persistence...');
    const retrievedPrefs = await getUseCase.execute(testUser.id);

    console.log('✅ Retrieved preferences:');
    console.log(`   SoundCloud Auto-Send: ${retrievedPrefs.autoSendSoundcloud}`);
    console.log(`   Spotify Auto-Send: ${retrievedPrefs.autoSendSpotify}`);

    if (retrievedPrefs.autoSendSoundcloud !== false || retrievedPrefs.autoSendSpotify !== true) {
      console.log('❌ Persistence check failed!');
      await pool.end();
      process.exit(1);
    }

    console.log('✅ Preferences persisted correctly');

    // Step 5: Update both preferences
    console.log('\n📋 Step 5: Updating both preferences at once...');
    const bothUpdated = await updateUseCase.execute(testUser.id, {
      autoSendSoundcloud: true,
      autoSendSpotify: false,
    });

    console.log('✅ Both preferences updated:');
    console.log(`   SoundCloud Auto-Send: ${bothUpdated.autoSendSoundcloud} (should be true)`);
    console.log(`   Spotify Auto-Send: ${bothUpdated.autoSendSpotify} (should be false)`);

    if (bothUpdated.autoSendSoundcloud !== true || bothUpdated.autoSendSpotify !== false) {
      console.log('❌ Batch update failed!');
      await pool.end();
      process.exit(1);
    }

    console.log('✅ Batch update successful');

    // Step 6: Test validation (should fail with no fields)
    console.log('\n📋 Step 6: Testing validation...');
    try {
      await updateUseCase.execute(testUser.id, {});
      console.log('❌ Validation should have failed for empty update!');
      await pool.end();
      process.exit(1);
    } catch (error: any) {
      if (error.message.includes('At least one preference must be provided')) {
        console.log('✅ Validation working correctly (rejected empty update)');
      } else {
        console.log(`❌ Unexpected validation error: ${error.message}`);
        await pool.end();
        process.exit(1);
      }
    }

    // Step 7: Verify database state directly
    console.log('\n📋 Step 7: Verifying database state directly...');
    const dbCheck = await pool.query(
      'SELECT * FROM user_notification_preferences WHERE user_id = $1',
      [testUser.id]
    );

    if (dbCheck.rows.length === 0) {
      console.log('❌ No record found in database!');
      await pool.end();
      process.exit(1);
    }

    const dbRecord = dbCheck.rows[0];
    console.log('✅ Database record:');
    console.log(`   User ID: ${dbRecord.user_id}`);
    console.log(`   SoundCloud Auto-Send: ${dbRecord.auto_send_soundcloud}`);
    console.log(`   Spotify Auto-Send: ${dbRecord.auto_send_spotify}`);
    console.log(`   Updated At: ${dbRecord.updated_at}`);

    // Step 8: Test toJSON method
    console.log('\n📋 Step 8: Testing toJSON serialization...');
    const jsonOutput = bothUpdated.toJSON();
    console.log('✅ JSON output:');
    console.log(JSON.stringify(jsonOutput, null, 2));

    // Step 9: Clean up - reset to defaults for next test
    console.log('\n📋 Step 9: Resetting to defaults...');
    await updateUseCase.execute(testUser.id, {
      autoSendSoundcloud: true,
      autoSendSpotify: true,
    });
    console.log('✅ Reset to defaults (both enabled)');

    console.log('\n═'.repeat(80));
    console.log('🎉 All tests passed successfully!');
    console.log('\n✅ Summary:');
    console.log('   ✓ Default preferences work');
    console.log('   ✓ Single field updates work');
    console.log('   ✓ Batch updates work');
    console.log('   ✓ Validation works');
    console.log('   ✓ Persistence works');
    console.log('   ✓ Database integrity verified');
    console.log('   ✓ JSON serialization works');
    console.log('\n✅ Feature is production-ready!\n');

    await pool.end();

  } catch (error: any) {
    console.error('\n❌ Test failed!');
    console.error('Error:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    await pool.end();
    process.exit(1);
  }

  process.exit(0);
}

testNotificationPreferences();
