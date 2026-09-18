# AGENTS.md — ALTACLASE BODEGA
> Archivo de contexto para sesiones de IA. Leer completo antes de cualquier modificación.
> Última actualización: septiembre 2026 (post-refactor, Fase 22 — ver `docs/REFACTOR_ROADMAP.md` para el historial completo)

---

## 1. IDENTIDAD DEL PROYECTO

**App:** Altaclase Bodega PWA
**Propietario:** Cristhian Hurtado (crishurta-cpu)
**Repo:** `github.com/crishurta-cpu/ALTACLASEAPP.git`
**Live:** `altaclaseapp.vercel.app`
**Negocio:** Distribución B2B de zapatillas réplica, solo revendedores, sin inventario fijo, operador único, canal WhatsApp Business.

**Importante:** este documento describe la app **actual**, que corre contra Google Sheets. Existe un plan **futuro y separado** de migración a Supabase PostgreSQL (ver `docs/ALTACLASE_DATABASE_ARCHITECTURE.md`) que aún no ha iniciado — ese documento incluso decide eliminar `CLIENTES ESPECIALES`, lo cual **no aplica** a la app actual: aquí sigue siendo una regla de negocio real y protegida (sección 7.1).

---

## 2. STACK TÉCNICO

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite, **arquitectura por features** (`src/features/`, `src/app/`, `src/services/`) |
| Estado | Context API (`src/app/providers/`) — Auth, Data, Toast, Nav |
| Build/Deploy | Vite → Vercel (auto-deploy en push a main) |
| Backend | Google Apps Script (URL pública fija) |
| Base de datos | Google Sheets (Sheet ID en AppsScript.gs) |
| Estilos | CSS-in-JS inline, sin librerías UI externas |
| Gráficos | SVG puro generado en componentes (sin recharts, sin chart.js) |
| Tests | Vitest + `@testing-library/react` (hooks) — `npm test` / `npm run test:coverage` |
| Deps npm (runtime) | Solo `react`, `react-dom` |

**Sin:** React Router, Redux, Axios, Tailwind, ningún ORM, ningún servidor propio.

---

## 3. ARCHIVOS CLAVE

```
src/App.jsx                    — composition root (~90 líneas): auth gate, loading/error, switch de tab
src/main.jsx                   — entrypoint, envuelve <App/> en <AppProviders>
src/app/
  providers/                   — AuthProvider, DataProvider, ToastProvider, NavProvider, AppProviders
  contexts/                    — createContext(...) de cada provider (separados por Fast Refresh)
  hooks/                       — useAuth, useData, useToast, useNav, useAccentColor
  AppLayout.jsx                — shell visual: sidebar, nav inferior, FAB, modales
  NuevoMovimiento.jsx          — orquestador de tabs Ingreso/Lote/Gasto (cross-feature)
src/features/<dominio>/        — auth, home, clients, history, ingresos, gastos, inventario,
                                  personal, search, settings, tareas (cada uno con su barrel index.js)
src/services/
  api.js                       — callApi/fetchSheet/appendRow/updateRow/deleteRow (GET + rowB64)
  http.js                      — fetchConTimeout/fetchConReintento (AbortController, timeout 15s)
  parsers.js                   — parse*/*.ToRow (conversión Sheets ↔ shape de negocio)
  sheets/<dominio>.service.js  — readAll/append/update/remove por hoja, usa api.js + parsers.js
src/shared/ui/, shared/charts/ — átomos UI y gráficos SVG reutilizables
src/constants/index.js         — K (colores), DS (radios/sombras), reglas de negocio (CLIENTES_ESPECIALES, etc.)
AppsScript.gs                  — TODO el backend
index.html                     — PWA shell con meta tags iOS
public/manifest.json           — PWA manifest
docs/REFACTOR_ROADMAP.md       — historial completo del refactor (23 fases), léelo si necesitas contexto histórico
docs/ALTACLASE_DATABASE_ARCHITECTURE.md — plan FUTURO de migración a Supabase (no vigente aún)
```

---

