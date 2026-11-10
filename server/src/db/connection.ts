import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DbClient {
  query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }>;
}

let activePool: pg.Pool | null = null;
let activePglite: any = null;
let isInitialized = false;

export async function initDb(): Promise<void> {
  if (isInitialized) return;

  if (config.databaseUrl) {
    try {
      console.log(`[DB] Attempting connection to PostgreSQL via DATABASE_URL...`);
      const pool = new pg.Pool({
        connectionString: config.databaseUrl,
        connectionTimeoutMillis: 3000,
      });
      // Test connectivity
      await pool.query('SELECT 1');
      activePool = pool;
      console.log(`[DB] Successfully connected to PostgreSQL server.`);
      isInitialized = true;
      return;
    } catch (err: any) {
      console.warn(`[DB] External PostgreSQL unreachable (${err.message}). Falling back to embedded PostgreSQL (PGlite)...`);
    }
  }

  // Use embedded PGlite for self-contained zero-config PostgreSQL engine
  try {
    const { PGlite } = await import('@electric-sql/pglite');
    const dataDir = path.resolve(__dirname, '../../.pglite-data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    activePglite = new PGlite(dataDir);
    await activePglite.waitReady;
    console.log(`[DB] Embedded PostgreSQL engine (PGlite) active at ${dataDir}`);
    isInitialized = true;
  } catch (err: any) {
    console.error(`[DB] Failed to initialize embedded PostgreSQL:`, err);
    throw err;
  }
}

export async function exec(sql: string): Promise<void> {
  if (!isInitialized) {
    await initDb();
  }

  if (activePool) {
    await activePool.query(sql);
    return;
  }

  if (activePglite) {
    await activePglite.exec(sql);
    return;
  }

  throw new Error('Database client not initialized');
}

export async function query<T = any>(
  sql: string,
  params: any[] = []
): Promise<{ rows: T[]; rowCount: number }> {
  if (!isInitialized) {
    await initDb();
  }

  if (activePool) {
    const result = await activePool.query(sql, params);
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount ?? result.rows.length,
    };
  }

  if (activePglite) {
    const result = await activePglite.query(sql, params);
    return {
      rows: (result.rows || []) as T[],
      rowCount: result.rows?.length || (result.affectedRows ?? 0),
    };
  }

  throw new Error('Database client not initialized');
}

export async function withTransaction<T>(
  callback: (client: DbClient) => Promise<T>
): Promise<T> {
  if (!isInitialized) {
    await initDb();
  }

  if (activePool) {
    const client = await activePool.connect();
    try {
      await client.query('BEGIN');
      const txClient: DbClient = {
        query: async (sql, params = []) => {
          const res = await client.query(sql, params);
          return { rows: res.rows, rowCount: res.rowCount ?? res.rows.length };
        },
      };
      const result = await callback(txClient);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  if (activePglite) {
    return await activePglite.transaction(async (tx: any) => {
      const txClient: DbClient = {
        query: async (sql, params = []) => {
          const res = await tx.query(sql, params);
          return { rows: res.rows || [], rowCount: res.rows?.length || (res.affectedRows ?? 0) };
        },
      };
      return await callback(txClient);
    });
  }

  throw new Error('Database client not initialized');
}

export async function closeDb(): Promise<void> {
  if (activePool) {
    await activePool.end();
    activePool = null;
  }
  if (activePglite) {
    await activePglite.close();
    activePglite = null;
  }
  isInitialized = false;
}
