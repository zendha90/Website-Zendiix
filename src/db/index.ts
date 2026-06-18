import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not defined. Database operations will fail.');
}

let connection: mysql.Pool;

if (process.env.DATABASE_URL) {
  connection = mysql.createPool(process.env.DATABASE_URL);
} else {
  console.warn('DATABASE_URL is not defined near server boot. Using dummy connection options to prevent boot crashes.');
  connection = mysql.createPool({
    host: 'localhost',
    user: 'dummy_user',
    password: 'dummy_password',
    database: 'dummy_db',
  });
}

export const db = drizzle(connection, { schema, mode: 'default' });
export * from './schema';
