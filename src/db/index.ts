import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not defined. Database operations will fail.');
}

let connection: mysql.Pool;

if (process.env.DATABASE_URL) {
  try {
    const parsed = new URL(process.env.DATABASE_URL);
    
    const queryParams: Record<string, any> = {};
    parsed.searchParams.forEach((value, key) => {
      // Parse boolean or numbers if passed as string
      if (value === 'true') queryParams[key] = true;
      else if (value === 'false') queryParams[key] = false;
      else if (!isNaN(Number(value))) queryParams[key] = Number(value);
      else queryParams[key] = value;
    });

    const poolConfig: mysql.PoolOptions = {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port) : 3306,
      user: parsed.username,
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.substring(1).split('?')[0], // remove leading / and query string if present
      connectionLimit: 2, // Strict limit to prevent exceeding max user connections (5)
      maxIdle: 2,
      idleTimeout: 30000, // 30 seconds
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      ...queryParams,
    };

    connection = mysql.createPool(poolConfig);
  } catch (err) {
    console.error('Error parsing DATABASE_URL, falling back to basic connection pool:', err);
    connection = mysql.createPool(process.env.DATABASE_URL);
  }
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
