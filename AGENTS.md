# AGENTS.md — ALTACLASE BODEGA
> Archivo de contexto para sesiones de IA. Leer completo antes de cualquier modificación.
> Última actualización: julio 2026

---

## 1. IDENTIDAD DEL PROYECTO

**App:** Altaclase Bodega PWA  
**Propietario:** Cristhian Hurtado (crishurta-cpu)  
**Repo:** `github.com/crishurta-cpu/ALTACLASEAPP.git`  
**Live:** `altaclaseapp.vercel.app`  
**Negocio:** Distribución B2B de zapatillas réplica, solo revendedores, sin inventario fijo, operador único, canal WhatsApp Business.

---

## 2. STACK TÉCNICO

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite, **un solo archivo `src/App.jsx`** |
| Build/Deploy | Vite → Vercel (auto-deploy en push a main) |
| Backend | Google Apps Script (135 líneas, URL pública fija) |
| Base de datos | Google Sheets (8 hojas, Sheet ID en AppsScript.gs) |
| Estilos | CSS-in-JS inline, sin librerías UI externas |
| Gráficos | SVG puro generado en componentes (sin recharts, sin chart.js) |
| Deps npm | Solo react, react-dom, vite, @vitejs/plugin-react |

**Sin:** React Router, Redux, Axios, Tailwind, ningún ORM, ningún servidor propio.

---

## 3. ARCHIVOS CLAVE

```
src/App.jsx          — TODO el frontend (~2.600 líneas)
AppsScript.gs        — TODO el backend (135 líneas)
index.html           — PWA shell con meta tags iOS
public/manifest.json — PWA manifest
```

---

## 4. ARQUITECTURA DEL FRONTEND (App.jsx)

### 4.1 Orden de definición (top → bottom)

```
CONSTANTES GLOBALES (API, claves, DS, K, CCAT, TIPOS, CONCS)
CLIENTES_ESPECIALES / NO_SON_CLIENTES
FUNCIONES API (callApi, fetchSheet, appendRow, updateRow, deleteRow)
PARSERS (parseIngresos, parseGastos, parseInventario, parseClientesResumen,
         parseClientesEspeciales, parseDeudaPersonal)
TOROW (ingresoToRow, gastoToRow, inventarioToRow, deudaPersonalToRow)
ÁTOMOS UI (Card, Divider, Pill, Btn, ChipGroup, FInput)
GRÁFICOS (GraficoPuntos, GraficoCircular)
REPORTE MES (ReporteBtn)
HOME
AUTOCOMPLETE INPUT
FORMULARIOS (NuevoMovimiento, IngresoBloqueForm, IngresoForm, GastoForm)
EDITORES (EditIngreso, EditGasto)
HISTORIAL
ABONO MODAL / MARCAR PAGADO / SWIPEABLE VENTA
CLIENTES (Clientes, CliEntesTab)
ANÁLISIS IA (AnalisisIA)
CONFIGURACIÓN
DEUDA FACTURA / REPORTE CLIENTE BTN
BÚSQUEDA GLOBAL
INVENTARIO / INVENTARIO FORM
PERSONAL / DEUDA PERSONAL FORM
WRAPPERS (CliEntesTab, HistorialTab, Mas)
LOGIN SCREEN
APP (raíz — estado global, loadData, saves, return con layout)
```

### 4.2 Estado global (en función `App`)

```js
db: { ingresos[], gastos[], inventario[], clientesResumen[],
      clientesEspeciales[], deudaPersonal[] }
tab          // "home" | "clientes" | "historial" | "mas"
showNuevo    // boolean — modal FAB
editIng      // objeto ingreso o null
editGas      // objeto gasto o null
toast        // { msg, col } o null
loading      // boolean
autenticado  // boolean (localStorage LS_AUTH_KEY)
lastSync     // Date
```

### 4.3 Flujo de datos

```
App.loadData() → fetchSheet(x6) → parsers → setDb()
  ↳ auto cada 2 min + visibilitychange
  ↳ NO bloquea UI (background)

saveIngreso(row) → optimistic update setDb → appendRow → loadData(silencioso)
saveGasto(row)   → igual
updateIngreso    → updateRow → loadData → flash
marcarPagado     → updateRow(INGRESOS, _row, {debe:"NO"|"SI"}) → loadData
registrarAbono   → updateCell(CLIENTES, col F, monto) → loadData
```

