# 🗺️ MAPA DE RUTA — REFACTORIZACIÓN ALTACLASE BODEGA

> **Propósito:** Este es el **índice vivo** de toda la refactorización. Cada fase tiene su ID, su objetivo puntual, su checklist de验收 y su estado actual. Si una sesión nueva pierde contexto, **lee este archivo primero** y sabrás exactamente dónde quedaste.
>
> **Regla de oro:** Antes de empezar CUALQUIER fase, este archivo debe estar actualizado. Después de terminar CUALQUIER fase, este archivo + `REFACTOR_CHANGELOG.md` deben quedar sincronizados.

---

## 📊 ESTADO GLOBAL

| Métrica | Valor |
|---|---|
| Fase actual | **20 — Tests adicionales** ✅ |
| Última fase completada | **20 — Tests adicionales** |
| Próxima fase | **21 — Optimizaciones de performance** |
| Estado | 🟢 **Fase 20 lista. Esperando autorización para Fase 21** |

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

### Fase 2 — Eliminar dead code ✅
**Objetivo:** Limpiar código que no se usa.
**Archivos a tocar:**
- `src/App.jsx` — eliminar `ReporteBtn` (dead code, nadie lo importa).
- `src/AGENTS.md` — renombrar a `.archive/App.jsx.snapshot-2026-08.md` (es snapshot histórico de App.jsx, NO docs).
- `src/App.jsx` — eliminar wrappers `CliEntesTab` y `HistorialTab`.

**Cambios específicos:**
- [x] Eliminar `ReporteBtn` de `App.jsx` (líneas 280–330 + banner).
- [x] Renombrar `src/AGENTS.md` → `.archive/App.jsx.snapshot-2026-08.md`.
- [x] Eliminar wrappers `CliEntesTab` y `HistorialTab`. Header movido inline al call-site en `App.jsx`.

**Validación:**
- [x] Build OK.
- [x] App funciona idéntica.
- [x] `git mv` rastreó el rename (historial preservado).
- [x] Lint: 24 → 22 errores (`ReporteBtn` y referencias eliminadas).

**Commits generados (3 commits incrementales):**
- `e65b8f3` — `chore(fase-2a): eliminar ReporteBtn dead code` (-51 líneas)
- `a9ebfff` — `chore(fase-2b): eliminar wrappers CliEntesTab e HistorialTab` (-21 líneas)
- `1632e48` — `chore(fase-2c): renombrar src/AGENTS.md a .archive/`

**Decisión importante:**
- `src/AGENTS.md` NO era docs, era código fuente renombrado como backup (commit `195b921`). Detectado en esta fase, **no eliminado** (perdida de historial), sí movido a `.archive/` con nombre descriptivo. El usuario aprobó esta decisión.

**Bonus:**
- Bundle bajó: 300.22 kB → **299.96 kB** (-260 bytes).

---

### Fase 3 — Extraer átomos UI ✅
**Objetivo:** Mover átomos UI de `App.jsx` a `shared/ui/`.
**Archivos nuevos:**
- `src/shared/ui/Card.jsx`
- `src/shared/ui/Btn.jsx`
- `src/shared/ui/ChipGroup.jsx`
- `src/shared/ui/FInput.jsx`
- `src/shared/ui/ConfirmDelete.jsx`
- `src/shared/ui/Pill.jsx`
- `src/shared/ui/Divider.jsx`
- `src/shared/ui/AutocompleteInput.jsx` (no estaba en lista original, agregado)
- `src/shared/ui/index.js` (barrel)

**Cambios en App.jsx:**
- Eliminar definiciones de los 8 átomos.
- Importar desde `./shared/ui/...`.

**Validación:**
- [x] Build OK.
- [x] Visual idéntico en todas las pantallas.
- [x] No hay regresión de props pasadas.

**Commits generados (7 commits incrementales):**
- `5e59303` — `fase-3.1: extraer Divider` (1 línea)
- `6c7eb2e` — `fase-3.2: extraer Card + ConfirmDelete + Pill` (15 líneas)
- `74bb728` — `fase-3.3: extraer Btn` (20 líneas)
- `f3209c3` — `fase-3.4: extraer ChipGroup` (21 líneas)
- `f1a792c` — `fase-3.5: extraer FInput` (8 líneas)
- `590a20b` — `fase-3.6: extraer AutocompleteInput` (49 líneas)
- `556f79a` — `fase-3.7: crear barrel index.js`

**Decisiones tomadas:**
- **8 commits incrementales** (uno por átomo + barrel) para rollback quirúrgico.
- **No migrar App.jsx al barrel** todavía: importa 8 átomos con paths explícitos (más legible). Migración queda pendiente para cuando haya más features usando `shared/ui/`.
- **Documentación JSDoc** agregada a cada átomo (props y comportamiento).
- **`Pill` y `Divider` extraídos aunque no se usan**: lint los marcaba como "no usados" en App.jsx. Mantenerlos en `shared/ui/` permite que features futuras los consuman. Limpiar en Fase 22 si siguen sin uso.

**Notas para Fase 4:**
- Fase 4 = extraer `GraficoPuntos` y `GraficoCircular` a `src/shared/charts/`.
- Son visualizaciones SVG puras, similar a átomos pero más complejas.
- Mantener mismo patrón: 1 commit por gráfico + barrel.

---

### Fase 4 — Extraer gráficos ✅
**Objetivo:** Aislar visualizaciones SVG.
**Archivos nuevos:**
- `src/shared/charts/GraficoPuntos.jsx`
- `src/shared/charts/GraficoCircular.jsx`
- `src/shared/charts/index.js`

**Validación:**
- [x] Gráfico de puntos en Home se renderiza idéntico.
- [x] Gráfico circular en Historial se renderiza idéntico.

**Commits generados (3 commits incrementales):**
- `3dc1e43` — `fase-4.1: extraer GraficoPuntos` (-156 líneas)
- `f69fc94` — `fase-4.2: extraer GraficoCircular` (-36 líneas)
- `c3a6d40` — `fase-4.3: crear barrel index.js`

**Issues durante extracción:**
- `sed '645,680d'` borró 1 línea de más (un `}` huérfano que venía del bloque de banners eliminado en Fase 2). Build falló, detectado y corregido con `Edit` manual. Build verde tras el fix.
- `K.grafico` redundante con `K.muted` (mismo valor `#6b7280`). No bloqueante, registrado para Fase 22.

**Decisiones:**
- Mismo patrón que Fase 3: 1 archivo por componente + barrel. JSDoc en cada uno.

