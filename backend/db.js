const { Pool } = require('pg')

// rejectUnauthorized: false is required for Neon's managed PostgreSQL.
// In a self-hosted setup, this should be set to true for full certificate validation.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

module.exports = pool
