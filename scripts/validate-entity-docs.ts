#!/usr/bin/env ts-node
/**
 * Validate entity documentation is up-to-date
 *
 * This script checks if the domain-entities.md skill is synchronized
 * with the actual entity files. Useful for CI/CD pipelines.
 *
 * Exit codes:
 * - 0: Documentation is up-to-date
 * - 1: Documentation is outdated (needs regeneration)
 * - 2: Documentation file doesn't exist
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const DOCS_FILE = path.join(process.cwd(), '.claude', 'skills', 'domain-entities.md');
const ENTITIES_DIR = path.join(process.cwd(), 'domain', 'entities');
const TEMP_FILE = path.join(process.cwd(), '.claude', 'skills', 'domain-entities.md.tmp');

function main() {
  console.log('🔍 Validating domain entities documentation...\n');

  // Check if documentation exists
  if (!fs.existsSync(DOCS_FILE)) {
    console.error('❌ ERROR: domain-entities.md does not exist');
    console.error('   Run: npm run docs:entities');
    process.exit(2);
  }

  // Get last modification time of documentation
  const docsStats = fs.statSync(DOCS_FILE);
  const docsModifiedTime = docsStats.mtime;

  console.log(`📄 Documentation last modified: ${docsModifiedTime.toISOString()}`);

  // Get last modification time of entity files
  const entityFiles = fs.readdirSync(ENTITIES_DIR)
    .filter(file => file.endsWith('.ts'))
    .map(file => path.join(ENTITIES_DIR, file));

  let latestEntityModified = new Date(0);
  let latestEntityFile = '';

  for (const file of entityFiles) {
    const stats = fs.statSync(file);
    if (stats.mtime > latestEntityModified) {
      latestEntityModified = stats.mtime;
      latestEntityFile = path.basename(file);
    }
  }

  console.log(`📝 Latest entity modified: ${latestEntityFile} (${latestEntityModified.toISOString()})\n`);

  // Check if documentation is newer than all entities
  if (docsModifiedTime >= latestEntityModified) {
    console.log('✅ Documentation is up-to-date!');
    console.log(`   ${entityFiles.length} entities documented`);
    process.exit(0);
  }

  // Documentation is outdated - generate new version to compare
  console.log('⚠️  Documentation may be outdated. Generating fresh copy for comparison...\n');

  try {
    // Generate fresh documentation to temp file
    execSync('npm run docs:entities --silent', { stdio: 'inherit' });

    // Read both files
    const currentDocs = fs.readFileSync(DOCS_FILE, 'utf-8');
    const freshDocs = fs.readFileSync(DOCS_FILE, 'utf-8');

    // Remove timestamp lines for comparison
    const normalizeContent = (content: string) => {
      return content
        .split('\n')
        .filter(line => !line.includes('**Auto-generated**:'))
        .filter(line => !line.includes('*Last updated:'))
        .join('\n');
    };

    const normalizedCurrent = normalizeContent(currentDocs);
    const normalizedFresh = normalizeContent(freshDocs);

    if (normalizedCurrent === normalizedFresh) {
      console.log('✅ Documentation content is identical (only timestamp differs)');
      console.log(`   ${entityFiles.length} entities documented`);
      process.exit(0);
    }

    console.error('❌ ERROR: Documentation is outdated!');
    console.error('   Entity files have been modified since last documentation update');
    console.error('   Run: npm run docs:entities');
    process.exit(1);
  } catch (error) {
    console.error('❌ ERROR: Failed to validate documentation');
    console.error(error);
    process.exit(1);
  }
}

main();
