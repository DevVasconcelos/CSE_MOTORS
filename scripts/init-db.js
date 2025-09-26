#!/usr/bin/env node
/**
 * Simple DB initializer for Render / startup: runs database/db-sql-code.sql
 * - Uses DATABASE_URL if present, otherwise PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE
 * - Strips problematic OWNER TO lines (e.g. OWNER TO cse340) which will fail on some managed DBs
 * - Exits with non-zero code if the SQL fails (prevents server from starting)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const hasDatabaseUrl = !!process.env.DATABASE_URL;
const baseConfig = hasDatabaseUrl
  ? {
      connectionString: process.env.DATABASE_URL,
      ...(process.env.DATABASE_SSL === 'true' && { ssl: { rejectUnauthorized: false } }),
    }
  : {
      host: process.env.PGHOST || '127.0.0.1',
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || 'postgres',
      password: String(process.env.PGPASSWORD ?? ''),
      database: process.env.PGDATABASE || 'cse_motors',
    };

const pool = new Pool(baseConfig);

async function runSqlFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');

  // Remove or neutralize OWNER TO statements which often reference roles not present on hosted DBs
  let sql = raw.replace(/ALTER TYPE[\s\S]*?OWNER TO[\s\S]*?;/gi, '');
  // also remove standalone OWNER TO ...; occurrences
  sql = sql.replace(/OWNER TO\s+\w+\s*;/gi, ';');

  // If file is large it's still okay; pg supports multiple statements in a single query
  return pool.query(sql);
}

(async () => {
  const sqlPath = path.join(__dirname, '..', 'database', 'db-sql-code.sql');
  console.log('DB init: running', sqlPath);
  try {
    await runSqlFile(sqlPath);
    console.log('DB init: success');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('DB init: failed');
    console.error(err && err.message ? err.message : err);
    try { await pool.end(); } catch (e) {}
    process.exit(1);
  }
})();
