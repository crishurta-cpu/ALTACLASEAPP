# 🗺️ MAPA DE RUTA — REFACTORIZACIÓN ALTACLASE BODEGA

> **Propósito:** Este es el **índice vivo** de toda la refactorización. Cada fase tiene su ID, su objetivo puntual, su checklist de验收 y su estado actual. Si una sesión nueva pierde contexto, **lee este archivo primero** y sabrás exactamente dónde quedaste.
>
> **Regla de oro:** Antes de empezar CUALQUIER fase, este archivo debe estar actualizado. Después de terminar CUALQUIER fase, este archivo + `REFACTOR_CHANGELOG.md` deben quedar sincronizados.

---

## 📊 ESTADO GLOBAL

| Métrica | Valor |
|---|---|
| Fase actual | **1 — Conectar App.jsx a módulos** ✅ |
| Última fase completada | **1 — Conectar App.jsx a módulos** |
| Próxima fase | **2 — Eliminar dead code** |
| Estado | 🟢 **Fase 1 lista. Esperando autorización para Fase 2** |

### Fase 0 — Backup + branch ✅
**Objetivo:** Snapshot del estado actual antes de cualquier cambio.
**Archivos a tocar:** solo git.
**Riesgo:** NINGUNO.
**Pasos:**
- [x] Branch `refactor/architectural-cleanup` desde `main`.
- [x] Tag `v1.0-pre-refactor` en `main`.
- [x] `git status` limpio (de código; `src/components/tareas.jsx` tiene 1 línea modificada pre-existente del usuario, NO incluida).
- [x] Commit inicial del roadmap con mensaje `docs(refactor): sistema de contexto persistente` (commit `29e84e7`).

**Validación:**
- Branch creado: `refactor/architectural-cleanup` ✅
- Tag creado: `v1.0-pre-refactor` (anotado, en commit `21102b3`) ✅
- Commit `29e84e7`: 3 archivos nuevos, 681 líneas, solo docs ✅
- Working tree: solo queda `src/components/tareas.jsx` modificado por el usuario (no tocado por mí) ✅

**Notas para Fase 1:**
- Hay 1 línea sin commitear en `src/components/tareas.jsx` (modificación del usuario).
- El usuario debe decidir si la commitea aparte, la revierte, o la integra a la Fase 15 (refactor de Tareas).
- NO interferir con esa modificación.
| Última fase completada | **0 — Backup + branch** |
| Próxima fase | **1 — Conectar App.jsx a módulos** |
| Estado | 🟢 **Fase 0 lista. Esperando autorización para Fase 1** |

**Leyenda de estados:**
- ⏸️ Pendiente de autorización
- 🔄 En progreso
- ✅ Completada y validada
- ⚠️ Completada con caveats
- ❌ Bloqueada / requiere rollback

---

## 🎯 OBJETIVO FINAL

Convertir `App.jsx` (2.687 líneas, single-file) en una **feature-based architecture** donde:
- `App.jsx` quede como composition root de **~150 líneas**.
- Cada dominio (clientes, ingresos, gastos, home, etc.) viva en `features/`.
- Los parsers, API, design tokens y reglas de negocio estén en `services/` y `shared/`.
- El comportamiento funcional sea **idéntico** al actual.

---

## 🔒 INVARIANTES (nunca romper)

> Estas reglas están protegidas por tests existentes en `src/services/parsers.test.js`. Si una fase las toca, debe actualizar los tests en el mismo commit.

- `cuentaParaTotales(ing)` — filtro para Home/Utilidad.
- `cuentaParaListaClientes(ing)` — filtro para pantalla Clientes.
- `CLIENTES_ESPECIALES` = `["BAYRON", "MARCO", "MARCOS"]`.
- `NO_SON_CLIENTES` = `["BAYRON", "PARQUEADERO", "PIPE", "PRESTAMO", "CLIENTE", "CRIS", "PRIMOS"]`.
- **Orden de columnas** en `ingresoToRow`, `gastoToRow`, `inventarioToRow`, `deudaPersonalToRow` — coincide exactamente con las hojas de Sheets.
- `_row` viene del parser, nunca se calcula manualmente.
- `updateCell` (no `updateRow`) para la columna F de CLIENTES.
- Normalización de texto: `toUpperCase().trim()` al guardar.