### 4.4 Layout responsive

```css
/* Mobile: max 430px centrado, nav bottom fijo */
/* Desktop ≥768px: sidebar izq 220px fijo, sin nav bottom */
/* Clases CSS: ac-sidebar, ac-main-inner, ac-nav, ac-fab, ac-desktop-2col */
/* Definidas con <style> tag en el return de App */
```

---

## 5. DESIGN SYSTEM (DS y K)

### Paleta K (colores base)
```js
bg:"#0D0D12"    // fondo raíz
card:"#1C1C1E"  // tarjeta nivel 1
card2:"#2C2C2E" // tarjeta nivel 2
card3:"#3A3A3C" // inputs
gold: getAccentColor()  // dinámico — localStorage ACCENT_KEY
green:"#30D158" // solo ganancia positiva y éxito
red:"#FF453A"   // deuda y alertas
blue:"#0A84FF"
muted:"#8E8E93"
text:"#F2F2F7"
border:"rgba(255,255,255,.07)"
```

### Sistema DS
```js
DS.r = { sm:10, md:16, lg:20, xl:24, xxl:28 }
DS.shadow.sm / .md / .lg / .glow(color)
DS.glass = "rgba(28,28,35,.85)"
```

### Color de acento
- Configurable por el usuario desde Configuración
- Se guarda en `localStorage("altaclase_accent")`
- 8 opciones: gold, blue, green, purple, orange, teal, rose, white
- `K.gold` es un getter que llama `getAccentColor()` en tiempo real

---

## 6. BASE DE DATOS — GOOGLE SHEETS

**Sheet ID:** `1XpYPiKbU1r57K1mtTEUOaGhRXEqaxYgztQZsnlv9wcs`

### Hojas y columnas

| Hoja | Columnas clave | Escritura |
|------|---------------|-----------|
| INGRESOS | A:fecha, B:tipo, C:producto, D:cliente, E:proveedor, F:costo, G:precioVenta, H:debe, I:ganancia, J:margen | append, update(_row), delete(_row) |
| GASTOS | A:fecha, B:concepto, C:costo, D:referencia | append, update, delete |
| CLIENTES | A:cliente, B:totalVenta, C:totalIngresos, D:saldo, E:debe, **F:abonos**, G:deudaTotal, H:ganancia | Solo col F via `updateCell` |
| CLIENTES ESPECIALES | A:cliente, B:clienteLimpio, C:saldoInicial, D:recargas, E:compras, F:comisiones, G:saldo, H:debe | Solo lectura |
| INVENTARIO | A:fecha, B:producto, C:proveedor, D:costo | append, update, delete |
| DEUDA VALEN | A:fecha, B:movimiento, C:presto, D:pago, E:saldo | append, update, delete |
| RESUMEN MENSUAL | Solo lectura — fórmulas de Sheets | — |
| REPORTE CLIENTE | No usada actualmente | — |

**CRÍTICO — columna F de CLIENTES:**  
Las filas se reordenan solas por fórmulas `UNIQUE/FILTER/SORT`. Nunca usar `updateRow` en CLIENTES. Siempre usar `updateCell(lookupValue=NOMBRE, col=F, value=monto)` que busca por nombre.

**CRÍTICO — `_row`:**  
Cada objeto parseado tiene `_row` = número de fila real en Sheets. Se usa en `updateRow` y `deleteRow`. No inventarlo ni calcularlo.

---

## 7. REGLAS DE NEGOCIO CRÍTICAS

### 7.1 Clientes especiales (Bayron, Marco, Marcos)
```js
const CLIENTES_ESPECIALES = ["BAYRON", "MARCO", "MARCOS"];

// Para totales Home (ventas, ganancia, utilidad):
cuentaParaTotales(ing) → excluye especiales EXCEPTO si tipo === "VENTA" o "COMISION"

// Para lista de Clientes:
cuentaParaListaClientes(ing) → excluye NO_SON_CLIENTES y aplica regla especiales
```

