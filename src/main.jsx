import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AppProviders } from './app/providers/AppProviders.jsx'

// Lazy: el sandbox importa el cliente de Supabase, que revienta si faltan
// VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY. Con import estatico, ese error
// tumbaba TODA la app (incluida la de Sheets) aunque nadie usara ?supabase=1.
const SupabaseSandbox = lazy(() => import('./features/supabaseTest/SupabaseSandbox.jsx'))

// ?supabase=1 aisla la Fase M2 (migracion a Supabase) del flujo de produccion
// contra Sheets: no toca AppProviders/App mientras se valida la migracion.
const isSupabaseSandbox = new URLSearchParams(window.location.search).has('supabase')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isSupabaseSandbox ? (
      <Suspense fallback={null}>
        <SupabaseSandbox />
      </Suspense>
    ) : (
      <AppProviders>
        <App />
      </AppProviders>
    )}
  </StrictMode>,
)
