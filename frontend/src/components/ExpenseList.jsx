import { useState, useEffect } from 'react'
import { getExpenses } from '../api'

function ExpenseList({ refreshTrigger }) {
  const [expenses, setExpenses] = useState([])
  const [pagination, setPagination] = useState(null)
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('date_desc')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const categories = [...new Set(expenses.map(e => e.category))].sort()

  async function loadExpenses(currentPage = page) {
    setLoading(true)
    setError('')
    try {
      const res = await getExpenses(category, sort, currentPage)
      setExpenses(res.data)
      setPagination(res.pagination)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    loadExpenses(1)
  }, [category, sort, refreshTrigger])

  useEffect(() => {
    loadExpenses(page)
  }, [page])

  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)

  return (
    <div className="expense-list">
      <div className="list-header">
        <h2>Expenses</h2>
        <div className="controls">
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
          </select>
        </div>
      </div>

      <div className="total-bar">
        Total: <strong>₹{total.toFixed(2)}</strong>
        {pagination && (
          <span className="pagination-info">
            &nbsp;— showing {expenses.length} of {pagination.total}
          </span>
        )}
      </div>

      {loading && <p className="status-msg">Loading...</p>}
      {error && <p className="error-msg">{error}</p>}

      {!loading && expenses.length === 0 && (
        <p className="status-msg">No expenses found.</p>
      )}

      {expenses.length > 0 && (
        <>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id}>
                  <td>{e.date?.slice(0, 10)}</td>
                  <td><span className="badge">{e.category}</span></td>
                  <td>{e.description}</td>
                  <td className="amount">₹{parseFloat(e.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1 || loading}
              >
                ← Prev
              </button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === pagination.totalPages || loading}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ExpenseList
