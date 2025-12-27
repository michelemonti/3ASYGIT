import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { TestPage } from './pages/TestPage.tsx'
import './index.css'

// Simple path-based routing (no react-router needed)
function Router() {
  const path = window.location.pathname;
  
  // Secret test page - only accessible via direct URL
  if (path === '/test') {
    return <TestPage />;
  }
  
  // Default: main app
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
)
