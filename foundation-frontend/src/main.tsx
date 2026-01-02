import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/ui-polish.css'
import App from './App.tsx'
import { ToastProvider } from './components/ToastProvider'
import { ConfigProvider } from './contexts/ConfigContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ConfigProvider>
  </StrictMode>,
)