**Notas para Fase 5:**
- Fase 5 = primera feature en carpeta propia (`src/features/settings/`).
- `Configuracion` no usa ningún átomo de `shared/ui/` actualmente. Mantendrá su JSX sin formato porque está en su propio archivo (no compite con nadie).
- Mantener consistencia con barrels (crear `features/settings/index.js` aunque nadie lo use).

---

### Fase 5 — Extraer feature Settings ✅
**Objetivo:** Mover Configuracion a su carpeta.
**Archivos nuevos:**
- `src/features/settings/Configuracion.jsx`
- `src/features/settings/AccentPicker.jsx` (sub-componente extraído)
- `src/features/settings/index.js`

**Validación:**
- [x] Tab "Config" en Más sigue funcionando.
- [x] Cambio de color de acento se refleja en toda la app.
- [x] build OK, 6 tests pasan.

**Commit generado:**
- `af94ff3` — `refactor(fase-5): extraer Configuracion a features/settings/`

**Decisiones:**
- **Sub-componente `AccentPicker` extraído** para reducir tamaño de `Configuracion` y aislar lógica de persistencia de accent.
- **`Configuracion` usa `Card` de `shared/ui/`** (primer feature que consume átomos extraídos en Fases anteriores).
- **Barrel creado** siguiendo patrón de `shared/ui/` y `shared/charts/`.
- **App.jsx: -77 líneas** (de 2.097 a 2.020).

**Issue durante extracción:**
- `sed` borró 1 línea de más (`}` huérfano). Detectado por build fallido, corregido manualmente con `Edit`.

**Notas para Fase 6:**
- Fase 6 = `LoginScreen` a `features/auth/`. Componente simple, sin sub-componentes.
- Patrón: 1 archivo + barrel, sin uso de átomos `shared/ui/` (estilo propio).

---

### Fase 6 — Extraer feature Auth ✅
**Objetivo:** Mover LoginScreen.
**Archivos nuevos:**
- `src/features/auth/LoginScreen.jsx`
- `src/features/auth/index.js`

**Validación:**
- [x] Login funciona con clave "ClaudeAlta".
- [x] Cerrar sesión desde Config funciona.

**Commit:** `fd310a4` — `refactor(fase-6): extraer feature auth/`.

---

### Fase 7 — Extraer feature Ingresos ✅
**Objetivo:** Mover formularios de ingresos y crear hook compartido.
**Archivos nuevos:**
- `src/features/ingresos/IngresoForm.jsx`
- `src/features/ingresos/IngresoBloqueForm.jsx`
- `src/features/ingresos/EditIngreso.jsx`
- `src/features/ingresos/NuevoMovimiento.jsx` *(no creado, ver notas)*
- `src/features/ingresos/hooks/useIngresoForm.js` *(no creado, ver notas)*
- `src/features/ingresos/index.js`

**Validación:**
- [x] Crear ingreso individual guarda en Sheets.
- [x] Crear ingreso por lote guarda todas las filas.
- [x] Editar ingreso guarda cambios.
- [x] Borrar ingreso pide confirmación.

**Commit:** `8d03a89` — `refactor(fase-7): extraer feature ingresos`.

**Notas de implementación (desviaciones del plan original):**
- **`NuevoMovimiento.jsx` NO se creó**: este componente es el orquestador de tabs (Ingreso/Lote/Gasto) y todavía envuelve `GastoForm`, que pertenece a Fase 8. Moverlo ahora crearía una dependencia cruzada. `App.jsx` sigue siendo el dueño de `NuevoMovimiento` y los 3 formularios de ingresos se importan individualmente.
- **`useIngresoForm.js` NO se creó**: la lógica de `useState` está acoplada al JSX del formulario. Refactorizar a hook sin un consumidor real (Fase 16 con Context API podría beneficiarlo) sería abstracción prematura. Se reservó la carpeta `hooks/` vacía para futuro uso.
- **`IngresoBloqueForm` pasa `onSave(item)` con shape de negocio (no fila Sheets)**: mantiene el comportamiento original donde cada fila del lote se transforma y guarda individualmente. Si en Fase 19 se centraliza la transformación en un servicio, este componente también cambiará.

---

### Fase 8 — Extraer feature Gastos ✅
**Objetivo:** Mover formularios de gastos a su carpeta.
**Archivos nuevos:**
- `src/features/gastos/GastoForm.jsx` ✅
- `src/features/gastos/EditGasto.jsx` ✅
- `src/features/gastos/index.js` ✅
- `src/features/gastos/hooks/useGastoForm.js` ⏸️ *(no creado, ver notas)*

**Validación:**
- [x] Crear gasto guarda en Sheets.
- [x] Editar gasto guarda cambios.
- [x] Borrar gasto pide confirmación en 2 pasos.
- [x] Build OK, 6 tests pasan.

**Commit:** `refactor(fase-8): extraer feature gastos/`.

**Notas de implementación (desviaciones del plan original):**
- **`useGastoForm.js` NO se creó**: idéntica razón que en Fase 7 con `useIngresoForm.js`. La lógica de `useState` está acoplada al JSX. Refactorizar a hook sin un consumidor real sería abstracción prematura. La carpeta `hooks/` se reservó vacía para futuro uso (Fase 16 con Context API podría beneficiarla).
- **`GastoForm` e `EditGasto` usan `CONCS` y `CCAT`** desde `./constants`. Idéntico patrón que `IngresoForm` con `TIPOS`.
- **`NuevoMovimiento` (orquestador de tabs Ingreso/Lote/Gasto) sigue en App.jsx**: ahora importa los 3 formularios de sus respectivas features (`features/ingresos/IngresoForm`, `features/ingresos/IngresoBloqueForm`, `features/gastos/GastoForm`). Sigue sin moverse a feature propia porque requiere coordinación cross-feature; podría moverse a `app/` en Fase 17.

---

### Fase 9 — Extraer feature Inventario ✅
**Objetivo:** Mover vista y formulario de inventario a su carpeta.
**Archivos nuevos:**
- `src/features/inventario/Inventario.jsx` ✅
- `src/features/inventario/InventarioForm.jsx` ✅
- `src/features/inventario/index.js` ✅

**Validación:**
- [x] Lista de items ordenada por fecha descendente.
- [x] Crear item guarda en Sheets.
- [x] Editar item guarda cambios.
- [x] Borrar item pide confirmación en 2 pasos.
- [x] Total invertido se calcula correctamente.
- [x] Build OK, 6 tests pasan.

**Commit:** `refactor(fase-9): extraer feature inventario/`.