**NO mezclar estas dos funciones.** Tienen propósitos distintos.

### 7.2 Deuda real
```
DEUDA TOTAL (col G) = SALDO bruto (col D) - ABONOS (col F)
```
La app siempre muestra `deudaTotal` para lo que el cliente debe realmente.  
`debenMap` calcula: `neto = c.deudaTotal ?? Math.max(0, c.saldo - c.abonos)`.

### 7.3 Normalización de texto
Todo campo de texto al guardar: `.toUpperCase().trim()`  
Aplica en IngresoForm, GastoForm, IngresoBloqueForm via `const trim = s => String(s||"").toUpperCase().trim()`.

### 7.4 Semana (desde lunes)
```js
const dow = (hoy.getDay() + 6) % 7; // lunes=0 ... domingo=6
```

### 7.5 Swipe bidireccional
- ← (dx < -72px) → `onToggleDebe("NO")` → marcar pagado
- → (dx > +72px) → `onToggleDebe("SI")` → marcar debe
- tap (dx < 8px) → abrir editor

---

## 8. API — APPS SCRIPT

**URL:** `https://script.google.com/macros/s/AKfycbySGO0LtHtnT7SBEHF22TfsDUmz3kqmz3C2a-tZk6zL3_ZFuEoUF485h4QWvxq4H_S7/exec`

**Siempre GET** con query params. El row se codifica en base64 (`rowB64`) para evitar problemas con caracteres especiales.

| action | Params requeridos | Descripción |
|--------|------------------|-------------|
| read | sheet | Lee toda la hoja |
| append | sheet, rowB64 | Agrega fila al final |
| update | sheet, rowNum, rowB64 | Reemplaza fila por número |
| delete | sheet, rowNum | Borra fila por número |
| updateCell | sheet, lookupValue, col, value | Busca por nombre en col A, escribe en col indicada |

**CRÍTICO:** Después de editar AppsScript.gs, hay que republicar manualmente en Google ("Administrar implementaciones > Editar > Nueva versión"). Sin esto el cambio no aplica y la URL sigue ejecutando la versión vieja → error "Acción no soportada".

---

## 9. AUTENTICACIÓN Y SESIÓN

```js
CLAVE_ACCESO = "ClaudeAlta"          // hardcoded en JS
LS_AUTH_KEY  = "altaclase_auth_ok"   // localStorage
INACTIVITY_MS = 3 * 60 * 1000        // 3 minutos → cierra sesión
```

- Al cerrar el navegador (`beforeunload`) se borra el flag.
- No hay JWT, cookies, ni backend de auth.
- Un solo usuario. La clave es visible en el bundle JS — aceptable para uso personal.

---

## 10. NAVEGACIÓN (tabs)

```js
const NAV = [
  { id:"home",      label:"Inicio"   },
  { id:"clientes",  label:"Clientes" },
  { id:"historial", label:"Historial"},
  { id:"mas",       label:"Más"      },
];

// Dentro de Más (sub-tabs):
["buscar", "ia", "inv", "personal", "config"]
```

- Tab inicial siempre: `"home"`
- FAB (+) visible en home, clientes, historial
- Modal de nuevo registro: Ingreso / Lote / Gasto

---

## 11. PAGINACIÓN

- Clientes: `PORPAGINA = 10`
- Historial por mes: 10 por página, estado `pagH` local por IIFE
- Sin paginación en: inventario, deuda personal, búsqueda global

---

## 12. ERRORES CONOCIDOS Y SOLUCIONES

| Error | Causa | Solución |
|-------|-------|----------|
| "Acción no soportada: updateCell" | AppsScript no republicado | Publicar nueva versión en Google |
| Duplicados al guardar | Doble tap antes de que responda | `appendRow` usa dedup flag `_inflight` |
| Lentitud post-guardado | `loadData` recarga 6 hojas | Actualizado a optimistic update + recarga silenciosa |
| Ancho roto en iPhone | `window.innerWidth` frágil | Reemplazado por CSS `@media` con classNames |
| ALEJANDRA duplicada | Espacio al final del nombre | `deudaPorCliente` usa OR para debe, SUM para saldo |
| Fila incorrecta en CLIENTES | Fórmulas reordenan filas | `updateCell` busca por nombre, no por `_row` |

