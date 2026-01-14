const bcrypt = require('bcrypt');

const targetHash = '$2b$10$QEBotO5NAisdiRFcDgKB4eOpkx0smAVg1gu.1tfKvijeOPkQquIwy';

// Common password variations
const variations = [
  // Original
  'Geebeat1234',
  'geebeat1234',
  
  // With spaces
  'Geebeat1234 ',
  ' Geebeat1234',
  'geebeat 1234',
  
  // Different cases
  'GEEBEAT1234',
  'GeeBeat1234',
  
  // With special chars
  'Geebeat@1234',
  'Geebeat!1234',
  
  // Common typos
  'Geebeat12345',
  'Gebeat1234',
  'Geebeat123',
  
  // Email related
  'geebeat@hotmail.com',
  'info@geebeat.com',
];

async function test() {
  console.log('Testing against hash:', targetHash);
  console.log('');
  
  for (const pwd of variations) {
    const result = await bcrypt.compare(pwd, targetHash);
    if (result) {
      console.log(`✅ MATCH FOUND: "${pwd}"`);
      return;
    } else {
      console.log(`❌ "${pwd}"`);
    }
  }
  
  console.log('\n⚠️  No match found. The password used was something else.');
}

test().catch(console.error);