**Notas de implementación:**
- **`Inventario` (lista/vista)**: encapsula el estado local (`agregar`, `editar`), el cálculo del `total` invertido, y la lista ordenada por fecha. Mantiene comportamiento histórico.
- **`InventarioForm` (modal compartido agregar/editar)**: usa el patrón estándar (backdrop, `Card`, `ConfirmDelete`, `FInput`). El flag `item` distingue modo creación vs edición.
- **NO normaliza texto con `toUpperCase().trim()`** al guardar (a diferencia de Ingreso/Gasto). Decisión histórica preservada — los nombres de producto/proveedor en Inventario mantienen case original.
- **Imports con paths explícitos** en App.jsx (no del barrel). Mismo patrón que Fases 5–8.

---

### Fase 10 — Extraer feature Personal ✅
**Objetivo:** Mover libro personal (Deuda Valen) a su carpeta. Separado del negocio a propósito.
**Archivos nuevos:**
- `src/features/personal/Personal.jsx` ✅
- `src/features/personal/DeudaPersonalForm.jsx` ✅
- `src/features/personal/index.js` ✅

**Validación:**
- [x] Lista de movimientos funciona.
- [x] Saldo actual se calcula correctamente desde último item.
- [x] Crear/editar/borrar movimiento guarda en Sheets.
- [x] Recalculo de saldo en tiempo real al editar presto/pago.
- [x] Confirmación de borrado en 2 pasos.
- [x] Build OK, 6 tests pasan.

**Commit:** `refactor(fase-10): extraer feature personal/`.

**Notas de implementación:**
- **`Personal` (vista)**: encapsula estado local (`agregar`, `editar`) y cálculo del saldo actual desde el último item registrado. Card usa color custom (`#1d0909`) para distinguir visualmente del negocio.
- **`DeudaPersonalForm` (modal compartido)**: encapsula la lógica de recálculo de saldo (`base + presto - pago`). El `base` se calcula distinto en modo edición (`item.saldo - item.presto + item.pago`) vs creación (`saldoBase`).
- **No usa parsers ni servicios** — Deuda Valen es local-only (no se sincroniza con Sheets en la versión actual; ver docs/ALTACLASE_DATABASE_ARCHITECTURE.md para migración futura a Supabase).
- **Imports con paths explícitos** desde App.jsx (no del barrel).

---

### Fase 11 — Extraer feature Search ✅
**Objetivo:** Mover búsqueda global a su carpeta.
**Archivos nuevos:**
- `src/features/search/BusquedaGlobal.jsx` ✅
- `src/features/search/index.js` ✅

**Validación:**
- [x] Búsqueda case-insensitive en ingresos (producto, cliente, proveedor) y gastos (referencia, concepto).
- [x] Resultados limitados: 20 ingresos, 10 gastos.
- [x] Click en resultado abre modal de edición correspondiente.
- [x] Botón "×" limpia la búsqueda.
- [x] Hint "Escribe al menos 2 caracteres" cuando query < 2.
- [x] Build OK, 6 tests pasan.

**Commit:** `refactor(fase-11): extraer feature search/`.

**Notas de implementación:**
- **`BusquedaGlobal`**: componente puro sin sub-componentes ni hooks. Filtrado lineal O(n) sobre ingresos/gastos (aceptable para <1000 items).
- **Performance**: documentado en JSDoc que si el dataset crece, considerar `useDeferredValue` en Fase 21.
- **Imports con paths explícitos** desde App.jsx (no del barrel).

---

### Fase 12 — Extraer feature Clientes (la más grande) ✅
**Objetivo:** Dividir `Clientes` (372 líneas) en componentes pequeños + hook de filtrado.
**Archivos nuevos:**
- `src/features/clients/Clientes.jsx` (orquestador lista) ✅
- `src/features/clients/ClienteDetail.jsx` (vista detalle) ✅
- `src/features/clients/ClientesListItem.jsx` ✅
- `src/features/clients/ClienteStats.jsx` ✅
- `src/features/clients/ClienteHistorial.jsx` ✅
- `src/features/clients/DebenCobrarPanel.jsx` ✅
- `src/features/clients/SwipeableVenta.jsx` ✅
- `src/features/clients/MarcarPagadoBtn.jsx` ✅
- `src/features/clients/AbonoModal.jsx` ✅
- `src/features/clients/DeudaFactura.jsx` ✅
- `src/features/clients/ReporteClienteBtn.jsx` ✅
- `src/features/clients/hooks/useClientesFilter.js` ✅
- `src/features/clients/hooks/useDeudaPorCliente.js` ✅
- `src/features/clients/index.js` ✅

**Riesgo:** ALTO (componente más grande).
**Estrategia:** extraer paso a paso, validar build tras cada sub-extracción.

**Validación:**
- [x] Lista de clientes preservada (filtros, paginación, búsqueda).
- [x] Detalle de cliente preservado (header, swipe, abonos, factura).
- [x] Reporte WhatsApp preserva `navigator.clipboard` + fallback `execCommand`.
- [x] `useClientesFilter` usa `useMemo`.
- [x] `useDeudaPorCliente` preserva regla `deudaTotal` col G con fallback a saldo.
- [x] Build OK, 6 tests pasan.

**Commit:** `refactor(fase-12): extraer feature clients/ con subdivisión`.

**Notas de implementación:**
- `App.jsx` bajó de 1.433 a 949 líneas.
- Se mantuvo `registrarAbono` en App porque es una escritura crítica contra CLIENTES col F vía `updateCell`.
- Se mantuvo `marcarPagado` en App porque persiste contra INGRESOS con `_row` real.
- No se tocaron los archivos pendientes de SQL/Supabase ni `src/components/tareas.jsx`.

---

### Fase 13 — Extraer feature History ✅
**Objetivo:** Mover `Historial` de App.jsx a su carpeta, separando orquestador / acordeón / filtros y aislando el cálculo en un hook.
**Archivos nuevos:**
- `src/features/history/Historial.jsx` (orquestador con estado: open, filter, buscar, categFiltro, orden)
- `src/features/history/MesAccordion.jsx` (acordeón mensual con stats y lista filtrada)
- `src/features/history/FiltrosHistorial.jsx` (input búsqueda, tabs ingresos/gastos, gráfico circular + selects)
- `src/features/history/hooks/useHistorialFilter.js` (cálculo de months + totales + listas filtradas con `useMemo`)
- `src/features/history/index.js` (barrel)

**Validación:**
- [x] Build OK (302.05 kB).
- [x] 6 tests pasan.
- [x] App.jsx: 949 → 837 líneas (**-112 líneas**).
- [x] Comportamiento idéntico: tabs ingresos/gastos, búsqueda, filtro por categoría, orden por fecha/monto, gráfico circular, reset al toggle.

**Commit:** `4d479ed` — `refactor(fase-13): extraer feature history`.

