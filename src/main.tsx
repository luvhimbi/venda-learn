import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.min.css";

// Bootstrap JS (for modals, dropdowns, etc.)
import "bootstrap/dist/js/bootstrap.bundle.min.js"
import './index.css'
import App from './app/App.tsx'

import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './app/providers/contexts/ThemeContext.tsx';

import { checkGlobalCacheBust } from './services/dataCache.ts';

// Check for global cache bust on startup
checkGlobalCacheBust();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>,
);
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('Service Worker registered!', reg))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}





