import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage('API not available'))
  }, [])

  return (
    <div className="app">
      <h1>Paperhands</h1>
      <p className="api-status">API Status: {message || 'Loading...'}</p>
    </div>
  )
}

export default App
