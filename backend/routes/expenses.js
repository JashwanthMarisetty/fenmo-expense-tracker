const express = require('express')
const router = express.Router()
const pool = require('../db')

// POST /expenses - create a new expense
router.post('/', async (req, res) => {
  const { idempotency_key, amount, category, description, date } = req.body

  // basic validation
  if (!idempotency_key || !amount || !category || !description || !date) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  if (isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' })
  }

  if (isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'Invalid date' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO expenses (idempotency_key, amount, category, description, date)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING *`,
      [idempotency_key, Number(amount).toFixed(2), category, description, date]
    )

    if (result.rows.length > 0) {
      return res.status(201).json(result.rows[0])
    }

    // already exists - return the existing one
    const existing = await pool.query(
      'SELECT * FROM expenses WHERE idempotency_key = $1',
      [idempotency_key]
    )
    return res.status(200).json(existing.rows[0])

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

// GET /expenses - list all expenses with optional filter and sort
router.get('/', async (req, res) => {
  const { category, sort } = req.query

  let query = 'SELECT * FROM expenses'
  const params = []

  if (category) {
    params.push(category)
    query += ` WHERE category = $${params.length}`
  }

  if (sort === 'date_desc') {
    query += ' ORDER BY date DESC, created_at DESC'
  } else {
    query += ' ORDER BY created_at DESC'
  }

  try {
    const result = await pool.query(query, params)
    return res.status(200).json(result.rows)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

module.exports = router