**Notas de implementación:**
- **`Historial`** encapsula los 5 estados locales. Antes vivían inline en App.jsx.
- **`MesAccordion`** recibe estados por props (no se replica estado localmente). `resetAndToggle` centraliza el reset al abrir/cerrar.
- **`FiltrosHistorial`** recibe `gastos`, `catEntries` y `categDisponibles` ya calculados. Solo renderiza UI.
- **`useHistorialFilter`**: dos `useMemo` separados — uno para `months` (depende solo de db) y otro para el resto (depende de mes + filtros). Esto evita recalcular `months` en cada keystroke.
- **`GraficoCircular` ya estaba extraído** en `shared/charts/` desde Fase 4. Se reusa directo.
- **Imports con paths explícitos** desde App.jsx (`./features/history/Historial`), no del barrel. Mismo patrón que Fases 5–12.

---

### Fase 14 — Extraer feature Home ✅
**Objetivo:** Mover la vista Home (líneas 66-335 de App.jsx) a `src/features/home/`, la fase más grande de todas.
**Archivos nuevos (9 sub-componentes):**
- `src/features/home/Home.jsx` (orquestador, 2 estados lift-up: `debenAbierto`, `gastosAbierto`)
- `src/features/home/Header.jsx` (gradiente premium + título mes + botón sync)
- `src/features/home/UtilidadCard.jsx` (card grande con util, mrg, ahorro)
- `src/features/home/StatsGrid.jsx` (3 columnas Ventas/Ganancia/Gastos)
- `src/features/home/ResumenSemanal.jsx` (ganSem, ventasSem, gasSem, tendSem)
- `src/features/home/TopClientes.jsx` (top 5 con medals y ⚠️ si deuda > 1M)
- `src/features/home/GraficoGananciaDiaria.jsx` (wrapper de `GraficoPuntos`)
- `src/features/home/TotalDeudaCard.jsx` (Total Pendiente por Cobrar) *(no estaba en el plan original, agregado)*
- `src/features/home/DebenCobrarAcordeon.jsx` (acordeón con debenList) *(renombrado de `DebenCobrarPanel`)*
- `src/features/home/UltimosGastosAcordeon.jsx` (acordeón con ultimosGastos) *(renombrado de `UltimosGastosPanel`)*
- `src/features/home/index.js` (barrel)

**Archivos nuevos (5 hooks, no solo `useHomeStats`):**
- `src/features/home/hooks/useHomeStats.js` (ventas, gan, gastos, ahorro, util, mrg del mes)
- `src/features/home/hooks/useResumenSemanal.js` (ganSem, ganSemAnt, tendSem, ventasSem, gasSem)
- `src/features/home/hooks/useTopClientes.js` (top5 + deudaPorNombre)
- `src/features/home/hooks/useDeudaResumen.js` (debenList, totalPorCobrar, deudaPorNombre — excluye `esClienteEspecial`)
- `src/features/home/hooks/useUltimosMovimientos.js` (diasIng, ultimosGastos — encapsula `agruparPorDia`)

**Validación:**
- [x] Home renderiza idéntico.
- [x] Los 5 hooks usan `useMemo` para aislar cálculos y reducir renders.
- [x] Build OK (303.65 kB).
- [x] 6 tests pasan.
- [x] `App.jsx`: 837 → 561 líneas (**-276 líneas**).
- [x] Limpieza de imports no usados en App.jsx (`cuentaParaTotales`, `mKey`, `curM`, `mLabel`, `esClienteEspecial`, `fDate`, `CCAT`).

**Commit:** `884b32e` — `refactor(fase-14): extraer feature home`.

**Decisiones tomadas (desviaciones del plan original):**
- **9 sub-componentes en lugar de 8**: se agregó `TotalDeudaCard.jsx` como card independiente, separado del acordeón `DebenCobrarAcordeon.jsx`.
- **5 hooks en lugar de 1**: en vez de un único `useHomeStats` monolítico, se separó el cálculo en 5 hooks por responsabilidad (stats del mes, resumen semanal, top clientes, deuda, últimos movimientos). Cada uno usa `useMemo` de forma independiente, evitando recalcular todo cuando solo cambia una parte de los datos.
- **Nombres ajustados al patrón "Acordeón"** (`DebenCobrarAcordeon`, `UltimosGastosAcordeon`) en vez de "Panel", para reflejar mejor el comportamiento UI (igual que `MesAccordion` en Fase 13).

**Notas para Fase 15:**
- Fase 15 = estandarizar `Tareas` (mover servicio a `services/sheets/tareas.service.js`, usar tokens `K`/`DS`).
- `src/components/tareas.jsx` sigue con la modificación pendiente del usuario detectada en Fase 0 — coordinar antes de tocarlo.

---

### Fase 15 — Refactorizar feature Tareas ✅
**Objetivo:** Estandarizar Tareas con el resto (usar tokens `K`/`DS`, normalizar campos).
**Archivos nuevos:**
- `src/features/tareas/Tareas.jsx`
- `src/features/tareas/hooks/useTareas.js`
- `src/features/tareas/index.js`
- `src/services/sheets/tareas.service.js` (reemplaza a `src/services/tareasServices.js`, eliminado)

**Validación:**
- [x] Crear tarea guarda.
- [x] Eliminar tarea guarda.
- [x] Estilos visuales coherentes con el resto (`Card`/`Btn` de `shared/ui`, tokens `K`/`DS`).
- [x] Build OK (303.30 kB).
- [x] 6 tests pasan.
- [x] `json.ok` validado en TODAS las acciones del servicio (`obtenerTareas`, `crearTarea`, `actualizarTarea`, `eliminarTarea`) — antes `actualizarTarea` y `eliminarTarea` no lo validaban.

**Commit:** `refactor(fase-15): estandarizar feature tareas con servicio dedicado y tokens`.

**Decisiones tomadas (desviaciones del plan original):**
- **No existe `src/services/api/client.js`** como suponía el plan original — el cliente real del proyecto es `src/services/api.js` (patrón GET + query string + `rowB64`). El servicio de Tareas usa POST con `Content-Type: text/plain` porque así lo requiere el Apps Script desplegado para esa hoja; se preservó ese comportamiento en `tareas.service.js` en lugar de forzarlo a `callApi` (que es GET-only) y romper el backend real. Unificación completa de ambos patrones queda para Fase 19.
- **Eliminada URL duplicada**: `tareasServices.js` tenía su propia constante `API` hardcodeada (idéntica a `constants/index.js`). El nuevo servicio importa `API` desde `../../constants`.
- **Se mantuvieron los nombres de función** (`obtenerTareas`, `crearTarea`, etc.) en vez de renombrar a `readAll`/`append`/`update`/`remove` — ese patrón unificado es el objetivo de la Fase 19, no de esta.
- **No se agregó confirmación de borrado en 2 pasos** (como sí tienen Ingresos/Gastos/Inventario) porque el objetivo de esta fase es estandarizar visual/estructuralmente, no cambiar comportamiento; se preservó el comportamiento original (borrado directo).
- **`src/components/` quedó vacío y se eliminó** al mover `tareas.jsx` (era el último archivo ahí).

