import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import './styles/ui-polish.css'
import './i18n'
import { initSentry } from './utils/sentry'
import { initAnalytics } from './utils/analytics'
import App from './App.tsx'
import { ToastProvider } from './components/ToastProvider'
import { ConfigProvider } from './contexts/ConfigContext'

initSentry();
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ConfigProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ConfigProvider>
    </HelmetProvider>
  </StrictMode>,
)