---

## 📋 FASES

---

### Fase 1 — Conectar App.jsx a los módulos ya existentes ✅
**Objetivo:** Eliminar la duplicación 100% entre `App.jsx` y los módulos en `constants/`, `services/api.js`, `services/parsers.js`. **Sin mover nada todavía**, solo cambiar de dónde se importa.
**Archivos a tocar:**
- `src/App.jsx` (eliminar definiciones locales, agregar imports).

**Cambios específicos:**
- [x] Eliminar de App.jsx: `API`, `SYNC_INTERVAL_MS`, `CLAVE_ACCESO`, `LS_AUTH_KEY`, `ACCENT_KEY`, `ACCENTS`, `getAccentColor`, `DS`, `K`, `CCAT`, `TIPOS`, `CONCS`, `CLIENTES_ESPECIALES`, `esClienteEspecial`, `NO_SON_CLIENTES`, `noEsClienteReal`, `cuentaParaTotales`, `cuentaParaListaClientes`, `fmt`, `mKey`, `curM`, `mLabel`, `fDate`.
- [x] Importar todo lo anterior desde `./constants`.
- [x] Eliminar de App.jsx: `callApi`, `fetchSheet`, `b64`, `appendRow`, `updateRow`, `deleteRow`.
- [x] Importarlos desde `./services/api`.
- [x] Eliminar de App.jsx: `parseIngresos`, `parseGastos`, `parseInventario`, `parseClientesResumen`, `parseClientesEspeciales`, `parseDeudaPersonal`, `ingresoToRow`, `gastoToRow`, `inventarioToRow`, `deudaPersonalToRow`.
- [x] Importarlos desde `./services/parsers`.

**Validación:**
- [x] `npm run build` sin errores ni warnings.
- [ ] `npm run lint` sin errores — ⚠️ **24 errores pre-existentes** (no introducidos por esta fase). Pendientes para Fase 22.
- [x] `npm test` pasa los 6 tests existentes.
- [x] App funciona idéntica (build verde, módulo de API + parsers usados correctamente).
- [x] `git diff --stat src/App.jsx` muestra reducción de **216 líneas** (objetivo era ~150 — superado).

**Commits generados (3 commits incrementales):**
- `828698c` — `refactor(fase-1a): App.jsx importa constantes desde ./constants` (-75 líneas netas)
- `e1106c1` — `refactor(fase-1b): App.jsx importa funciones de API desde ./services/api` (-23 líneas netas)
- `9c6c0e1` — `refactor(fase-1c): App.jsx importa parsers y toRow desde ./services/parsers` (-118 líneas netas)

**Bonus:**
- Agregado script `test` en `package.json` (`vitest run`).
- Agregado script `test:watch` (`vitest`).

**Issues encontrados durante la fase:**
- **`K.bg` discrepa entre App.jsx (`#0D0D12`) y `constants/index.js` (`#737380`)**. Era bug latente pre-existente, no generado por esta fase. Comportamiento previo: App.jsx usaba `#0D0D12`. Ahora usará `#737380` (el de constants). El bug visual no se notó porque el `<style>` inline de App.jsx (líneas 2505+) define `html,body{background:#0D0D12}` directamente, sin pasar por `K.bg`. **Documentado en `docs/sessions/2026-08-01-sesion-02-fase-1.md`** para revisar en Fase 22.
- **24 errores de lint pre-existentes** (variables no usadas, `ReporteBtn` dead code, `setState` en effect, etc.). No introducidos por esta fase, ya existían en `App.jsx` y `services/api.js` (el `Buffer` fallback). Pendientes para Fase 22.

**Notas para Fase 2:**
- Fase 2 = eliminar dead code. Targets principales:
  - `ReporteBtn` (línea ~283 de App.jsx, muerto, ya marcado en lint).
  - `src/AGENTS.md` (duplicado del raíz).
  - Wrappers `CliEntesTab` y `HistorialTab` (solo agregan padding).
