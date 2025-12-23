import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.min.css";

// Bootstrap JS (for modals, dropdowns, etc.)
import "bootstrap/dist/js/bootstrap.bundle.min.js"
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