## 4. ARQUITECTURA DEL FRONTEND

### 4.1 Flujo de una pantalla

```
main.jsx
  └─ <AppProviders>              (Auth > Toast+ToastHost > Data > Nav)
       └─ <App/>                  composition root: decide qué tab renderizar
            └─ <AppLayout>        shell (sidebar/nav/FAB/modales), lee useNav()/useData()
                 └─ <Home|Clientes|Historial|Mas>   contenido del tab activo
```

- Cualquier componente dentro del árbol de providers puede llamar `useAuth()`, `useData()`, `useToast()`, `useNav()` directo — no hay prop-drilling para eso.
- `ToastHost` (dentro de `ToastProvider`) es el único que re-renderiza cuando aparece/desaparece un toast — usa contextos separados de estado/dispatch a propósito.

### 4.2 Estado global (via Context API, no en App.jsx)

```js
// AuthProvider   → { autenticado, login, cerrarSesion }
// DataProvider   → { db, loading, initDone, initError, lastSync, clientes, proveedores,
//                    loadData, saveIngreso, saveGasto, updateIngreso, updateGasto,
//                    removeIngreso, removeGasto, addInventario, editInventario,
//                    removeInventario, addDeuda, editDeuda, removeDeuda,
//                    marcarPagado, registrarAbono }
// NavProvider    → { tab, setTab, showNuevo, setShowNuevo, editIng, setEditIng, editGas, setEditGas }
// ToastProvider  → { flash } (dispatch) — el valor del toast solo lo lee ToastHost

db: { ingresos[], gastos[], inventario[], clientesResumen[], clientesEspeciales[], deudaPersonal[] }
```

### 4.3 Flujo de datos

```
DataProvider.loadData() → Promise.allSettled([ingresosService.readAll(), gastosService.readAll(), ...])
  ↳ INGRESOS y GASTOS son críticos (si fallan, falla todo); el resto degrada a []
  ↳ auto cada 2 min (SYNC_INTERVAL_MS) + visibilitychange
  ↳ NO bloquea UI (loadData(true) = silencioso, sin toast)

saveIngreso(item) → ingresosService.append(item) [convierte con ingresoToRow] → loadData(true)
updateIngreso(item) → ingresosService.update(item) [usa item._row] → loadData(true) → flash
marcarPagado(pendientes, estado) → ingresosService.update por cada uno (secuencial) → loadData → flash
registrarAbono(cliente, monto) → clientesService.registrarAbono [updateCell col F] → loadData → flash
```

Cada servicio de dominio (`services/sheets/*.service.js`) hace su propia conversión fila↔objeto — **nunca** llames `services/api.js` directo desde un componente o desde `DataProvider`; siempre a través del servicio del dominio correspondiente.

### 4.4 Layout responsive

```css
/* Mobile: max 430px centrado, nav bottom fijo */
/* Desktop ≥768px: sidebar izq 220px fijo, sin nav bottom */
/* Clases CSS: ac-sidebar, ac-main-inner, ac-nav, ac-fab, ac-desktop-2col */
/* Definidas con <style> tag dentro de src/app/AppLayout.jsx */
```

---

## 5. DESIGN SYSTEM (DS y K) — `src/constants/index.js`

### Paleta K (colores base — valores reales actuales)
```js
bg:"#737380"     // fondo raíz
card:"#16161F"   // tarjeta nivel 1
card2:"#1E1E2A"  // tarjeta nivel 2
card3:"#252533"  // inputs
card4:"#2E2E3D"  // hover/activos
gold: getAccentColor()  // dinámico — getter, lee localStorage ACCENT_KEY
green:"#10B981"  // ganancia positiva y éxito
red:"#EF4444"    // deuda y alertas
blue:"#3B82F6"
yellow:"#F59E0B"
purple:"#8B5CF6"
orange:"#F97316"
teal:"#06B6D4"
muted:"#6B7280"
mutedLighter:"#9CA3AF"
text:"#F1F5F9"
border:"rgba(255,255,255,.07)"
```