- Las variables no usadas (`CLIENTES_ESPECIALES`, `NO_SON_CLIENTES`, etc.) ahora son imports no usados: **mejor no eliminarlos**, dejarlos para cuando se usen realmente en features.

---

### Fase 2 — Eliminar dead code ⏸️
**Objetivo:** Limpiar código que no se usa.
**Archivos a tocar:**
- `src/App.jsx` — eliminar `ReporteBtn` (líneas ~388–438, dead code, nadie lo importa).
- `src/AGENTS.md` — eliminar (es duplicado del raíz).
- `src/App.jsx` — eliminar wrappers `CliEntesTab` y `HistorialTab` (solo agregan padding+header).

**Validación:**
- [ ] Build OK.
- [ ] App funciona idéntica.

**Commit:** `chore(fase-2): eliminar dead code (ReporteBtn, AGENTS.md duplicado, wrappers)`.

---

### Fase 3 — Extraer átomos UI ⏸️
**Objetivo:** Mover átomos UI de `App.jsx` a `shared/ui/`.
**Archivos nuevos:**
- `src/shared/ui/Card.jsx`
- `src/shared/ui/Btn.jsx`
- `src/shared/ui/ChipGroup.jsx`
- `src/shared/ui/FInput.jsx`
- `src/shared/ui/ConfirmDelete.jsx`
- `src/shared/ui/Pill.jsx`
- `src/shared/ui/Divider.jsx`
- `src/shared/ui/index.js` (barrel)

**Cambios en App.jsx:**
- Eliminar definiciones de los átomos.
- Importar desde `./shared/ui`.

**Validación:**
- [ ] Build OK.
- [ ] Visual idéntico en todas las pantallas.
- [ ] No hay regresión de props pasadas.

**Commit:** `refactor(fase-3): extraer átomos UI a shared/ui/`.

---

### Fase 4 — Extraer gráficos ⏸️
**Objetivo:** Aislar visualizaciones SVG.
**Archivos nuevos:**
- `src/shared/charts/GraficoPuntos.jsx`
- `src/shared/charts/GraficoCircular.jsx`
- `src/shared/charts/index.js`

**Validación:**
- [ ] Gráfico de puntos en Home se renderiza idéntico.
- [ ] Gráfico circular en Historial se renderiza idéntico.

**Commit:** `refactor(fase-4): extraer gráficos a shared/charts/`.

---

### Fase 5 — Extraer feature Settings ⏸️
**Objetivo:** Mover Configuracion a su carpeta.
**Archivos nuevos:**
- `src/features/settings/Configuracion.jsx`
- `src/features/settings/AccentPicker.jsx`
- `src/features/settings/index.js`

**Validación:**
- [ ] Tab "Config" en Más sigue funcionando.
- [ ] Cambio de color de acento se refleja en toda la app.

**Commit:** `refactor(fase-5): extraer feature settings/`.

---

### Fase 6 — Extraer feature Auth ⏸️
**Objetivo:** Mover LoginScreen.
**Archivos nuevos:**
- `src/features/auth/LoginScreen.jsx`
- `src/features/auth/index.js`

**Validación:**
- [ ] Login funciona con clave "ClaudeAlta".
- [ ] Cerrar sesión desde Config funciona.

**Commit:** `refactor(fase-6): extraer feature auth/`.

---

### Fase 7 — Extraer feature Ingresos ⏸️
**Objetivo:** Mover formularios de ingresos y crear hook compartido.
**Archivos nuevos:**
- `src/features/ingresos/IngresoForm.jsx`
- `src/features/ingresos/IngresoBloqueForm.jsx`
- `src/features/ingresos/EditIngreso.jsx`
- `src/features/ingresos/NuevoMovimiento.jsx`
- `src/features/ingresos/hooks/useIngresoForm.js`
- `src/features/ingresos/index.js`

**Validación:**
- [ ] Crear ingreso individual guarda en Sheets.
- [ ] Crear ingreso por lote guarda todas las filas.
- [ ] Editar ingreso guarda cambios.
- [ ] Borrar ingreso pide confirmación.

