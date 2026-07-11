import path from 'path';
import { fileURLToPath } from 'url';
import sql from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  try {
    await sql.file(path.join(__dirname, 'seed.sql'));
    console.log('Seed data inserted successfully.');
  } catch (err) {
    console.error('Failed to seed database:', err);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

run();