### Sistema DS
```js
DS.r = { sm:10, md:16, lg:20, xl:24, xxl:28 }
DS.shadow.sm / .md / .lg / .xl / .glow(color)
DS.glass = "rgba(28,28,35,.85)"
```

### Color de acento
- Configurable desde `features/settings/AccentPicker.jsx` (usa el hook `useAccentColor`, `app/hooks/`).
- Se guarda en `localStorage("altaclase_accent")`, dispara evento `"accentchange"` para que otros usos del hook reaccionen sin recargar.
- 8 opciones: gold, blue, green, purple, orange, teal, rose, white.
- `K.gold` sigue siendo un getter que llama `getAccentColor()` en tiempo real — componentes que NO usan `useAccentColor()` no se re-renderizan automáticamente al cambiar el acento (ver limitación documentada en Fase 16).

---

## 6. BASE DE DATOS — GOOGLE SHEETS

**Sheet ID:** `1XpYPiKbU1r57K1mtTEUOaGhRXEqaxYgztQZsnlv9wcs`

### Hojas y columnas

| Hoja | Columnas clave | Escritura | Servicio |
|------|---------------|-----------|----------|
| INGRESOS | A:fecha, B:tipo, C:producto, D:cliente, E:proveedor, F:costo, G:precioVenta, H:debe, I:ganancia, J:margen | append, update(_row), delete(_row) | `services/sheets/ingresos.service.js` |
| GASTOS | A:fecha, B:concepto, C:costo, D:referencia | append, update, delete | `gastos.service.js` |
| CLIENTES | A:cliente, B:totalVenta, C:totalIngresos, D:saldo, E:debe, **F:abonos**, G:deudaTotal, H:ganancia | Solo col F via `updateCell` | `clientes.service.js` (solo `readAll` + `registrarAbono`) |
| CLIENTES ESPECIALES | A:cliente, B:clienteLimpio, C:saldoInicial, D:recargas, E:compras, F:comisiones, G:saldo, H:debe | Solo lectura | `clientesEspeciales.service.js` (solo `readAll`) |
| INVENTARIO | A:fecha, B:producto, C:proveedor, D:costo | append, update, delete | `inventario.service.js` |
| DEUDA VALEN | A:fecha, B:movimiento, C:presto, D:pago, E:saldo | append, update, delete | `deudaPersonal.service.js` |
| TAREAS | id, texto, completada, prioridad, categoria, fecha, usuario | append, update, delete (POST, no GET) | `tareas.service.js` |
| RESUMEN MENSUAL | Solo lectura — fórmulas de Sheets | — | no usada |
| REPORTE CLIENTE | No usada actualmente | — | — |

**CRÍTICO — columna F de CLIENTES:**
Las filas se reordenan solas por fórmulas `UNIQUE/FILTER/SORT`. Nunca usar `updateRow` en CLIENTES. Siempre usar `clientesService.registrarAbono(cliente, monto)`, que internamente hace `updateCell(lookupValue=NOMBRE, col=F, value=monto)`.

**CRÍTICO — `_row`:**
Cada objeto parseado tiene `_row` = número de fila real en Sheets. Se usa en `update`/`remove` de cada servicio. No inventarlo ni calcularlo.

---

## 7. REGLAS DE NEGOCIO CRÍTICAS

### 7.1 Clientes especiales (Bayron, Marco, Marcos)
```js
// src/constants/index.js
const CLIENTES_ESPECIALES = ["BAYRON", "MARCO", "MARCOS"];

// Para totales Home (ventas, ganancia, utilidad):
cuentaParaTotales(ing) → excluye especiales EXCEPTO si tipo === "VENTA" o "COMISION"

// Para lista de Clientes:
cuentaParaListaClientes(ing) → excluye NO_SON_CLIENTES y aplica regla especiales
```

**NO mezclar estas dos funciones.** Tienen propósitos distintos.

**Nota sobre el futuro:** en la migración a Supabase (aún no iniciada, ver `docs/ALTACLASE_DATABASE_ARCHITECTURE.md`), Bayron/Marco/Marcos dejan de tener caja propia y saldo a favor separado — pasan a ser clientes normales con "un orden especial" dentro del listado normal. **Esto no aplica a la app actual sobre Sheets.**

