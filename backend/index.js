require('dotenv').config()
const express = require('express')
const cors = require('cors')
const createTable = require('./migrate')

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Expense Tracker API is running' })
})

// start server only after DB is ready
createTable()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err)
    process.exit(1)
  })
