const express = require('express')
const router = express.Router()
const pool = require('../db')

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Utilities', 'Other']

// Returns an error string if the request body is invalid, or null if it is fine.
function validateExpense({ idempotency_key, amount, category, description, date }) {
  if (!idempotency_key || !UUID_RE.test(idempotency_key)) {
    return 'idempotency_key must be a valid UUID.'
  }

  if (amount === undefined || amount === null || amount === '') {
    return 'amount is required.'
  }
  const parsed = parseFloat(amount)
  if (isNaN(parsed) || parsed <= 0) {
    return 'amount must be a positive number.'
  }
  if (!/^\d+(\.\d{1,2})?$/.test(String(amount))) {
    return 'amount must have at most 2 decimal places.'
  }

  if (!category || !category.trim()) {
    return 'category is required.'
  }
  if (!ALLOWED_CATEGORIES.includes(category.trim())) {
    return `category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`
  }

  if (!description || !description.trim()) {
    return 'description is required.'
  }
  if (description.trim().length > 255) {
    return 'description must be 255 characters or fewer.'
  }

  if (!date || isNaN(Date.parse(date))) {
    return 'date must be a valid date (YYYY-MM-DD).'
  }

  return null
}

// POST /expenses - idempotent expense creation
router.post('/', async (req, res) => {
  const validationError = validateExpense(req.body)
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }

  const { idempotency_key, amount, category, description, date } = req.body
  const parsedAmount = parseFloat(amount).toFixed(2)

  try {
    // ON CONFLICT ensures a retry with the same key never creates a duplicate row
    const result = await pool.query(
      `INSERT INTO expenses (idempotency_key, amount, category, description, date)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING *`,
      [idempotency_key, parsedAmount, category.trim(), description.trim(), date]
    )

    if (result.rows.length > 0) {
      return res.status(201).json(result.rows[0])
    }

    // duplicate request - return the original row so the client can proceed normally
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

// GET /expenses - list with optional filter, sort and pagination
router.get('/', async (req, res) => {
  const { category, sort } = req.query

  // pagination - default 20 per page, max 100
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
  const offset = (page - 1) * limit

  const params = []
  let whereClause = ''

  if (category && category.trim()) {
    params.push(category.trim())
    whereClause = ` WHERE category = $${params.length}`
  }

  const orderClause = sort === 'date_asc'
    ? 'ORDER BY date ASC, created_at ASC'
    : 'ORDER BY date DESC, created_at DESC'

  try {
    // run count and data queries in parallel for efficiency
    const [countResult, dataResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM expenses${whereClause}`, params),
      pool.query(
        // amount cast to ::text so JS never receives a float (preserves NUMERIC(12,2) precision)
        `SELECT id, amount::text AS amount, category, description, date, created_at
         FROM expenses${whereClause}
         ${orderClause}
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      )
    ])

    const total = parseInt(countResult.rows[0].count)

    return res.status(200).json({
      data: dataResult.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (err) {
    console.error('GET /expenses:', err)
    return res.status(500).json({ error: 'Internal server error.' })
  }
})

module.exports = router
