const pool = require('./db')

async function createTable() {
  // create the expenses table if it does not exist
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

  // index on category for fast filtering
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_expenses_category
      ON expenses (category)
  `)

  // index on date for fast date-based sorting
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_expenses_date
      ON expenses (date DESC)
  `)

  console.log('expenses table is ready')
}

module.exports = createTable
