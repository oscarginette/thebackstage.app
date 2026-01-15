#!/usr/bin/env node

/**
 * Check execution logs to debug campaign history issue
 */

require('dotenv').config();
const { sql } = require('@vercel/postgres');

async function checkExecutionLogs() {
  try {
    console.log('Checking execution_logs table...\n');

    // Check all execution logs
    const allLogs = await sql`
      SELECT id, executed_at, new_tracks, emails_sent, track_id, track_title
      FROM execution_logs
      ORDER BY executed_at DESC
      LIMIT 10
    `;

    console.log('Recent execution logs:');
    console.table(allLogs.rows);

    // Check for custom campaigns (track_id IS NULL)
    const customCampaigns = await sql`
      SELECT id, executed_at, new_tracks, emails_sent, track_id, track_title
      FROM execution_logs
      WHERE track_id IS NULL
      ORDER BY executed_at DESC
      LIMIT 5
    `;

    console.log('\nCustom campaigns (track_id IS NULL):');
    console.table(customCampaigns.rows);

    // Check for SoundCloud tracks
    const soundCloudTracks = await sql`
      SELECT id, executed_at, new_tracks, emails_sent, track_id, track_title
      FROM execution_logs
      WHERE track_id IS NOT NULL
      ORDER BY executed_at DESC
      LIMIT 5
    `;

    console.log('\nSoundCloud tracks (track_id IS NOT NULL):');
    console.table(soundCloudTracks.rows);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkExecutionLogs();
