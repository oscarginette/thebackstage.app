const bcrypt = require('bcrypt');

// Hash from DB for geebeat@hotmail.com
const hash = '$2b$10$QEBotO5NAisdiRFcDgKB4eOpkx0smAVg1gu.1tfKvijeOPkQquIwy';

// Test different password variations
const passwords = [
  'Geebeat1234',
  'geebeat1234',
  'GEEBEAT1234',
  'Geebeat1234\n',
  'Geebeat1234 ',
  ' Geebeat1234',
];

async function test() {
  console.log('Testing hash:', hash);
  console.log('');
  
  for (const pwd of passwords) {
    const result = await bcrypt.compare(pwd, hash);
    console.log(`"${pwd}" -> ${result}`);
  }
  
  // Also test generating a new hash to compare
  console.log('\n--- Testing hash generation ---');
  const newHash = await bcrypt.hash('Geebeat1234', 10);
  console.log('New hash:', newHash);
  const matches = await bcrypt.compare('Geebeat1234', newHash);
  console.log('Matches:', matches);
}

test().catch(console.error);
