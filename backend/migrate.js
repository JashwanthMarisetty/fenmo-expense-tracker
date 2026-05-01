const pool = require('./db')

async function createTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      idempotency_key  UUID UNIQUE NOT NULL,
      amount           NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
      category         TEXT NOT NULL,
      description      TEXT NOT NULL,
      date             DATE NOT NULL,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  console.log('expenses table is ready')
}

module.exports = createTable
