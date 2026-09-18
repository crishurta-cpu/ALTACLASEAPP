import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AppProviders } from './app/providers/AppProviders.jsx'
import SupabaseSandbox from './features/supabaseTest/SupabaseSandbox.jsx'

// ?supabase=1 aisla la Fase M2 (migracion a Supabase) del flujo de produccion
// contra Sheets: no toca AppProviders/App mientras se valida la migracion.
const isSupabaseSandbox = new URLSearchParams(window.location.search).has('supabase')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isSupabaseSandbox ? (
      <SupabaseSandbox />
    ) : (
      <AppProviders>
        <App />
      </AppProviders>
    )}
  </StrictMode>,
)
