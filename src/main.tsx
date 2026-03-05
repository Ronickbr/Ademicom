import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './globals.css'
import { Toaster } from 'sonner'
import { AuthProvider } from './components/providers/AuthProvider.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
        <Toaster position="top-right" theme="dark" richColors />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
