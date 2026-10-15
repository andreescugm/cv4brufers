import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/big-shoulders-display/latin-700'
import '@fontsource/big-shoulders-display/latin-900'
import '@fontsource/instrument-sans/latin-400'
import '@fontsource/instrument-sans/latin-600'
import '@fontsource/instrument-serif/latin-400-italic'
import '@fontsource/jetbrains-mono/latin-400'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