### 7.2 Deuda real
```
DEUDA TOTAL (col G) = SALDO bruto (col D) - ABONOS (col F)
```
La app siempre muestra `deudaTotal` para lo que el cliente debe realmente (con fallback a `saldo` si no existe). Ver `useDeudaPorCliente.js`.

### 7.3 Normalización de texto
Todo campo de texto al guardar: `.toUpperCase().trim()`
Aplica en `IngresoForm`, `GastoForm`, `IngresoBloqueForm` via `const trim = s => String(s||"").toUpperCase().trim()`.
Excepción documentada: `Inventario` NO normaliza (decisión histórica preservada, ver Fase 9).

### 7.4 Semana (desde lunes)
```js
const dow = (hoy.getDay() + 6) % 7; // lunes=0 ... domingo=6
```

### 7.5 Swipe bidireccional (`SwipeableVenta`)
- ← (dx < -72px) → `onToggleDebe(v, "NO")` → marcar pagado
- → (dx > +72px) → `onToggleDebe(v, "SI")` → marcar debe
- tap (dx < 8px) → `onEdit(v)` abre editor
- Envuelto en `React.memo` — el padre (`ClienteHistorial`) DEBE pasar callbacks con `useCallback`, o el memo no sirve de nada.

---

## 8. API — APPS SCRIPT

**URL:** `https://script.google.com/macros/s/AKfycbySGO0LtHtnT7SBEHF22TfsDUmz3kqmz3C2a-tZk6zL3_ZFuEoUF485h4QWvxq4H_S7/exec`

**GET** con query params para INGRESOS/GASTOS/CLIENTES/INVENTARIO/DEUDA VALEN. El row se codifica en base64 (`rowB64`) para evitar problemas con caracteres especiales. **POST** con `Content-Type: text/plain` para TAREAS (requisito del Apps Script de esa hoja).

| action | Params requeridos | Descripción |
|--------|------------------|-------------|
| read | sheet | Lee toda la hoja |
| append | sheet, rowB64 (o `row` en POST de tareas) | Agrega fila al final |
| update | sheet, rowNum, rowB64 (o `row` en POST) | Reemplaza fila por número |
| delete | sheet, rowNum | Borra fila por número |
| updateCell | sheet, lookupValue, col, value | Busca por nombre en col A, escribe en col indicada |

**Resiliencia (Fase 18, `src/services/http.js`):** timeout de 15s en TODAS las acciones. Reintento automático (1x, backoff 800ms) SOLO en lecturas (`action:"read"`) — nunca en escrituras, para no arriesgar duplicar una operación si el servidor sí la procesó pero la respuesta tardó más que el timeout.

**CRÍTICO:** Después de editar `AppsScript.gs`, hay que republicar manualmente en Google ("Administrar implementaciones > Editar > Nueva versión"). Sin esto el cambio no aplica y la URL sigue ejecutando la versión vieja → error "Acción no soportada".

---

## 9. AUTENTICACIÓN Y SESIÓN — `src/app/providers/AuthProvider.jsx`

```js
CLAVE_ACCESO = "ClaudeAlta"          // hardcoded, usado por LoginScreen
LS_AUTH_KEY  = "altaclase_auth_ok"   // localStorage
INACTIVITY_MS = 3 * 60 * 1000        // 3 minutos → cierra sesión
```

- Al cerrar el navegador (`beforeunload`) se borra el flag.
- Cualquier componente llama `useAuth()` para leer `autenticado` o invocar `cerrarSesion()`/`login()` — no hay prop-drilling.
- No hay JWT, cookies, ni backend de auth. Un solo usuario. La clave es visible en el bundle JS — aceptable para uso personal.

---

## 10. NAVEGACIÓN (tabs) — `src/app/AppLayout.jsx` + `src/App.jsx`

