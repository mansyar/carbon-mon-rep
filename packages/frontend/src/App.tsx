import React, { useEffect, useState } from 'react'

type Health = { status: string } | { error: string }

const App: React.FC = () => {
  const [health, setHealth] = useState<Health | null>(null)
  const apiBase = (import.meta as any).env?.VITE_API_URL || ''

  useEffect(() => {
    const url = apiBase ? `${apiBase.replace(/\/$/, '')}/api/health` : '/api/health'
    fetch(url)
      .then((r) => r.json())
      .then((j) => setHealth(j))
      .catch((err) => setHealth({ error: String(err) }))
  }, [apiBase])

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Carbon Monitor — Frontend</h1>
      <p>Backend URL: {apiBase || 'relative (/api/health)'}</p>
      <div>
        <strong>Health:</strong>
        <pre>{health ? JSON.stringify(health, null, 2) : 'loading...'}</pre>
      </div>
    </div>
  )
}

export default App
