const API_URL = import.meta.env.VITE_API_URL || ''

export async function getExpenses(category, sort) {
  let url = `${API_URL}/expenses?sort=${sort || 'date_desc'}`
  if (category) {
    url += `&category=${encodeURIComponent(category)}`
  }

  const res = await fetch(url)
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