```js
const NAV = [
  { id:"home",      label:"Inicio"   },
  { id:"clientes",  label:"Clientes" },
  { id:"historial", label:"Historial"},
  { id:"mas",       label:"Más"      },
];

// Dentro de Más (sub-tabs, cargados con React.lazy — Fase 21):
["buscar", "tareas", "inv", "personal", "config"]
```

- Tab inicial siempre: `"home"` (estado en `NavProvider`).
- FAB (+) visible en home, clientes, historial → abre `NuevoMovimiento` (`src/app/NuevoMovimiento.jsx`).
- Modal de nuevo registro: Ingreso / Lote / Gasto.

---

## 11. PAGINACIÓN

- Clientes: `PORPAGINA = 10` (`useClientesFilter.js`).
- Historial por mes: 10 por página, estado `pagH` local en `ClienteHistorial`.
- Sin paginación en: inventario, deuda personal, búsqueda global, tareas.

---

## 12. ERRORES CONOCIDOS Y SOLUCIONES

| Error | Causa | Solución |
|-------|-------|----------|
| "Acción no soportada: updateCell" | AppsScript no republicado | Publicar nueva versión en Google |
| Lentitud post-guardado | `loadData` recarga 6 hojas | `loadData(true)` = silencioso, sin toast, en segundo plano |
| Ancho roto en iPhone | `window.innerWidth` frágil | CSS `@media` con classNames (`ac-*`) |
| ALEJANDRA duplicada | Espacio al final del nombre | `useDeudaPorCliente` usa OR para debe, SUM para saldo |
| Fila incorrecta en CLIENTES | Fórmulas reordenan filas | `registrarAbono` busca por nombre, no por `_row` |
| Ingreso por lote mal guardado (corregido en Fase 19) | `IngresoBloqueForm` pasaba item de negocio sin convertir, mientras `IngresoForm` pre-convertía — inconsistencia en `saveIngreso` | Los 3 formularios pasan siempre el item de negocio; la conversión vive solo en `ingresos.service.js` |
| Campo Proveedor no guarda lo escrito en "Ingreso por lote" | Typo `f.proedor` en vez de `f.proveedor` en `IngresoBloqueForm.jsx` | **Pendiente** — detectado en Fase 19, no corregido aún (ver tarea separada) |

---

## 13. COMPONENTES — REFERENCIA RÁPIDA

| Componente | Ubicación | Props clave | Notas |
|-----------|-----------|-------------|-------|
| `Home` | `features/home/Home.jsx` | db, onRefresh, loading, lastSync | Dashboard mensual, 9 sub-componentes + 5 hooks |
| `Clientes` | `features/clients/Clientes.jsx` | db, onEditIngreso, onMarcarPagado, onRegistrarAbono | Lista + detalle + swipe + factura |
| `Historial` | `features/history/Historial.jsx` | db, onEditIngreso, onEditGasto | Accordion por mes, filtros categ/orden |
| `SwipeableVenta` | `features/clients/SwipeableVenta.jsx` | v, debe, onEdit(v), onToggleDebe(v, estado), isLast | `React.memo` — requiere callbacks estables del padre |
| `ClientesListItem` | `features/clients/ClientesListItem.jsx` | nom, st, onSelect | `React.memo` |
| `TopClientes` | `features/home/TopClientes.jsx` | top5, deudaPorNombre | `React.memo`, top 5 del mes |
| `NuevoMovimiento` | `app/NuevoMovimiento.jsx` | (ninguna — lee `useData()`/`useNav()`) | 3 modos: Ingreso / Lote / Gasto |
| `AbonoModal` | `features/clients/AbonoModal.jsx` | cliente, abonosActuales, onClose, onRegistrar | Escribe en col F de CLIENTES via `registrarAbono` |
| `Configuracion` | `features/settings/Configuracion.jsx` | — | Selector de acento, info, cerrar sesión (`useAuth`) — cargado con `React.lazy` |
| `BusquedaGlobal` | `features/search/BusquedaGlobal.jsx` | db, onEditIngreso, onEditGasto | Mínimo 2 chars, `useDeferredValue` en el filtrado, `React.lazy` |
| `Tareas` | `features/tareas/Tareas.jsx` | — (lee `useTareas()`) | `React.lazy` |
| `GraficoPuntos` | `features/home/GraficoGananciaDiaria.jsx` (wrapper) / `shared/charts/` | datos[{fecha,total,n}] | SVG puro, escala automática desde 0 |
| `GraficoCircular` | `shared/charts/GraficoCircular.jsx` | datos[[cat,val]], colores[], total | SVG puro pie chart |