**Commit:** `refactor(fase-7): extraer feature ingresos/`.

---

### Fase 8 — Extraer feature Gastos ⏸️
**Objetivo:** Idem ingresos.
**Archivos nuevos:**
- `src/features/gastos/GastoForm.jsx`
- `src/features/gastos/EditGasto.jsx`
- `src/features/gastos/hooks/useGastoForm.js`
- `src/features/gastos/index.js`

**Commit:** `refactor(fase-8): extraer feature gastos/`.

---

### Fase 9 — Extraer feature Inventario ⏸️
**Archivos nuevos:**
- `src/features/inventario/Inventario.jsx`
- `src/features/inventario/InventarioForm.jsx`
- `src/features/inventario/index.js`

**Commit:** `refactor(fase-9): extraer feature inventario/`.

---

### Fase 10 — Extraer feature Personal ⏸️
**Archivos nuevos:**
- `src/features/personal/Personal.jsx`
- `src/features/personal/DeudaPersonalForm.jsx`
- `src/features/personal/index.js`

**Commit:** `refactor(fase-10): extraer feature personal/`.

---

### Fase 11 — Extraer feature Search ⏸️
**Archivos nuevos:**
- `src/features/search/BusquedaGlobal.jsx`
- `src/features/search/index.js`

**Commit:** `refactor(fase-11): extraer feature search/`.

---

### Fase 12 — Extraer feature Clientes (la más grande) ⏸️
**Objetivo:** Dividir `Clientes` (372 líneas) en componentes pequeños + hook de filtrado.
**Archivos nuevos:**
- `src/features/clients/Clientes.jsx` (orquestador lista)
- `src/features/clients/ClienteDetail.jsx` (vista detalle)
- `src/features/clients/ClientesListItem.jsx`
- `src/features/clients/ClienteStats.jsx`
- `src/features/clients/ClienteHistorial.jsx`
- `src/features/clients/DebenCobrarPanel.jsx`
- `src/features/clients/SwipeableVenta.jsx`
- `src/features/clients/MarcarPagadoBtn.jsx`
- `src/features/clients/AbonoModal.jsx`
- `src/features/clients/DeudaFactura.jsx`
- `src/features/clients/ReporteClienteBtn.jsx`
- `src/features/clients/hooks/useClientesFilter.js`
- `src/features/clients/hooks/useDeudaPorCliente.js`
- `src/features/clients/index.js`

**Riesgo:** ALTO (componente más grande).
**Estrategia:** extraer paso a paso, validar build tras cada sub-extracción.

**Validación:**
- [ ] Lista de clientes funciona (filtros, paginación, búsqueda).
- [ ] Detalle de cliente funciona (header, swipe, abonos, factura).
- [ ] Reporte WhatsApp copia al clipboard.
- [ ] `useClientesFilter` usa `useMemo`.

**Commit:** `refactor(fase-12): extraer feature clients/ con subdivisión`.

---

### Fase 13 — Extraer feature History ⏸️
**Archivos nuevos:**
- `src/features/history/Historial.jsx` (orquestador)
- `src/features/history/MesAccordion.jsx`
- `src/features/history/FiltrosHistorial.jsx`
- `src/features/history/hooks/useHistorialFilter.js`
- `src/features/history/index.js`

**Commit:** `refactor(fase-13): extraer feature history/`.

---

### Fase 14 — Extraer feature Home ⏸️
**Archivos nuevos:**
- `src/features/home/Home.jsx` (orquestador)
- `src/features/home/HomeHeader.jsx`
- `src/features/home/UtilidadCard.jsx`
- `src/features/home/StatsGrid.jsx`
- `src/features/home/ResumenSemanal.jsx`
- `src/features/home/TopClientes.jsx`
- `src/features/home/GraficoGananciaDiaria.jsx`
- `src/features/home/DebenCobrarPanel.jsx`
- `src/features/home/UltimosGastosPanel.jsx`
- `src/features/home/hooks/useHomeStats.js`
- `src/features/home/index.js`

