require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function checkTracks() {
  try {
    console.log('Checking tracks in database...\n');

    const tracks = await sql`
      SELECT * FROM soundcloud_tracks
      ORDER BY created_at DESC
      LIMIT 5
    `;

    console.log(`Total tracks: ${tracks.rows.length}\n`);

    tracks.rows.forEach((track, i) => {
      console.log(`Track ${i + 1}:`);
      console.log(`  ID: ${track.id}`);
      console.log(`  Title: ${track.title}`);
      console.log(`  URL: ${track.url}`);
      console.log(`  Published: ${track.published_at}`);
      console.log(`  Email sent: ${track.email_sent_at}`);
      console.log('');
    });

    const logs = await sql`
      SELECT * FROM execution_logs
      ORDER BY executed_at DESC
      LIMIT 5
    `;

    console.log(`\nRecent execution logs: ${logs.rows.length}\n`);

    logs.rows.forEach((log, i) => {
      console.log(`Log ${i + 1}:`);
      console.log(`  Executed: ${log.executed_at}`);
      console.log(`  New tracks: ${log.new_tracks || 0}`);
      console.log(`  Emails sent: ${log.emails_sent || 0}`);
      console.log(`  Duration: ${log.duration_ms}ms`);
      console.log(`  Error: ${log.error || 'None'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTracks();