---

## 14. SINCRONIZACIÓN — `src/app/providers/DataProvider.jsx`

```js
SYNC_INTERVAL_MS = 120_000  // 2 minutos
```
- Auto-sync por intervalo + `visibilitychange`.
- Solo si `autenticado === true` (leído de `useAuth()`).
- `loadData(silent=true)` → no muestra toast (usado en auto-sync y después de cada mutación).
- `loadData(silent=false)` → muestra "✓ N ingresos · M gastos" (usado en login y botón "Reintentar"/sync manual).

---

## 15. REGLAS PARA MODIFICAR CÓDIGO

1. **Nunca romper** `cuentaParaTotales` ni `cuentaParaListaClientes`.
2. **Nunca usar `updateRow` en CLIENTES** — siempre `clientesService.registrarAbono`.
3. **`_row` viene del parser** — no calcularlo manualmente.
4. **Todo texto al guardar** → `.toUpperCase().trim()` (excepto Inventario, ver 7.3).
5. **Swipe**: `onToggleDebe(v, estado)` recibe el item y `"SI"`/`"NO"` explícito, no toggle ciego.
6. **Después de editar AppsScript.gs** → siempre recordar al usuario que debe republicar.
7. **Build antes de entregar**: `npm run build` debe terminar sin errores.
8. **No añadir npm packages de runtime** sin necesidad — sí está bien agregar devDependencies de testing (`@testing-library/react`, `jsdom`, `@vitest/coverage-v8`) si hace falta expandir cobertura.
9. **Layout responsive**: usar las clases CSS `ac-*` definidas en `src/app/AppLayout.jsx`. No usar `window.innerWidth` en render.
10. **Servicios de Sheets**: nunca llamar `services/api.js`/`services/parsers.js` directo desde un componente o provider — siempre a través del `*.service.js` del dominio (`services/sheets/`).
11. **Escrituras nunca reintentan automáticamente** (`services/http.js`) — solo lecturas. No agregar retry a `append`/`update`/`remove` sin pensar en duplicados.
12. **No confundir este roadmap (Sheets) con `docs/ALTACLASE_DATABASE_ARCHITECTURE.md`** (Supabase, futuro) — son dos proyectos distintos con decisiones que se contradicen en `CLIENTES ESPECIALES` (ver sección 1 y 7.1).

---

## 16. CÓMO INICIAR UNA SESIÓN DE CÓDIGO

Al inicio de cada sesión, yo (Claude) debo:

1. Leer este archivo (`AGENTS.md`) — contexto completo en ~1 min.
2. Si la tarea es continuar el refactor: leer `docs/REFACTOR_ROADMAP.md` y `docs/REFACTOR_CHANGELOG.md` para saber en qué fase se quedó.
3. Confirmar el estado actual antes de modificar (`git status`, `git log --oneline -10`).
4. Hacer build de verificación (`npm run build`) y correr tests (`npm test`) antes de entregar.

---

## 17. DEPLOY

```bash
# Workflow estándar (ajustar la ruta local a donde tengas clonado el repo)
git add .
git commit -m "descripcion del cambio"
git push
# Vercel detecta el push y despliega automáticamente en ~1 min
```

**Vercel:** conectado al repo de GitHub, rama `main`, comando build `vite build`, directorio `dist`.

---

*Fin del AGENTS.md — mantener sincronizado con cada cambio relevante al proyecto. Para el detalle fase por fase del refactor que llevó a esta arquitectura, ver `docs/REFACTOR_ROADMAP.md` y `docs/REFACTOR_CHANGELOG.md`.*