---

## 13. COMPONENTES — REFERENCIA RÁPIDA

| Componente | Props clave | Notas |
|-----------|-------------|-------|
| `Home` | db, onRefresh, loading, lastSync | Dashboard mensual completo |
| `Clientes` | db, onEditIngreso, onMarcarPagado, onRegistrarAbono | Lista + detalle + swipe + factura |
| `Historial` | db, onEditIngreso, onEditGasto | Accordion por mes, dropdowns categ/orden |
| `AnalisisIA` | db | Claude API con contexto del negocio |
| `DeudaFactura` | cliente, ventasDeudoras[], abonos=0 | Siempre usa ventas totales (no filtradas) |
| `ReporteClienteBtn` | cliente, ventasDeudoras[], abonos=0 | Solo visible si hay deuda |
| `SwipeableVenta` | v, debe, onEdit, onToggleDebe(estado), isLast | estado = "SI" o "NO" |
| `NuevoMovimiento` | onSaveIngreso, onSaveGasto, clientes[] | 3 modos: Ingreso / Lote / Gasto |
| `AbonoModal` | cliente, abonosActuales, onClose, onRegistrar | Escribe en col F de CLIENTES |
| `Configuracion` | — | Selector de acento, info, cerrar sesión |
| `BusquedaGlobal` | db, onEditIngreso, onEditGasto | Mínimo 2 chars para buscar |
| `GraficoPuntos` | datos[{fecha,total,n}] | SVG puro, escala automática desde 0 |
| `GraficoCircular` | datos[[cat,val]], colores[], total | SVG puro pie chart |

---

## 14. SINCRONIZACIÓN

```js
SYNC_INTERVAL_MS = 120_000  // 2 minutos
```
- Auto-sync por intervalo + `visibilitychange`
- Solo si `autenticado === true`
- `loadData(silent=true)` → no muestra toast
- `loadData(silent=false)` → muestra "✓ N ingresos · M gastos"

---

## 15. REGLAS PARA MODIFICAR CÓDIGO

1. **Nunca romper** `cuentaParaTotales` ni `cuentaParaListaClientes`.
2. **Nunca usar `updateRow` en CLIENTES** — siempre `updateCell`.
3. **`_row` viene del parser** — no calcularlo manualmente.
4. **Todo texto al guardar** → `.toUpperCase().trim()`.
5. **Swipe**: `onToggleDebe` recibe `"SI"` o `"NO"` explícito, no toggle ciego.
6. **Después de editar AppsScript.gs** → siempre recordar al usuario que debe republicar.
7. **Build antes de entregar**: `npm run build` debe terminar sin errores.
8. **Optimistic updates**: `saveIngreso/saveGasto` actualizan `db` local antes de esperar Sheets.
9. **No añadir npm packages** sin necesidad — el proyecto no tiene dependencias de UI.
10. **Layout responsive**: usar las clases CSS `ac-*` definidas en el `<style>` del return de App. No usar `window.innerWidth` en render.

---

## 16. CÓMO INICIAR UNA SESIÓN DE CÓDIGO

Al inicio de cada sesión, yo (Claude) debo:

1. Leer este archivo (`AGENTS.md`) — contexto completo en ~1 min.
2. Leer el `App.jsx` actual desde el repo o el último output.
3. Confirmar el estado actual antes de modificar.
4. Hacer backup mental del bloque a modificar antes de reemplazarlo.
5. Hacer build de verificación (`npm run build`) antes de entregar.

**Para que funcione:** mantén este archivo actualizado en el repo junto con `App.jsx`.

---

## 17. DEPLOY

```bash
# Workflow estándar
cd ~/Downloads/altaclase-web
git add .
git commit -m "descripcion del cambio"
git push
# Vercel detecta el push y despliega automáticamente en ~1 min
```

**Vercel:** conectado al repo de GitHub, rama `main`, comando build `vite build`, directorio `dist`.

---

*Fin del AGENTS.md — mantener sincronizado con cada cambio relevante al proyecto.*
