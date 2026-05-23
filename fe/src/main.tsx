import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import './i18n/config'
import './index.css'
import App from './App.tsx'

const TOAST_TOP_OFFSET = 88

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster
        position="top-center"
        style={{
          top: `${TOAST_TOP_OFFSET}px`,
          zIndex: 100000,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            padding: '16px',
          },
        }}
      />
      <App />
    </BrowserRouter>
  </StrictMode>,
)