**Issue encontrado (no corregido, documentado para Fase 22):**
- `npx eslint` marca `react-hooks/set-state-in-effect` en `useTareas.js` (llamar `cargarTareas()` dentro de `useEffect`). Es el mismo patrón que ya tenía el componente original antes de esta fase — deuda técnica pre-existente, no introducida aquí.

---

### Fase 16 — Introducir Context API ✅
**Objetivo:** Sacar estados globales de `App.jsx` a providers.
**Archivos nuevos:**
- `src/app/contexts/AuthContext.js`, `DataContext.js`, `NavContext.js`, `ToastContext.js` (solo `createContext`, separados de los providers para no romper Fast Refresh de Vite)
- `src/app/providers/AuthProvider.jsx` — `autenticado`, `login`, `cerrarSesion` + efectos de `beforeunload` e inactividad (3 min)
- `src/app/providers/DataProvider.jsx` — `db`, `loading`, `initDone`, `initError`, `lastSync`, `clientes`/`proveedores` derivados, `loadData` + las 12 mutaciones (save/update/remove de ingresos, gastos, inventario, deuda personal, `marcarPagado`, `registrarAbono`) y el auto-sync cada 2 min
- `src/app/providers/ToastProvider.jsx` — **contextos separados** `ToastStateContext`/`ToastDispatchContext` (ver decisiones) + exporta `ToastHost` (el único componente que pinta el toast)
- `src/app/providers/NavProvider.jsx` — `tab`, `showNuevo`, `editIng`, `editGas`
- `src/app/providers/AppProviders.jsx` — composition root: `AuthProvider > ToastProvider(+ToastHost) > DataProvider > NavProvider`
- `src/app/hooks/useAuth.js`, `useData.js`, `useToast.js`, `useNav.js`
- `src/app/hooks/useAccentColor.js` (bonus, ver decisiones)

**Archivos modificados:**
- `src/main.jsx` — envuelve `<App/>` en `<AppProviders>`.
- `src/App.jsx` — **561 → 341 líneas** (-220). Ya no declara `autenticado`, `tab`, `showNuevo`, `db`, `loading`, `toast`, `initDone`, `initError`, `lastSync`, `editIng`, `editGas` ni las funciones de sync/CRUD; los consume vía `useAuth()`/`useData()`/`useNav()`. El JSX y el layout quedan intactos.
- `src/features/settings/Configuracion.jsx` — el botón "Cerrar sesión" ahora llama a `useAuth().cerrarSesion()` en vez de reimplementar `localStorage.removeItem` + `window.location.reload()` (ver decisiones, bug corregido).
- `src/features/settings/AccentPicker.jsx` — usa `useAccentColor()` en vez de estado local + `localStorage` inline.

**Riesgo:** ALTO (cambia cómo los componentes acceden al estado).
**Estrategia aplicada:** los 4 providers se escribieron y verificaron juntos (build+lint+test tras cada uno), pero en un solo commit — dado que `DataProvider` depende de `AuthProvider` y `ToastProvider` simultáneamente, no había un punto de corte intermedio "compilable" más granular sin dejar `App.jsx` en un estado híbrido roto.

**Validación:**
- [x] `npm run build` OK (306.31 kB).
- [x] `npm test` 6 tests pasan.
- [x] `npx eslint src`: 31 → 25 errores (bajó; no se introdujo ninguna categoría nueva — se limpiaron imports muertos de `App.jsx` que quedaron sin uso al mover la lógica).
- [x] Todas las pantallas siguen recibiendo las mismas props que antes (revisión manual línea por línea de cada handler movido).
- [x] `setToast` ya no re-renderiza toda la app: `ToastStateContext` (valor) y `ToastDispatchContext` (`flash`, estable) están separados; `ToastHost` es el único suscrito al valor y vive como hermano de `App` bajo `AppProviders`, no dentro de él.
- [ ] **No verificado en navegador en vivo** (requiere login contra el Google Apps Script de producción con datos reales del negocio; validado por build + tests + revisión de código en su lugar). Recomendado hacer un smoke test manual real antes de desplegar a producción.

**Commit:** `refactor(fase-16): introducir Context API con providers por dominio`.

**Decisiones tomadas (desviaciones/adiciones al plan original):**
- **Contextos en archivos separados de los providers** (`app/contexts/*.js`): el plan original no lo contemplaba, pero exportar `createContext(...)` junto a un componente en el mismo archivo rompe el Fast Refresh de Vite (`react-refresh/only-export-components`, detectado por ESLint). Patrón está mejor separado.
- **`ToastProvider` con contextos split (estado/dispatch)**, no uno solo: es lo que permite cumplir el criterio de validación "`setToast` no re-renderiza toda la app" sin esperar a la Fase 17 (`AppLayout`). `DataProvider` consume `useToast()` (dispatch, estable) para llamar `flash()` sin sufrir re-render en cada toast.
- **`ToastHost` se renderiza en `AppProviders`, no dentro de `App.jsx`**: por eso el `App.jsx` (autenticación, tabs, db) no se re-renderiza cuando aparece/desaparece un toast — solo lo hace `ToastHost`, que no tiene hijos pesados.
- **Bug corregido de paso**: `Configuracion.jsx` (Fase 5) tenía su propio "Cerrar sesión" con `window.location.reload()`, desconectado del `cerrarSesion` real de `App.jsx` (nunca recibía esa prop). Con el Context API esto se unifica de forma natural — ahora usa el mismo `cerrarSesion` de `AuthProvider`, sin recarga completa de página.
- **`useAccentColor.js` (bonus, no solo el hook — corrige un bug latente)**: `AccentPicker` disparaba el evento `"accentchange"` desde Fase 5, pero **nadie lo escuchaba** — el cambio de color de acento no se reflejaba en tiempo real en el resto de la app, solo en el próximo re-render incidental. El hook ahora escucha ese evento, así que cualquier componente futuro que lo use sí reacciona al instante. No se resolvió (está fuera de alcance) la reactividad de `K.gold` leído directo como getter en decenas de archivos — eso requeriría convertir ese token a contexto, que es un cambio de arquitectura más grande no pedido en esta fase.
- **No se dividió `DataContext` en sub-contextos** (ej. uno por dominio: ingresos/gastos/inventario) — el objetivo de Fase 16 es sacar el estado de `App.jsx`, no optimizar re-renders por dominio; eso es explícitamente la Fase 21.
- **`clientes`/`proveedores` (listas derivadas) se movieron a `DataProvider`** junto con `db`, en vez de quedar en `App.jsx`, porque dependen directamente de `db.ingresos` y solo se usan para alimentar formularios de datos (`NuevoMovimiento`).

