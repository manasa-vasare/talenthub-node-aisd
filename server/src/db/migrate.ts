import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, exec, closeDb } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('--- RUNNING DATABASE MIGRATIONS ---');
  await initDb();

  let schemaPath = path.resolve(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(__dirname, '../../src/db/schema.sql');
  }
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  try {
    await exec(schemaSql);
    console.log('✓ Successfully applied schema.sql (10 tables, indexes, constraints created)');
  } catch (err: any) {
    console.error('Migration failed:', err);
    throw err;
  }
}

// If executed directly
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations()
    .then(() => {
      console.log('Migration completed.');
      return closeDb();
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
