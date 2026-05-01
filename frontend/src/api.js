const API_URL = import.meta.env.VITE_API_URL || ''

export async function getExpenses(category, sort, page = 1) {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (sort) params.set('sort', sort)
  params.set('page', page)
  params.set('limit', '20')

  const res = await fetch(`${API_URL}/expenses?${params}`)
  if (!res.ok) throw new Error('Failed to load expenses')
  return res.json()
}

export async function addExpense(data) {
  const res = await fetch(`${API_URL}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to add expense')
  return json
}
