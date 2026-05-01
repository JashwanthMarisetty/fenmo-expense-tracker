const express = require('express')
const router = express.Router()
const pool = require('./db')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Utilities', 'Other']

// POST /expenses - idempotent expense creation
router.post('/', async (req, res) => {
  const { idempotency_key, amount, category, description, date } = req.body

  // validate idempotency key
  if (!idempotency_key || !UUID_RE.test(idempotency_key)) {
    return res.status(400).json({ error: 'idempotency_key must be a valid UUID.' })
  }

  // validate amount
  if (amount === undefined || amount === null || amount === '') {
    return res.status(400).json({ error: 'amount is required.' })
  }
  const parsedAmount = parseFloat(amount)
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number.' })
  }
  if (!/^\d+(\.\d{1,2})?$/.test(String(amount))) {
    return res.status(400).json({ error: 'amount must have at most 2 decimal places.' })
  }

  // validate category
  if (!category || !category.trim()) {
    return res.status(400).json({ error: 'category is required.' })
  }
  if (!ALLOWED_CATEGORIES.includes(category.trim())) {
    return res.status(400).json({ error: `category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.` })
  }

  // validate description
  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'description is required.' })
  }
  if (description.trim().length > 255) {
    return res.status(400).json({ error: 'description must be 255 characters or fewer.' })
  }

  // validate date
  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'date must be a valid date (YYYY-MM-DD).' })
  }

  try {
    // ON CONFLICT ensures a retry with the same key never creates a duplicate row
    const result = await pool.query(
      `INSERT INTO expenses (idempotency_key, amount, category, description, date)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING *`,
      [idempotency_key, parsedAmount.toFixed(2), category.trim(), description.trim(), date]
    )

    if (result.rows.length > 0) {
      return res.status(201).json(result.rows[0])
    }

    // duplicate request — return the original row so the client can proceed normally
    const existing = await pool.query(
      'SELECT * FROM expenses WHERE idempotency_key = $1',
      [idempotency_key]
    )
    return res.status(200).json(existing.rows[0])

  } catch (err) {
    console.error('POST /expenses:', err)
    return res.status(500).json({ error: 'Internal server error.' })
  }
})

// GET /expenses - list with optional filter and sort
router.get('/', async (req, res) => {
  const { category, sort } = req.query

  let query = `
    SELECT id, amount::text AS amount, category, description,
           date, created_at
    FROM expenses
  `
  const params = []

  if (category && category.trim()) {
    params.push(category.trim())
    query += ` WHERE category = $${params.length}`
  }

  // amount cast to text so JS never receives a float (preserves NUMERIC(12,2) precision)
  query += sort === 'date_asc'
    ? ' ORDER BY date ASC, created_at ASC'
    : ' ORDER BY date DESC, created_at DESC'

  try {
    const result = await pool.query(query, params)
    return res.status(200).json(result.rows)
  } catch (err) {
    console.error('GET /expenses:', err)
    return res.status(500).json({ error: 'Internal server error.' })
  }
})

module.exports = router