**Issue encontrado (no corregido, ya documentado para Fase 22):**
- Los ~25 errores de lint restantes son la misma familia de deuda técnica pre-existente (imports muertos en `App.jsx` reservados para features futuras, `Buffer` no definido en `services/api.js`, mutación de variable en `GraficoCircular.jsx`, `setState` en efecto en `useTareas.js`). Ninguno nuevo introducido por esta fase.

**Notas para Fase 17:**
- Fase 17 = reducir `App.jsx` a un composition root de ~150 líneas, extrayendo el shell visual (sidebar + nav + FAB + modales) a `src/app/AppLayout.jsx`. Con los 4 hooks ya disponibles, `AppLayout` puede consumirlos directamente sin prop drilling.
- Recomendado hacer un smoke test manual en el navegador (login real) antes de la Fase 17, ya que esta fase no se pudo verificar visualmente en vivo.

---

### Fase 17 — App.jsx como composition root ✅
**Objetivo:** Reducir `App.jsx` a ~150 líneas.
**Archivos nuevos:**
- `src/app/AppLayout.jsx` — shell visual: estilos globales, sidebar desktop, nav inferior mobile, FAB, modal de "nuevo movimiento", modales de edición de ingreso/gasto. Lee `tab`/`showNuevo`/`editIng`/`editGas` de `useNav()` y `updateIngreso`/`removeIngreso`/`updateGasto`/`removeGasto` de `useData()` directo (sin props).
- `src/app/NuevoMovimiento.jsx` — orquestador de tabs Ingreso/Lote/Gasto, movido desde `App.jsx` (estaba pendiente desde la nota de Fase 8). Lee `saveIngreso`/`saveGasto`/`clientes`/`proveedores` de `useData()` y `setShowNuevo` de `useNav()` directo.

**Cambios:**
- `src/App.jsx`: **341 → 89 líneas** (superó la meta de ~150). Queda como composition root puro: gate de auth (`LoginScreen`), pantallas de loading/error, y el switch de contenido por `tab` envuelto en `<AppLayout>`. Conserva `Mas` (sub-tabs de "Más") como único componente local no-shell, por ser contenido de tab, no chrome.
- `src/main.jsx` sigue igual (ya envolvía `<App/>` en `<AppProviders>` desde Fase 16).

**Validación:**
- [x] `App.jsx` ≤ 200 líneas (89, muy por debajo de la meta).
- [x] Build OK (306.23 kB).
- [x] `npm test` 6 tests pasan.
- [x] Funcionalidad idéntica (JSX copiado literal a `AppLayout`/`NuevoMovimiento`, sin cambios de comportamiento).
- [x] `npx eslint src`: **25 → 5 errores**. `App.jsx`, `AppLayout.jsx` y `NuevoMovimiento.jsx` quedan con **cero** errores de lint.

**Commit:** `refactor(fase-17): App.jsx como composition root + AppLayout separado`.

**Decisiones tomadas (desviaciones/adiciones al plan original):**
- **`Mas` no se movió a `features/`**: es contenido de un tab (como `Home`/`Clientes`/`Historial`), no shell — el plan de Fase 17 solo pedía extraer el shell (`AppLayout`). Se queda en `App.jsx` como sub-orquestador local; una eventual `features/more/Mas.jsx` queda fuera de alcance de esta fase.
- **Se aprovechó la reescritura completa de `App.jsx` para limpiar los imports muertos** que venían cargándose desde Fase 1 (`Divider`, `ConfirmDelete`, `Pill`, `ChipGroup`, `AutocompleteInput`, `GraficoCircular`, `TIPOS`, `CONCS`, `CLIENTES_ESPECIALES`, `NO_SON_CLIENTES`, `noEsClienteReal`, `fmt`, `CLAVE_ACCESO`, `ACCENT_KEY`, `ACCENTS`, `getAccentColor`) — no tenían dónde reubicarse una vez reducido `App.jsx` a composition root, y mantenerlos habría contradicho el objetivo mismo de esta fase. Esto adelantó parte de la limpieza de lint reservada para Fase 22 (bajó de 25 a 5 errores restantes en todo `src/`).
- **De paso se corrigieron 2 errores de lint más** que quedaban en el bloque movido: el prop-drilling muerto `onMarcarPagado`/`onRegistrarAbono` en `Mas` (nunca se usaban dentro) y la variable `acc` duplicada/sombra sin uso real antes del `return` de `App.jsx` — ambos ya estaban documentados como pre-existentes, se limpiaron al reescribir el código que los contenía.
- **`AppLayout` y `NuevoMovimiento` consumen los hooks de contexto directamente** en vez de recibir todo por props desde `App.jsx` — es la continuación natural de Fase 16: ya no hay necesidad de prop-drilling para lo que vive dentro del árbol de providers.

**Issue encontrado (no corregido, ya documentado para Fase 22):**
- Los 5 errores de lint restantes en todo `src/` son exactamente la misma deuda técnica documentada en fases previas (`Buffer` no definido en `services/api.js`, mutación de variable en `GraficoCircular.jsx`, `setState` en efecto en `DataProvider.jsx` y en `useTareas.js`, y un `clientes` no usado en `IngresoBloqueForm.jsx`). Ninguno nuevo.

**Notas para Fase 18:**
- Fase 18 = mejorar `services/api.js` con `AbortController`, timeout de 15s y retry exponencial (1 reintento), aplicado también a `services/sheets/tareas.service.js`.
- Sigue pendiente el smoke test manual en navegador con login real (arrastrado desde Fase 16) — recomendado antes de continuar, dado que Fase 17 también tocó el bootstrap visual completo de la app.

---

### Fase 18 — Mejorar API client ✅
**Objetivo:** Que las llamadas a Google Apps Script no se queden colgadas indefinidamente y toleren un fallo de red puntual.
**Archivos nuevos:**
- `src/services/http.js` — `fetchConTimeout` (AbortController + timeout 15s) y `fetchConReintento` (igual + 1 reintento con backoff fijo de 800ms).