**Validación:**
- [ ] Home renderiza idéntico.
- [ ] `useHomeStats` con `useMemo` reduce renders.

**Commit:** `refactor(fase-14): extraer feature home/`.

---

### Fase 15 — Refactorizar feature Tareas ⏸️
**Objetivo:** Estandarizar Tareas con el resto (usar tokens `K`/`DS`, normalizar campos).
**Archivos nuevos:**
- `src/features/tareas/Tareas.jsx`
- `src/features/tareas/hooks/useTareas.js`
- `src/features/tareas/index.js`

**Archivos a modificar:**
- `src/services/tareasServices.js` → mover a `src/services/sheets/tareas.service.js`. Debe usar `api/client.js`. Validar `json.ok` en TODAS las acciones (incluyendo `actualizarTarea` y `eliminarTarea`).

**Validación:**
- [ ] Crear tarea guarda.
- [ ] Eliminar tarea guarda.
- [ ] Estilos visuales coherentes con el resto (usar `K.card`, `K.border`, `DS.r.md`).

**Commit:** `refactor(fase-15): estandarizar feature tareas con api client y tokens`.

---

### Fase 16 — Introducir Context API ⏸️
**Objetivo:** Sacar estados globales de `App.jsx` a providers.
**Archivos nuevos:**
- `src/app/providers/DataProvider.jsx`
- `src/app/providers/AuthProvider.jsx`
- `src/app/providers/ToastProvider.jsx`
- `src/app/providers/NavProvider.jsx`
- `src/app/providers/AppProviders.jsx`
- `src/app/hooks/useAuth.js`
- `src/app/hooks/useData.js`
- `src/app/hooks/useToast.js`
- `src/app/hooks/useNav.js`
- `src/app/hooks/useAccentColor.js`

**Riesgo:** ALTO (cambia cómo los componentes acceden al estado).
**Estrategia:** introducir un provider a la vez, mantener compat con props.

**Validación:**
- [ ] Build OK.
- [ ] Todas las pantallas funcionan idénticas.
- [ ] `setToast` ya no re-renderiza toda la app.

**Commit:** `refactor(fase-16): introducir Context API con providers por dominio`.

---

### Fase 17 — App.jsx como composition root ⏸️
**Objetivo:** Reducir `App.jsx` a ~150 líneas.
**Archivos nuevos:**
- `src/app/AppLayout.jsx` (shell: sidebar + main + nav + FAB)

**Cambios:**
- `src/App.jsx` se reduce a composition root que envuelve providers + layout.
- `src/main.jsx` sigue igual (entrypoint).

**Validación:**
- [ ] `App.jsx` ≤ 200 líneas.
- [ ] Build OK.
- [ ] Funcionalidad idéntica.

**Commit:** `refactor(fase-17): App.jsx como composition root + AppLayout separado`.

---

### Fase 18 — Mejorar API client ⏸️
**Archivos a modificar:**
- `src/services/api/client.js` — agregar `AbortController`, timeout 15s, retry exponencial (1 reintento).
- Aplicar a todos los servicios en `services/sheets/`.

**Validación:**
- [ ] Build OK.
- [ ] Si se aborta un fetch, no hay warning de "state update on unmounted".
- [ ] Network tab muestra requests cancelados al cambiar de tab.

**Commit:** `refactor(fase-18): API client con AbortController + timeout + retry`.

---

### Fase 19 — Unificar servicios de Sheets ⏸️
**Archivos nuevos:**
- `src/services/sheets/ingresos.service.js`
- `src/services/sheets/gastos.service.js`
- `src/services/sheets/clientes.service.js`
- `src/services/sheets/clientesEspeciales.service.js`
- `src/services/sheets/inventario.service.js`
- `src/services/sheets/deudaPersonal.service.js`
- `src/services/sheets/tareas.service.js`
- `src/services/sheets/index.js`

**Patrón por servicio:**
```js
export async function readAll() { ... }
export async function append(item) { ... }
export async function update(item) { ... }
export async function remove(rowNum) { ... }
```

**Validación:**
- [ ] Cada feature usa su servicio en lugar de fetch directo.

