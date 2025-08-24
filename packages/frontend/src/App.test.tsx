import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'

describe('App', () => {
  it('renders heading', () => {
    const html = renderToString(<App />)
    expect(html).toContain('Carbon Monitor — Frontend')
  })
})