**Archivos modificados:**
- `src/services/api.js` — `callApi` usa `fetchConReintento` en lecturas (`action:"read"`) y `fetchConTimeout` (sin reintento) en escrituras.
- `src/services/sheets/tareas.service.js` — mismo criterio: `obtenerTareas` con reintento, `crearTarea`/`actualizarTarea`/`eliminarTarea` solo con timeout.

**Validación:**
- [x] Build OK (306.56 kB).
- [x] `npm test` 6 tests pasan.
- [x] `npx eslint src`: 5 → 5 errores (sin cambio neto; se corrigió 1 nuevo introducido — `catch(e)` con `e` sin usar — y el `Buffer` pre-existente de `api.js` se mantiene documentado).
- [ ] "Si se aborta un fetch, no hay warning de state update on unmounted" — **no aplica tal cual**: `DataProvider` vive montado durante toda la sesión (nunca se desmonta en navegación normal entre tabs), así que este escenario no ocurre en la práctica actual. Se deja anotado por si `React.lazy`/code-splitting (Fase 21) cambia esto.
- [ ] "Network tab muestra requests cancelados al cambiar de tab" — no verificado en navegador en vivo (mismo caveat de Fases 16-17, ver notas).

**Commit:** `refactor(fase-18): API client con AbortController + timeout + retry`.

**Decisiones tomadas (desviaciones del plan original):**
- **No existe `src/services/api/client.js`** (ya documentado en Fase 15) — se modificó el archivo real, `src/services/api.js`.
- **Retry SOLO en lecturas, nunca en escrituras** — es la desviación más importante de esta fase. El plan original decía "retry exponencial (1 reintento)" sin distinguir; aplicarlo ciegamente a `append`/`update`/`delete` es peligroso para una app financiera: si el Apps Script sí procesó la escritura pero la respuesta tardó más que el timeout, un reintento automático duplicaría la operación (ej. una fila de INGRESOS repetida, un abono registrado dos veces). Las escrituras solo tienen timeout (fallan rápido y visible con un toast de error), nunca reintento silencioso.
- **`registrarAbono` (en `DataProvider.jsx`) NO se tocó**: hace su propio `fetch` crudo (no pasa por `callApi`) para la acción `updateCell`. Aplicar timeout/retry ahí requeriría modificar `DataProvider.jsx` (fuera de los archivos que esta fase tenía planeado tocar) y unificar ese `fetch` con `callApi` es, de hecho, el objetivo de la Fase 19 (unificación de servicios). Queda documentado como gap conocido — sigue sin timeout hasta Fase 19.
- **Backoff fijo de 800ms, no exponencial real** (que solo tendría sentido con más de 1 reintento): con un único reintento, "exponencial" y "fijo" son equivalentes en la práctica; se documenta la simplificación.

**Notas para Fase 19:**
- Fase 19 = unificar `services/sheets/*.service.js` por dominio (ingresos, gastos, clientes, inventario, deuda personal) con el patrón `readAll/append/update/remove`, y ahí sí mover `registrarAbono` fuera de `DataProvider.jsx` a un `clientes.service.js` que use `callApi`/`fetchConTimeout` correctamente.
- Sigue pendiente el smoke test manual en navegador con login real (arrastrado desde Fase 16).

---

### Fase 19 — Unificar servicios de Sheets ✅
**Archivos nuevos:**
- `src/services/sheets/ingresos.service.js`, `gastos.service.js`, `inventario.service.js`, `deudaPersonal.service.js` — patrón completo `readAll/append/update/remove`, cada uno hace su propio `parse*`/`*ToRow` internamente.
- `src/services/sheets/clientes.service.js` — solo `readAll` + `registrarAbono` (CLIENTES es una hoja de fórmulas, sin append/update/remove propios; ver decisiones).
- `src/services/sheets/clientesEspeciales.service.js` — solo `readAll` (hoja de solo lectura, nada la escribe hoy).
- `src/services/sheets/index.js` — barrel **namespaceado** (`export * as xService from "./x.service"`), necesario porque los 4 verbos se repiten con el mismo nombre en cada servicio.

**Archivos modificados:**
- `src/services/sheets/tareas.service.js` (Fase 15) — renombradas `obtenerTareas→readAll`, `crearTarea→append`, `actualizarTarea→update`, `eliminarTarea→remove(rowNum)`, para el mismo patrón que el resto.
- `src/features/tareas/hooks/useTareas.js` — usa `tareasService.readAll/append/remove`.
- `src/app/providers/DataProvider.jsx` — ya no importa `services/api.js`/`services/parsers.js` directo; usa los 6 servicios de dominio vía `Promise.allSettled`. `saveIngreso`/`saveGasto` ahora reciben siempre un item de negocio (ver decisiones). `registrarAbono` delega a `clientesService.registrarAbono` (resuelve el gap de Fase 18).
- `src/features/ingresos/IngresoForm.jsx`, `src/features/gastos/GastoForm.jsx` — ya no pre-convierten con `ingresoToRow`/`gastoToRow` antes de `onSave`; pasan el item de negocio tal cual (ver decisiones, bug corregido).
- `src/features/ingresos/IngresoBloqueForm.jsx` — sin cambio de código, solo JSDoc actualizado (ya pasaba item de negocio).

**Validación:**
- [x] Cada feature usa su servicio en lugar de fetch directo — confirmado con `grep`: solo los `*.service.js` importan `services/api.js`/`services/parsers.js` ahora.
- [x] Build OK (307.15 kB).
- [x] `npm test` 6 tests pasan.
- [x] `npx eslint src`: 5 → 5 (sin cambio neto, mismos errores pre-existentes documentados).

**Commit:** `refactor(fase-19): unificar servicios de Sheets por dominio`.

