import { useState } from 'react'
import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import './App.css'

function App() {
  // bump this number to trigger a re-fetch in ExpenseList
  const [refresh, setRefresh] = useState(0)

  return (
    <div className="app">
      <header>
        <h1>💸 Expense Tracker</h1>
        <p>Track where your money goes</p>
      </header>

      <main>
        <ExpenseForm onAdded={() => setRefresh(r => r + 1)} />
        <ExpenseList refreshTrigger={refresh} />
      </main>
    </div>
  )
}

export default App
