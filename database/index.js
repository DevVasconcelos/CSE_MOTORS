// database/index.js
const { Pool } = require('pg')
require('dotenv').config()

/**
 * Config robusta:
 * - Em produção (ou se DATABASE_URL existir): usa connectionString
 * - Caso contrário: usa PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE
 * - Força a senha a ser string (evita "client password must be a string")
 * - SSL opcional via env DATABASE_SSL=true (útil em alguns provedores)
 */

const hasDatabaseUrl = !!process.env.DATABASE_URL
const isProd = process.env.NODE_ENV === 'production'

const baseConfig = hasDatabaseUrl
  ? {
      connectionString: process.env.DATABASE_URL,
      ...(process.env.DATABASE_SSL === 'true' && {
        ssl: { rejectUnauthorized: false },
      }),
    }
  : {
      host: process.env.PGHOST || '127.0.0.1',
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || 'postgres',
      password: String(process.env.PGPASSWORD ?? ''), // <- chave do erro SASL resolvida aqui
      database: process.env.PGDATABASE || 'cse_motors',
      // SSL normalmente desnecessário localmente
    }

const pool = new Pool(baseConfig)

// Export simples em produção; com logger em dev se quiser
if (!isProd) {
  module.exports = {
    async query(text, params) {
      try {
        const res = await pool.query(text, params)
        // console.log('executed query', { text })
        return res
      } catch (err) {
        console.error('error in query', { text })
        throw err
      }
    },
  }
} else {
  module.exports = pool
}
