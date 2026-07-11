import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseFile = process.env.DATABASE_FILE || './dev.sqlite3';
const testDatabaseFile = process.env.TEST_DATABASE_FILE || './test.sqlite3';

export default {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, databaseFile),
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
  },
  test: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, testDatabaseFile),
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
  },
};