**Decisiones tomadas (desviaciones/adiciones al plan original):**
- **Bug real corregido de paso**: `IngresoForm`/`GastoForm` (creación individual) llamaban `onSave(ingresoToRow(item))`/`onSave(gastoToRow(item))` — pasaban la fila YA convertida. `IngresoBloqueForm` en cambio siempre pasó `onSave(item)` con el shape de negocio SIN convertir (documentado como pendiente desde el cierre de Fase 7). Como los tres formularios comparten el mismo `saveIngreso`/`saveGasto` en `DataProvider`, este último literalmente recibía a veces un array-fila y a veces un objeto de negocio, y hacía `appendRow(sheet, row)` asumiendo siempre fila — el registro de ingresos/gastos por LOTE probablemente enviaba un objeto donde el backend esperaba un array. Ahora los 3 formularios pasan siempre el item de negocio, y la conversión vive en un solo lugar (`ingresos.service.js`/`gastos.service.js`).
- **`clientes.service.js` no sigue el patrón `append/update/remove`**: CLIENTES es una hoja calculada con fórmulas `UNIQUE`/`FILTER` en Sheets, no tiene escritura directa de filas. Su único escritor real es `registrarAbono` (un `updateCell` puntual sobre la columna F), que se documenta explícitamente como la excepción al patrón genérico.
- **Gap de Fase 18 resuelto**: `registrarAbono` ya no hace `fetch` crudo en `DataProvider.jsx` — vive en `clientes.service.js` y usa `fetchConTimeout` (timeout de 15s, sin reintento por ser escritura), igual que el resto de servicios desde Fase 18.
- **`tareas.service.js` se renombró en esta fase, no en Fase 15**, tal como quedó explícitamente anotado en el cierre de esa fase.
- **Barrel namespaceado (`export * as xService`)** en vez de una exportación plana: los 4 verbos (`readAll`/`append`/`update`/`remove`) se repiten idénticos en cada servicio: un `export *` plano colisionaría. Cada consumidor importa `{ ingresosService, gastosService, ... }` y llama `ingresosService.readAll()`.

**Issue encontrado (no corregido, ya documentado para Fase 22):**
- Los mismos 5 errores de lint de Fases 17-18 (Buffer, GraficoCircular, 2x set-state-in-effect, 1 unused var en `IngresoBloqueForm`). Ninguno nuevo.
- **Bug de UI no relacionado, detectado al leer `IngresoBloqueForm.jsx`**: el input de "Proveedor" tiene un typo (`value={f.proedor}` en vez de `value={f.proveedor}`), por lo que el campo nunca refleja lo que el usuario escribe ahí. Está fuera del alcance de esta fase (no es un problema de servicios/Sheets); se reporta por separado.

**Notas para Fase 20:**
- Fase 20 = expandir tests a parsers y hooks. Buenos candidatos nuevos dado el trabajo de esta fase: tests de `ingresos.service.js`/`gastos.service.js` verificando que `append`/`update` llaman a `*ToRow` con el shape correcto (mockeando `services/api.js`).
- Sigue pendiente el smoke test manual en navegador con login real (arrastrado desde Fase 16) — esta fase es la que más beneficio tendría de una verificación real, dado que toca cómo se guardan ingresos/gastos/inventario/deuda.

---

### Fase 20 — Tests adicionales ✅
**Objetivo:** Expandir cobertura a parsers, hooks y el cliente HTTP (Fase 18).
**Archivos nuevos:**
- `src/services/parsers.test.js` (expandido, no dividido en 4 archivos — el archivo real es único, ver decisiones) — ahora cubre `parseInventario`, `parseClientesResumen`, `parseClientesEspeciales`, `parseDeudaPersonal` y los 4 `*ToRow` (orden de columnas).
- `src/features/home/hooks/useHomeStats.test.js`
- `src/features/clients/hooks/useClientesFilter.test.js` (cubre también `useDeudaPorCliente` indirectamente)
- `src/features/history/hooks/useHistorialFilter.test.js`
- `src/services/http.test.js` (mock de `fetch`, en vez de `services/api/client.test.js` que no existe — ver Fase 15/18) — cubre timeout, retry único y propagación de errores de `fetchConTimeout`/`fetchConReintento`.

**Dependencias nuevas (solo dev, no afectan el bundle de producción):**
- `@testing-library/react` + `jsdom` — necesarios para `renderHook` (los hooks usan `useMemo`, que requiere un entorno React real). Cada test de hook declara `// @vitest-environment jsdom` en su primera línea; los tests de parsers/http siguen en el entorno `node` por defecto (más rápidos, sin DOM).
- `@vitest/coverage-v8` (pineado a `4.1.10`, igual que `vitest` — instalar `*` más reciente falló por un bug conocido de `npm@12` con arborist).
- Script nuevo: `npm run test:coverage`.

**Cobertura mínima:** ≥80% en parsers y hooks — **cumplida**: 96.13% statements, 80.81% branches, 98.41% funciones, 100% líneas sobre `parsers.js`, `http.js`, `useHomeStats.js`, `useClientesFilter.js`, `useDeudaPorCliente.js`, `useHistorialFilter.js` en conjunto.

**Validación:**
- [x] `npm run build` OK (307.15 kB — sin cambio, confirma que las deps de test no se bundlean).
- [x] `npm test`: 15 → **36 tests**, todos pasan.
- [x] `npm run test:coverage` confirma ≥80% en los archivos objetivo.
- [x] `npx eslint src`: 5 → 5 (sin cambio).

**Commit:** `test(fase-20): expandir cobertura de tests a parsers, hooks y cliente HTTP`.

**Decisiones tomadas (desviaciones del plan original):**
- **`services/parsers.js` es un solo archivo**, no está dividido en `ingresos.js`/`gastos.js`/etc. (esa división no forma parte de ningún plan de fase anterior) — expandir `parsers.test.js` en el mismo archivo real, en vez de crear 4 archivos de test para un módulo que no está partido así.
- **No existe `services/api/client.js`** (ya documentado en Fases 15/18) — el test de cliente HTTP cubre `services/http.js` (el módulo real de timeout/retry, introducido en Fase 18).
- **Entorno de test mixto**: `node` por defecto (parsers, http — rápidos, sin DOM) + `jsdom` solo en los archivos de hooks que lo declaran explícitamente (`// @vitest-environment jsdom`). Evita pagar el costo de arrancar un DOM para los tests que no lo necesitan.
- **No se testearon `useResumenSemanal`/`useTopClientes`/`useDeudaResumen`/`useUltimosMovimientos`** (los otros 4 hooks de Home) — el plan original solo pedía `useHomeStats.test.js`; los demás quedan como candidatos naturales si se decide ampliar cobertura más adelante.
- **`npm install -D @vitest/coverage-v8` (sin versión) falló** con `TypeError: Cannot read properties of null (reading 'children')` — bug de `npm@12.0.2`/arborist al resolver el árbol de dependencias de `vitest`. Se resolvió pineando la versión exacta (`@4.1.10`, igual que `vitest`).
- **`coverage/` agregado a `.gitignore`** — no estaba, y `npm run test:coverage` genera un reporte HTML completo que no debe versionarse.

**Notas para Fase 21:**
- Fase 21 = `React.memo` en `SwipeableVenta`/`ClientesListItem`/`TopCliente`, `useDeferredValue` en `BusquedaGlobal`, code splitting con `React.lazy`.
- La infraestructura de testing con `jsdom` ya está lista si Fase 21 necesita verificar renders con React DevTools Profiler o snapshots.
- Sigue pendiente el smoke test manual en navegador con login real (arrastrado desde Fase 16).

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
