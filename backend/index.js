require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const createTable = require('./migrate')
const expensesRouter = require('./routes/expenses')

const app = express()
const PORT = process.env.PORT || 4000
const isProduction = process.env.NODE_ENV === 'production'

// security headers
app.use(helmet())

app.use(morgan(isProduction ? 'combined' : 'dev'))

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
}))

// rate limiting — 100 requests per 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' }
})
app.use(limiter)

app.use(express.json({ limit: '10kb' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
app.use('/expenses', expensesRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' })
})

// global error handler — never send stack traces in production
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error.' })
})

// start after DB is ready
async function start() {
  try {
    await createTable()
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
    })

    // graceful shutdown — lets Render drain in-flight requests before killing
    function shutdown() {
      console.log('Shutting down gracefully...')
      server.close(() => {
        console.log('Server closed.')
        process.exit(0)
      })
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
