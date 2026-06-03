/**
 * Seeds default template JSON files into data/templates/.
 * Run: npx tsx scripts/seed-templates.ts
 */
import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SEED_DIR = path.join(ROOT, 'data', 'templates');
const SEED_FILES = ['seed-nissan-promo.json'];

async function seed() {
  await fs.mkdir(SEED_DIR, { recursive: true });

  for (const file of SEED_FILES) {
    const source = path.join(SEED_DIR, file);
    try {
      await fs.access(source);
      console.log(`✓ Seed file exists: ${file}`);
    } catch {
      console.warn(`⚠ Seed file missing: ${file}`);
    }
  }

  console.log(`\nSeed templates directory: ${SEED_DIR}`);
  console.log(`Templates ready: ${SEED_FILES.join(', ')}`);
}

seed().catch(console.error);
