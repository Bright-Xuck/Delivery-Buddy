import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  `postgres://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'delivery_buddy'}`;

const useSsl =
  process.env.DATABASE_SSL === 'true' ||
  connectionString.includes('neon.tech') ||
  connectionString.includes('sslmode=require');

const sql = postgres(connectionString, {
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  connection: {
    application_name: 'delivery_buddy',
  },
});

export default sql;
