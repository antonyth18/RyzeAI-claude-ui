import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [health, setHealth] = useState<{ status: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('http://localhost:5001/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => {
        console.error('Fetch error:', err)
        setError('Failed to fetch backend health')
      })
  }, [])

  return (
    <div className="App">
      <h1>Full-Stack Health Check</h1>
      <div className="card">
        {error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : health ? (
          <p>Backend Status: <strong>{health.status}</strong></p>
        ) : (
          <p>Fetching backend health...</p>
        )}
      </div>
    </div>
  )
}

export default App