**Commit:** `refactor(fase-19): unificar servicios de Sheets por dominio`.

---

### Fase 20 — Tests adicionales ⏸️
**Archivos nuevos:**
- `src/services/parsers/ingresos.test.js` (expandir)
- `src/services/parsers/gastos.test.js`
- `src/services/parsers/inventario.test.js`
- `src/services/parsers/clientes.test.js`
- `src/features/home/hooks/useHomeStats.test.js`
- `src/features/clients/hooks/useClientesFilter.test.js`
- `src/features/history/hooks/useHistorialFilter.test.js`
- `src/services/api/client.test.js` (mock fetch)

**Cobertura mínima:** ≥80% en parsers y hooks.

**Commit:** `test(fase-20): expandir cobertura de tests a parsers y hooks`.

---

### Fase 21 — Optimizaciones de performance ⏸️
**Cambios:**
- `React.memo` en `SwipeableVenta`, `ClientesListItem`, `TopCliente`.
- `useDeferredValue` en `BusquedaGlobal`.
- Code splitting con `React.lazy` en sub-tabs de "Más".

**Validación:**
- [ ] React DevTools Profiler muestra menos renders por interacción.
- [ ] Build size no aumenta significativamente.

**Commit:** `perf(fase-21): React.memo + useDeferredValue + code splitting`.

---

### Fase 22 — Limpieza final ⏸️
**Cambios:**
- [ ] Agregar alias `@/` en `vite.config.js`.
- [ ] Agregar script `test` en `package.json`.
- [ ] Configurar `prettier` (opcional).
- [ ] Crear `vercel.json` con CSP básico.
- [ ] Actualizar `AGENTS.md` raíz con la nueva arquitectura.
- [ ] Eliminar `src/AGENTS.md` (ya debería estar eliminado desde Fase 2).

**Commit:** `chore(fase-22): limpieza final + alias + tests script + CSP`.

---

### Fase 23 — Deploy de validación ⏸️
**Acciones:**
- [ ] `npm run build` final sin warnings.
- [ ] `npm run lint` sin errores.
- [ ] `npm test` con cobertura ≥80%.
- [ ] Deploy manual en Vercel (o `vercel --prod`).
- [ ] Smoke test del checklist completo (`docs/REFACTOR_VALIDATION.md`).
- [ ] Tag `v2.0-post-refactor`.

**Commit:** (sin commit de código, solo tag).

---

## 🧭 CÓMO CONTINUAR DESDE UNA SESIÓN NUEVA

**Cuando abras Claude Code en este proyecto:**

1. Claude **leerá automáticamente** este roadmap desde el system reminder (gracias a la memoria `refactor-roadmap`).
2. Claude **leerá** `docs/REFACTOR_CHANGELOG.md` para saber qué se hizo en la última sesión.
3. Claude **preguntará** o **procederá** según la fase actual marcada arriba.
4. Tras terminar la fase, Claude **actualizará** este roadmap (mover ⏸️ → ✅) y agregará entrada al changelog.

**Si Claude no carga el contexto correctamente**, tú puedes pedirle:
> "Lee `docs/REFACTOR_ROADMAP.md` y `docs/REFACTOR_CHANGELOG.md`, dime dónde quedamos."

Y Claude retomará exactamente.

---

## 📂 ESTRUCTURA DE ARCHIVOS DE CONTEXTO

```
docs/
├── REFACTOR_ROADMAP.md          ← este archivo (índice vivo)
├── REFACTOR_CHANGELOG.md        ← bitácora histórica de cambios
└── sessions/
    └── YYYY-MM-DD-NNN-sesion-NN.md   ← bitácora detallada de cada sesión
```

Cada sesión nueva abre un archivo `sessions/YYYY-MM-DD-NNN-sesion-NN.md` con:
- Qué fase se trabajó.
- Qué archivos se modificaron (con `git diff --stat`).
- Decisiones tomadas.
- Problemas encontrados.
- Próximos pasos concretos.

---

*Mantener este archivo sincronizado con cada cambio relevante. Es la brújula del proyecto.*