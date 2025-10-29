import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.js'
import './styles.css'

const container = document.getElementById('root')
if (!container) {
	// Fail fast with a clear error for the editor/runtime
	throw new Error('Root element with id "root" not found')
}

const root = createRoot(container)
root.render(<App />)
