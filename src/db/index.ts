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

    let safePassword = parsed.password;
    try {
      safePassword = decodeURIComponent(parsed.password);
    } catch {
      // Keep original password if decodeURIComponent fails
    }

    const poolConfig: mysql.PoolOptions = {
      host: parsed.hostname === 'localhost' ? '127.0.0.1' : parsed.hostname,
      port: parsed.port ? parseInt(parsed.port) : 3306,
      user: parsed.username,
      password: safePassword,
      database: parsed.pathname.substring(1).split('?')[0],
      connectionLimit: 4, 
      connectTimeout: 10000, 
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      idleTimeout: 15000,
      maxIdle: 4,
      ...queryParams,
    };

    connection = mysql.createPool(poolConfig);
  } catch (err) {
    console.error('Error parsing DATABASE_URL, falling back to basic connection pool:', err);
    try {
      connection = mysql.createPool({ uri: process.env.DATABASE_URL } as any);
    } catch (fallbackErr) {
      console.error('Fatal database connection fallback error, using dummy options to prevent crash:', fallbackErr);
      connection = mysql.createPool({
        host: 'localhost',
        user: 'dummy_user',
        password: 'dummy_password',
        database: 'dummy_db',
      });
    }
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
