import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not defined. Database operations will fail.');
}

const connection = mysql.createPool(process.env.DATABASE_URL || '');

export const db = drizzle(connection, { schema, mode: 'default' });
export * from './schema';
